/** Update branding metadata without rewriting student content or account names. */
export function formatStudioBrandLabel(label: string): string {
  return label
    .replace(/\b(?:the\s+)?(?:middle\s+school\s+matters|mind\s+matters|mind\s+matter|brightside\s+project)\b/gi, 'The Brightside Wellness Project')
    .replace(/^Grade 5 The Brightside Wellness Project Team$/i, 'Grade 5 Brightside Wellness Project Team');
}

export function normalizeStudioBranding<T>(data: T, teamNames = false): T {
  if (Array.isArray(data)) {
    return data.map(item => normalizeStudioBranding(item, teamNames)) as T;
  }
  if (data === null || typeof data !== 'object') return data;

  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (
      typeof value === 'string' &&
      (key === 'authorDisplay' || key === 'teamName' || (teamNames && key === 'name'))
    ) {
      return [key, formatStudioBrandLabel(value)];
    }
    if (key === 'authorDisplayOptions' && Array.isArray(value)) {
      return [key, [...new Set(value.map(option =>
        typeof option === 'string' ? formatStudioBrandLabel(option) : option,
      ))]];
    }
    return [key, normalizeStudioBranding(value, teamNames)];
  })) as T;
}
