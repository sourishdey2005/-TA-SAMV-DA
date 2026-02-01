
export interface GameState {
  player_id: string;
  current_level: number;
  rta_integrity_score: number;
  established_facts: string[];
  narrative_timeline: string[];
  contradictions: string[];
  corrections: string[];
  emotional_profile: Record<string, any>;
  moral_profile: Record<string, any>;
  deva_opinions: Record<string, string>;
  session_history: Message[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  deva?: string;
  debug?: string;
}

export enum DevaName {
  SMURTI = 'SMṚTI',
  BUDDHI = 'BUDDHI',
  MANAS = 'MANAS',
  MAYA = 'MĀYĀ',
  KARMA = 'KARMA'
}
