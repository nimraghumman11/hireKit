import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { KIT_KEYS } from './useKits';

export type StepStatus = 'idle' | 'active' | 'done';

export type GenerationStep = {
  label: string;
  status: StepStatus;
};

export type SectionPreview = {
  section: string;
  label: string;
  tokens: string; // accumulated raw text so far
  done: boolean;
};

/** Must match STEPS order in ai-service/main.py */
const STEPS: Omit<GenerationStep, 'status'>[] = [
  { label: 'Parsing role description' },
  { label: 'Validating role details' },
  { label: 'Retrieving industry context' },
  { label: 'Generating all sections' },
  { label: 'Checking inclusive language' },
  { label: 'Assembling your kit' },
];

const NODE_TO_STEP: Record<string, number> = {
  parse_role:     0,
  validate:       1,
  rag:            2,
  parallel_gen:   3,
  language_check: 4,
  assemble:       5,
};

const SECTION_LABELS: Record<string, string> = {
  jobDescription:      'Job Description',
  behavioralQuestions: 'Behavioral Questions',
  technicalQuestions:  'Technical Questions',
  scorecard:           'Scorecard',
  rubric:              'Skills Rubric',
};

function parseSSEBlock(block: string): { eventType: string; eventData: string } {
  let eventType = 'message';
  let eventData = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) eventType = line.slice(7).trim();
    if (line.startsWith('data: '))  eventData = line.slice(6).trim();
  }
  return { eventType, eventData };
}

export function useKitGenerate() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const { addToast } = useUiStore();

  const [steps, setSteps] = useState<GenerationStep[]>(
    STEPS.map((s) => ({ ...s, status: 'idle' })),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending,    setIsPending]    = useState(false);
  const [previews,     setPreviews]     = useState<SectionPreview[]>([]);

  const generate = useCallback(
    async ({ description }: { description: string }) => {
      setIsPending(true);
      setIsGenerating(false);
      setSteps(STEPS.map((s) => ({ ...s, status: 'idle' })));
      setPreviews([]);

      const token  = useAuthStore.getState().token;
      const apiUrl = import.meta.env.VITE_API_URL as string;

      let response: Response;
      try {
        response = await fetch(`${apiUrl}/interview-kit/generate-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description }),
        });
      } catch {
        setIsPending(false);
        addToast({ variant: 'error', message: 'Could not connect to the server.' });
        return;
      }

      if (!response.ok) {
        setIsPending(false);
        addToast({ variant: 'error', message: 'Failed to start kit generation.' });
        return;
      }

      setIsPending(false);
      setIsGenerating(true);

      const reader  = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let kitId: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by double newlines
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            if (!block.trim()) continue;
            const { eventType, eventData } = parseSSEBlock(block);
            if (!eventData) continue;

            const data = JSON.parse(eventData) as Record<string, unknown>;

            switch (eventType) {
              case 'created': {
                kitId = data['kitId'] as string;
                break;
              }

              case 'progress': {
                const node = data['node'] as string;
                const idx  = NODE_TO_STEP[node];
                if (idx !== undefined) {
                  setSteps((prev) =>
                    prev.map((s, i) => ({
                      ...s,
                      status: i < idx ? 'done' : i === idx ? 'active' : 'idle',
                    })),
                  );
                }
                break;
              }

              case 'section_start': {
                const section = data['section'] as string;
                setPreviews((prev) => {
                  // add if not already present
                  if (prev.some((p) => p.section === section)) return prev;
                  return [
                    ...prev,
                    {
                      section,
                      label: SECTION_LABELS[section] ?? section,
                      tokens: '',
                      done: false,
                    },
                  ];
                });
                break;
              }

              case 'token': {
                const section = data['section'] as string;
                const chunk   = data['chunk']   as string;
                setPreviews((prev) =>
                  prev.map((p) =>
                    p.section === section
                      ? { ...p, tokens: p.tokens + chunk }
                      : p,
                  ),
                );
                break;
              }

              case 'section_done': {
                const section = data['section'] as string;
                setPreviews((prev) =>
                  prev.map((p) =>
                    p.section === section ? { ...p, done: true } : p,
                  ),
                );
                break;
              }

              case 'complete': {
                setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
                queryClient.invalidateQueries({ queryKey: KIT_KEYS.all });
                setTimeout(() => {
                  setIsGenerating(false);
                  setPreviews([]);
                  if (kitId) navigate(`/kits/${kitId}/results`);
                }, 600);
                break;
              }

              case 'error': {
                setIsGenerating(false);
                addToast({
                  variant: 'error',
                  message: (data['message'] as string) ?? 'Kit generation failed.',
                });
                break;
              }
            }
          }
        }
      } catch {
        setIsGenerating(false);
        addToast({ variant: 'error', message: 'Connection lost during generation.' });
      }
    },
    [navigate, queryClient, addToast],
  );

  return { generate, isGenerating, steps, isPending, previews };
}
