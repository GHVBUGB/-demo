export interface Word {
  id: number;
  word: string;
  syllables?: string;
  ipa?: string;
  grade_level?: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  created_at: string;
  issue_count?: number;
}

export interface Meaning {
  id: number;
  word_id: number;
  pos: string;
  definition: string;
  chunk?: string;
  sentence?: string;
  sentence_cn?: string;
  sources?: string[];
}

export interface Mnemonic {
  id: number;
  word_id: number;
  type: string;
  formula: string;
  rhyme: string;
  teacher_script: string;
}

export interface QualityIssue {
  id: number;
  word_id: number;
  field: string;
  issue: string;
  retry_count: number;
}

export interface WordDetail extends Word {
  meanings: Meaning[];
  mnemonic?: Mnemonic;
  issues: QualityIssue[];
}
