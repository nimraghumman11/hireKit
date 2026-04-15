import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface TestWrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

function TestWrapper({ children, initialEntries = ['/'] }: TestWrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[] },
) {
  const { initialEntries, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper initialEntries={initialEntries}>{children}</TestWrapper>
    ),
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { customRender as render };
