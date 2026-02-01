
import { GameState } from './types';

const STORAGE_KEY = 'rta_samvada_state';

export const saveGameState = (state: GameState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadGameState = (): GameState | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const resetGameState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const createInitialState = (): GameState => ({
  player_id: `soul_${Math.random().toString(36).substr(2, 9)}`,
  current_level: 1,
  rta_integrity_score: 100,
  established_facts: [],
  narrative_timeline: [],
  contradictions: [],
  corrections: [],
  emotional_profile: {},
  moral_profile: {},
  deva_opinions: {},
  session_history: []
});
