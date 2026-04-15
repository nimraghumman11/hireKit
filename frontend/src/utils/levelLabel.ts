/** Human-readable level labels for kit results UI */
export function formatExperienceLevel(level: string): string {
  const map: Record<string, string> = {
    junior: 'Junior (0–2 years)',
    mid: 'Mid-Level (2–5 years)',
    senior: 'Senior (5–8 years)',
    lead: 'Lead (8+ years)',
    principal: 'Principal',
    director: 'Director',
  };
  return map[level] ?? level;
}

export function formatWorkMode(mode: string): string {
  const m = mode.toLowerCase();
  if (m === 'onsite') return 'On-site';
  return m.charAt(0).toUpperCase() + m.slice(1);
}
