/**
 * Safety keyword scanner for student-submitted content.
 * Matches never punish or notify the student — they only create a private
 * teacher_attention_recommended flag for the teacher to review.
 */

const CRISIS_TERMS = [
  'suicide', 'suicidal', 'kill myself', 'want to die', 'end my life',
  'end it all', 'self-harm', 'self harm', 'cutting myself', 'hurt myself',
  'not want to be here', 'no reason to live', 'nobody cares if i die',
  'overdose', 'run away from home',
];

const MEDICAL_ADVICE_TERMS = [
  'diagnose', 'diagnosis', 'diagnoses', 'prescription', 'prescribe',
  'medication dosage', 'take this medication', 'medical treatment plan',
  'cure for depression', 'cure for anxiety',
];

const INAPPROPRIATE_TERMS: string[] = [
  // Common profanity patterns kept minimal and non-enumerated here;
  // add specific school-policy terms as needed
];

const PII_PATTERNS = [
  /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/, // SSN
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone number
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
];

export interface FlagResult {
  flagged: boolean;
  reasons: string[];
}

export function checkContent(text: string): FlagResult {
  const lower = text.toLowerCase();
  const reasons: string[] = [];

  for (const term of CRISIS_TERMS) {
    if (lower.includes(term)) {
      reasons.push(`Crisis-related term: "${term}"`);
    }
  }

  for (const term of MEDICAL_ADVICE_TERMS) {
    if (lower.includes(term)) {
      reasons.push(`Medical advice term: "${term}"`);
    }
  }

  for (const term of INAPPROPRIATE_TERMS) {
    if (lower.includes(term)) {
      reasons.push(`Inappropriate term: "${term}"`);
    }
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push('Possible personal identifying information detected');
      break;
    }
  }

  return {
    flagged: reasons.length > 0,
    reasons,
  };
}
