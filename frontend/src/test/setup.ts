import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Silence console.error in tests unless explicitly needed
const originalError = console.error;
afterEach(() => {
  console.error = originalError;
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

// jsdom has no matchMedia — ThemeToggle and similar hooks need a stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
