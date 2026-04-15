import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitService } from '@/services/kit.service';
import { useUiStore } from '@/store/uiStore';
import type { KitListParams } from '@/types/api.types';
import type { InterviewKit, ScorecardItem } from '@/types/kit.types';

export const KIT_KEYS = {
  all: ['kits'] as const,
  list: (params: KitListParams) => [...KIT_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...KIT_KEYS.all, 'detail', id] as const,
  status: (id: string) => [...KIT_KEYS.all, 'status', id] as const,
};

export function useKits(params: KitListParams = {}) {
  return useQuery({
    queryKey: KIT_KEYS.list(params),
    queryFn: () => kitService.list(params),
  });
}

export function useKit(id: string) {
  return useQuery({
    queryKey: KIT_KEYS.detail(id),
    queryFn: () => kitService.getById(id),
    enabled: !!id,
  });
}

export function useSharedKit(token: string) {
  return useQuery({
    queryKey: ['shared-kit', token],
    queryFn: () => kitService.getByShareToken(token),
    enabled: !!token,
  });
}

export function useDeleteKit() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: (id: string) => kitService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIT_KEYS.all });
      addToast({ variant: 'success', message: 'Interview kit deleted.' });
    },
    onError: () => {
      addToast({ variant: 'error', message: 'Failed to delete kit.' });
    },
  });
}

export function useDuplicateKit() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: (id: string) => kitService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIT_KEYS.all });
      addToast({ variant: 'success', message: 'Kit duplicated successfully.' });
    },
    onError: () => {
      addToast({ variant: 'error', message: 'Failed to duplicate kit.' });
    },
  });
}

export function useUpdateScorecard() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: ({ id, scorecard }: { id: string; scorecard: ScorecardItem[] }) =>
      kitService.updateScorecard(id, scorecard),
    onSuccess: (data: InterviewKit) => {
      queryClient.setQueryData(KIT_KEYS.detail(data.id), data);
      addToast({ variant: 'success', message: 'Scorecard saved.' });
    },
    onError: () => {
      addToast({ variant: 'error', message: 'Failed to save scorecard.' });
    },
  });
}

/** Save inline edits to one or more kit sections */
export function useUpdateKitSections() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InterviewKit> }) =>
      kitService.updateSections(id, updates),
    onSuccess: (data: InterviewKit) => {
      queryClient.setQueryData(KIT_KEYS.detail(data.id), data);
      addToast({ variant: 'success', message: 'Changes saved.' });
    },
    onError: () => {
      addToast({ variant: 'error', message: 'Failed to save changes.' });
    },
  });
}

/** Regenerate a single section of a kit */
export function useRegenerateSection(kitId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: (section: string) => kitService.regenerateSection(kitId, section),
    onSuccess: ({ kit, section }) => {
      queryClient.setQueryData(KIT_KEYS.detail(kit.id), kit);
      addToast({ variant: 'success', message: `${section.replace(/-/g, ' ')} regenerated.` });
    },
    onError: (_err, section) => {
      addToast({ variant: 'error', message: `Failed to regenerate ${section}.` });
    },
  });
}

/** Get or create a shareable public link */
export function useShareKit(kitId: string) {
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: () => kitService.getShareToken(kitId),
    onSuccess: ({ shareToken }) => {
      const url = `${window.location.origin}/shared/${shareToken}`;
      navigator.clipboard.writeText(url).catch(() => {});
      addToast({
        variant: 'success',
        message: 'Share link copied to clipboard!',
        action: { label: 'Open', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') },
      });
    },
    onError: () => {
      addToast({ variant: 'error', message: 'Failed to generate share link.' });
    },
  });
}
