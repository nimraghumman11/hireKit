import api from './api';
import type {
  InterviewKit,
  KitGeneratePayload,
  KitStatusResponse,
  ScorecardItem,
  RegenerateSectionResponse,
  ShareTokenResponse,
} from '@/types/kit.types';
import type { KitListParams } from '@/types/api.types';

interface KitListPayload {
  items: InterviewKit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const kitService = {
  list: async (params: KitListParams): Promise<InterviewKit[]> => {
    const res = (await api.get('/interview-kit', { params })) as KitListPayload | InterviewKit[];
    return Array.isArray(res) ? res : res.items ?? [];
  },

  getById: (id: string): Promise<InterviewKit> =>
    api.get(`/interview-kit/${id}`),

  getByShareToken: (token: string): Promise<InterviewKit> =>
    api.get(`/public/kit/${token}`),

  getStatus: (id: string): Promise<KitStatusResponse> =>
    api.get(`/interview-kit/${id}/status`),

  generate: (payload: KitGeneratePayload): Promise<InterviewKit> =>
    api.post('/interview-kit/generate', payload),

  /** Inline-edit: save one or more sections back to the server */
  updateSections: (id: string, updates: Partial<InterviewKit>): Promise<InterviewKit> =>
    api.patch(`/interview-kit/${id}`, updates),

  update: (id: string, payload: Partial<InterviewKit>): Promise<InterviewKit> =>
    api.put(`/interview-kit/${id}`, payload),

  remove: (id: string): Promise<void> =>
    api.delete(`/interview-kit/${id}`),

  duplicate: (id: string): Promise<InterviewKit> =>
    api.post(`/interview-kit/${id}/duplicate`),

  exportPdf: (id: string): Promise<{ url: string }> =>
    api.post(`/interview-kit/${id}/export/pdf`),

  exportDocx: (id: string): Promise<{ url: string }> =>
    api.post(`/interview-kit/${id}/export/docx`),

  updateScorecard: (id: string, scorecard: ScorecardItem[]): Promise<InterviewKit> =>
    api.put(`/interview-kit/${id}/scorecard`, { scorecard }),

  regenerateSection: (id: string, section: string): Promise<RegenerateSectionResponse> =>
    api.post(`/interview-kit/${id}/regenerate/${section}`),

  getShareToken: (id: string): Promise<ShareTokenResponse> =>
    api.post(`/interview-kit/${id}/share`),
};
