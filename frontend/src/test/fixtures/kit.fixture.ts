import type { InterviewKit } from '@/types/kit.types';

export const kitFixture: InterviewKit = {
  id: 'kit-1',
  roleTitle: 'Senior Frontend Engineer',
  department: 'Engineering',
  experienceLevel: 'senior',
  workMode: 'remote',
  teamSize: '6-15',
  status: 'generated',
  jobDescription: {
    summary: 'We are seeking an experienced Frontend Engineer to join our team.',
    responsibilities: [
      'Lead frontend architecture decisions',
      'Mentor junior engineers',
      'Collaborate with design and product',
    ],
    requiredSkills: ['TypeScript', 'React', 'CSS'],
    niceToHaveSkills: ['GraphQL', 'AWS'],
    salaryRange: '$140k–$180k',
    workMode: 'remote',
  },
  behavioralQuestions: [
    {
      id: 'bq-1',
      question: 'Tell me about a time you led a major refactor.',
      competency: 'Technical Leadership',
      evalCriteria: 'Look for systematic approach and stakeholder buy-in.',
      followUps: ['How did you handle resistance?'],
      scoringGuide: {
        '1': 'No clear structure or outcome.',
        '3': 'Good process, mixed outcome.',
        '5': 'Clear impact and learning.',
      },
    },
  ],
  technicalQuestions: [
    {
      id: 'tq-1',
      question: 'Explain how React reconciliation works.',
      difficulty: 'medium',
      topic: 'React',
      evalCriteria: 'Should explain virtual DOM diffing.',
      sampleAnswer: 'React compares virtual DOM trees to find minimal DOM updates.',
      redFlags: ['Confuses reconciliation with re-rendering'],
    },
  ],
  scorecard: [
    {
      competency: 'Technical Skills',
      weight: 0.4,
      score: 4,
      notes: '',
    },
    {
      competency: 'Communication',
      weight: 0.3,
      score: 3,
      notes: '',
    },
    {
      competency: 'Culture Fit',
      weight: 0.3,
      score: 5,
      notes: '',
    },
  ],
  rubric: [
    {
      skill: 'React',
      proficiencyLevels: {
        novice: 'Can build basic components.',
        intermediate: 'Understands hooks and state management.',
        advanced: 'Designs scalable component architecture.',
        expert: 'Contributes to React ecosystem; optimizes at scale.',
      },
    },
  ],
  languageIssues: [],
  createdAt: '2026-04-10T10:00:00.000Z',
  updatedAt: '2026-04-10T10:05:00.000Z',
};

export const draftKitFixture: InterviewKit = {
  ...kitFixture,
  id: 'kit-2',
  roleTitle: 'Product Manager',
  status: 'draft',
  behavioralQuestions: [],
  technicalQuestions: [],
  scorecard: [],
  rubric: [],
};
