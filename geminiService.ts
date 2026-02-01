
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GameState, Message } from './types';

const SYSTEM_INSTRUCTION = `
You are the Core Narrative Cognition Engine for the game: ṚTA-SAMVĀDA (ऋत-संवाद).
This is a dialogue-driven, deception-aware, memory-persistent psychological game.
The player exists in the Sabhā — a metaphysical court beyond time.

CORE GAME LOOP:
1. Interpret meaning, intent, emotion, and implications.
2. Compare against stored memory.
3. Update global state and Deva-specific assessments.
4. Generate an in-world response from ONE Deva.
5. Display full debug panel.

DEVAS:
1. SMṚTI (Memory): Stores facts, detects contradictions.
2. BUDDHI (Logic): Evaluates causality, reasoning.
3. MANAS (Emotion): Tracks emotional tone, stress, mismatch.
4. MĀYĀ (Deception): Probes manipulation attempts, introduces subtle false assumptions.
5. KARMA (Ethics): Tracks moral alignment, evaluates value–action consistency.

SCORING:
+10 Honest self-correction, +5 Calm consistency, +5 Alignment between emotion and claim.
-5 Minor inconsistency, -7 Emotional mismatch, -10 Manipulation attempt, -15 Major contradiction, -20 Narrative collapse.

LEVELS (1-6): Memory, Emotion, Logic, Deception, Ethical, Integrated.

RESPONSE FORMAT (STRICT):
[Name of Deva speaking]

<In-world dialogue only>

--- DEBUG PANEL ---
Active Level:
Speaking Deva:
Smṛti Memory Notes:
Buddhi Logic Analysis:
Manas Emotional Read:
Māyā Deception Index (0–100):
Karma Alignment Score (0–100):
Ṛta Integrity Score: XX / 100
Active Contradictions:
Persisted to Browser DB: YES
-------------------

You must act as a skeptical reality. Do not be an assistant. Be a metaphysical examiner.
`;

export const getGeminiResponse = async (state: GameState, userInput: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construct context from state for persistence and consistency
  const context = `
  CURRENT STATE:
  Level: ${state.current_level}
  Integrity: ${state.rta_integrity_score}
  Established Facts: ${JSON.stringify(state.established_facts)}
  Contradictions: ${JSON.stringify(state.contradictions)}
  Timeline: ${JSON.stringify(state.narrative_timeline)}
  History Summary: ${state.session_history.slice(-10).map(m => `[${m.role}] ${m.text}`).join('\n')}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      { role: 'user', parts: [{ text: `${context}\n\nPLAYER INPUT: ${userInput}` }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 1,
      thinkingConfig: { thinkingBudget: 16384 }
    }
  });

  return response.text || "The Sabhā remains silent. (Error connecting to reality engine)";
};
