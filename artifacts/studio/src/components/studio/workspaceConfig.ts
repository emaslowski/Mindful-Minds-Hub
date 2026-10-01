export interface SectionDef {
  key: string;
  label: string;
  placeholder: string;
  rows?: number;
  short?: boolean;
  prompt?: string;
}

export interface WorkspaceConfig {
  jobGroup: string;
  emoji: string;
  accent: string;
  bg: string;
  intro: string;
  tips: string[];
  sections: SectionDef[];
}