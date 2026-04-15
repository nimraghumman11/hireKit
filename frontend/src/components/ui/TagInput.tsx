import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';

interface TagInputProps {
  label?: string;
  /** When label is rendered outside the component */
  ariaLabel?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  id?: string;
}

/** Split on ASCII or full-width comma; trim; drop empties */
function splitSkillParts(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TagInput({
  label,
  ariaLabel,
  tags,
  onChange,
  placeholder,
  error,
  className,
  id,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  /** Add one or many chips from a string (e.g. comma-separated paste or "a, b, c") */
  const commitInput = (raw: string) => {
    const parts = splitSkillParts(raw);
    if (parts.length === 0) {
      setInputValue('');
      return;
    }
    const merged = [...tags];
    for (const part of parts) {
      if (!merged.includes(part)) merged.push(part);
    }
    const unchanged =
      merged.length === tags.length && merged.every((t, i) => t === tags[i]);
    if (!unchanged) {
      onChange(merged);
    }
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitInput(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (text.includes(',') || text.includes('，')) {
      e.preventDefault();
      commitInput(inputValue + text);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex min-h-[2.75rem] flex-wrap gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm transition-shadow focus-within:ring-2',
          'dark:bg-slate-900/50',
          error
            ? 'border-red-400 focus-within:ring-red-200 dark:border-red-500'
            : 'border-slate-200/90 focus-within:border-violet-400 focus-within:ring-violet-500/20 dark:border-slate-600',
        )}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-1 text-xs font-medium text-violet-800 dark:bg-violet-900/60 dark:text-violet-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              aria-label={`Remove ${tag}`}
              className="text-violet-600 hover:text-violet-800 dark:text-violet-300"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (inputValue.trim()) commitInput(inputValue);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          aria-label={ariaLabel ?? label ?? 'Add skills'}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>}
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Type skills separated by commas, or press Enter after each — chips are created automatically
      </p>
    </div>
  );
}
