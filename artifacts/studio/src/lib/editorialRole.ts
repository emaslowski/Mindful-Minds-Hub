export function isEditorialGroup(jobTitle?: string | null): boolean {
  return /^editors?anddesigners?$/.test((jobTitle ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, ''));
}
