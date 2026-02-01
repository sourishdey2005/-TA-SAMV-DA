
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Message, DevaName } from './types';
import { loadGameState, saveGameState, createInitialState, resetGameState } from './storage';
import { getGeminiResponse } from './geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(loadGameState() || createInitialState());
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.session_history]);

  const parseAIResponse = (raw: string): { deva: string; dialogue: string; debug: string } => {
    const debugMarker = '--- DEBUG PANEL ---';
    const splitIndex = raw.indexOf(debugMarker);
    
    let content = raw;
    let debug = '';
    
    if (splitIndex !== -1) {
      content = raw.substring(0, splitIndex).trim();
      debug = raw.substring(splitIndex + debugMarker.length).replace(/-------------------/g, '').trim();
    }

    const lines = content.split('\n');
    let deva = 'Unknown Deva';
    let dialogue = content;

    if (lines.length > 0 && lines[0].startsWith('[') && lines[0].endsWith(']')) {
      deva = lines[0].slice(1, -1);
      dialogue = lines.slice(1).join('\n').trim();
    }

    return { deva, dialogue, debug };
  };

  const updateStateFromDebug = (debug: string) => {
    // Attempt to extract key stats from debug string using regex
    const integrityMatch = debug.match(/Ṛta Integrity Score:\s*(\d+)/i);
    const levelMatch = debug.match(/Active Level:\s*(\d+)/i);
    const contradictionsMatch = debug.match(/Active Contradictions:\s*(.*)/i);

    setGameState(prev => {
      const newState = { ...prev };
      if (integrityMatch) newState.rta_integrity_score = parseInt(integrityMatch[1]);
      if (levelMatch) newState.current_level = parseInt(levelMatch[1]);
      if (contradictionsMatch && contradictionsMatch[1].trim() !== 'None') {
        const cList = contradictionsMatch[1].split(',').map(s => s.trim());
        newState.contradictions = Array.from(new Set([...newState.contradictions, ...cList]));
      }
      
      // Automatic Failure State
      if (newState.rta_integrity_score <= 0) {
        alert("NARRATIVE DISSOLUTION INITIATED. YOUR IDENTITY HAS COLLAPSED.");
        return createInitialState();
      }

      saveGameState(newState);
      return newState;
    });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: inputText };
    const updatedHistory = [...gameState.session_history, userMessage];
    
    setGameState(prev => ({ ...prev, session_history: updatedHistory }));
    setIsLoading(true);
    setInputText('');

    try {
      const rawResponse = await getGeminiResponse(gameState, inputText);
      const { deva, dialogue, debug } = parseAIResponse(rawResponse);
      
      const aiMessage: Message = { 
        role: 'model', 
        text: dialogue, 
        deva, 
        debug 
      };

      setGameState(prev => ({
        ...prev,
        session_history: [...prev.session_history, aiMessage]
      }));

      updateStateFromDebug(debug);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = { role: 'model', text: "The threads of reality are tangled. Please try again.", deva: "SYSTEM" };
      setGameState(prev => ({ ...prev, session_history: [...prev.session_history, errorMessage] }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-[#e5e5e5] font-mono selection:bg-amber-900/40">
      {/* Left Sidebar - Stats */}
      <div className="w-64 glass border-r border-white/5 p-6 flex flex-col gap-8">
        <div>
          <h1 className="cinzel text-xl font-bold tracking-widest text-amber-500 mb-2">ṚTA-SAMVĀDA</h1>
          <p className="text-[10px] opacity-40 uppercase tracking-tighter">Narrative Cognition Engine v3.1</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase opacity-50">Sabhā Level</label>
            <div className="text-2xl font-bold text-indigo-400">0{gameState.current_level}</div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500" style={{ width: `${(gameState.current_level / 6) * 100}%` }}></div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase opacity-50">Ṛta Integrity</label>
            <div className={`text-2xl font-bold ${gameState.rta_integrity_score > 60 ? 'text-amber-500' : 'text-red-500'}`}>
              {gameState.rta_integrity_score}%
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className={`h-full ${gameState.rta_integrity_score > 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${gameState.rta_integrity_score}%` }}></div>
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <label className="text-[10px] uppercase opacity-50">Identified Contradictions</label>
            <div className="text-sm font-bold text-red-400">
              {gameState.contradictions.length} / 5
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={() => { if(confirm("Restart Narrative?")) { resetGameState(); setGameState(createInitialState()); } }}
            className="w-full py-2 text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-colors"
          >
            Dissolve Self (Restart)
          </button>
        </div>
      </div>

      {/* Main Content - Chat */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Subtle Sanskrit */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
          <span className="devanagari text-[30vw]">सत्यम्</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 relative z-10">
          {gameState.session_history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
              <div className="w-24 h-24 rounded-full border border-amber-500/30 flex items-center justify-center rta-pulse">
                <span className="cinzel text-amber-500 text-3xl">ॐ</span>
              </div>
              <p className="cinzel text-lg italic text-amber-200/60">"Truth is not binary — it must be coherent."</p>
              <p className="text-sm opacity-50 leading-relaxed">
                You stand before the Sabhā. The Devas watch. Every claim you make is woven into your Ṛta. 
                Do not falter. Do not contradict.
              </p>
              <button 
                onClick={() => setInputText("I am ready to be judged.")}
                className="px-6 py-2 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-colors text-xs tracking-widest uppercase"
              >
                Begin Prostration
              </button>
            </div>
          )}

          {gameState.session_history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl space-y-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.deva && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold mb-1 block">
                    {msg.deva}
                  </span>
                )}
                <div className={`p-4 ${msg.role === 'user' ? 'bg-indigo-900/20 border border-indigo-500/20 text-indigo-100' : 'text-white/90 leading-relaxed'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl space-y-2 animate-pulse">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mb-1 block">The Sabhā Reasons...</div>
                <div className="h-4 w-64 bg-white/5 rounded"></div>
                <div className="h-4 w-48 bg-white/5 rounded"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-white/5 bg-[#050505]/80 relative z-20">
          <div className="max-w-3xl mx-auto flex gap-4">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Speak your truth..."
              className="flex-1 bg-white/5 border border-white/10 px-6 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="px-8 bg-amber-600 hover:bg-amber-700 disabled:opacity-30 disabled:hover:bg-amber-600 text-white font-bold uppercase text-xs tracking-widest transition-all"
            >
              Utter
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Debug Panel */}
      {showDebug && (
        <div className="w-80 glass border-l border-white/5 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest text-amber-500/50 font-bold">Debug Panel</h2>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse"></div>
               <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-4 opacity-70">
            {gameState.session_history.slice().reverse().find(m => m.debug)?.debug ? (
              <pre className="whitespace-pre-wrap leading-tight text-emerald-400/80">
                {gameState.session_history.slice().reverse().find(m => m.debug)?.debug}
              </pre>
            ) : (
              <div className="italic text-white/20">Awaiting narrative input for cognitive dump...</div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-[9px] uppercase tracking-tighter opacity-30">
            Memory Persistence: ACTIVE<br/>
            Neural Sync: NOMINAL<br/>
            Cognitive Entropy: {100 - gameState.rta_integrity_score}%
          </div>
        </div>
      )}
      
      {/* Debug Toggle Button (Fixed bottom right) */}
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50 p-2 text-[10px] bg-black/50 border border-white/10 hover:bg-white/10 transition-colors opacity-50"
      >
        {showDebug ? '[HIDE DEBUG]' : '[SHOW DEBUG]'}
      </button>
    </div>
  );
};

export default App;
