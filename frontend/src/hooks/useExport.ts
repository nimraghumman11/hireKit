import { useMutation } from '@tanstack/react-query';
import { kitService } from '@/services/kit.service';
import { useUiStore } from '@/store/uiStore';

export function useExportPdf(kitId: string) {
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: () => kitService.exportPdf(kitId),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      addToast({
        variant: 'success',
        message: 'PDF ready!',
        action: { label: 'Open PDF', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') },
      });
    },
    onError: () => {
      addToast({ variant: 'error', message: 'Failed to generate PDF. Please try again.' });
    },
  });
}

export function useExportDocx(kitId: string) {
  const { addToast } = useUiStore();

  return useMutation({
    mutationFn: () => kitService.exportDocx(kitId),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      addToast({
        variant: 'success',
        message: 'Word document ready!',
        action: { label: 'Download DOCX', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') },
      });
    },
    onError: () => {
      addToast({ variant: 'error', message: 'Failed to generate Word document. Please try again.' });
    },
  });
}
