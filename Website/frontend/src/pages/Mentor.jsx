import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaderboard, analyzeBuild } from '../lib/api';
import { Brain, BookOpen, Sparkles, Loader2, AlertCircle, RefreshCw, Target, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Mentor = () => {
  const { charName } = useParams();
  const navigate = useNavigate();

  // States
  const [userData, setUserData] = useState(null);
  const [calcId, setCalcId] = useState('');
  const [contextData, setContextData] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorFragment, setErrorFragment] = useState(null);

  // Constants
  const LOADING_MESSAGES = [
    "Analyzing character scaling...",
    "Reviewing leaderboard benchmarks...",
    "Filtering artifact inventory...",
    "Calculating optimal stat distribution...",
    "Verifying Energy Recharge constraints...",
    "Selecting best 5-piece combination...",
    "Drafting final report..."
  ];

  const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast & Good)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Smarter)' },
    { id: 'gemini-pro-latest', name: 'Gemini Pro Latest (Experimental)' }
  ];

  // Effects
  useEffect(() => {
    const stored = sessionStorage.getItem('user_data');
    if (!stored) {
      navigate('/home');
      return;
    }
    const parsed = JSON.parse(stored);
    setUserData(parsed);
    const char = parsed.find(c => c.stats.Character === charName);
    if (!char) navigate('/dashboard');
  }, [charName, navigate]);

  useEffect(() => {
    let interval;
    if (loadingAI) {
      setLoadingMessage(LOADING_MESSAGES[0]);
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[i]);
      }, 3000); // Slightly slower cycle for better readability
    } else {
      setLoadingMessage('');
    }
    return () => clearInterval(interval);
  }, [loadingAI]);

  // Handlers
  const handleFetchContext = async () => {
    if (!calcId) return;
    setLoadingContext(true);
    setErrorFragment(null);
    try {
      const res = await getLeaderboard(calcId);
      setContextData(res.data);
    } catch (err) {
      console.error(err);
      setErrorFragment("Failed to fetch leaderboard. Check ID.");
    } finally {
      setLoadingContext(false);
    }
  };

  const handleAnalyze = async () => {
    const apiKey = localStorage.getItem('gemini_key');
    if (!apiKey) {
      navigate('/');
      return;
    }
    setLoadingAI(true);
    setErrorFragment(null);
    try {
      const res = await analyzeBuild(apiKey, userData, contextData, charName, selectedModel);
      setAnalysis(res.analysis);
    } catch (err) {
      console.error(err);
      setErrorFragment(err.response?.data?.detail || "AI Analysis Failed. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleReset = () => {
    setAnalysis('');
    setErrorFragment(null);
    // Optionally keep context/calcId for quick re-runs
  };

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-slate-700">
          <div className="p-5 bg-gradient-to-br from-teal-600/30 to-cyan-600/20 rounded-2xl border border-teal-700/40 shadow-md">
            <Brain className="text-teal-400" size={40} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-400">
              Mentor Mode: {charName}
            </h1>
            <p className="text-lg text-slate-300 mt-2">AI-powered build optimization & theorycrafting assistant</p>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Controls (Sticky on lg+) */}
          <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-8 lg:self-start">
            {/* Context Card */}
            <div className="bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-5">
                <BookOpen className="text-teal-400" size={22} /> Context Data
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Input an Akasha Leaderboard ID to benchmark against top {charName} builds.
              </p>
              <input
                type="text"
                placeholder="e.g. 12345"
                value={calcId}
                onChange={(e) => setCalcId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none transition"
              />
              <button
                onClick={handleFetchContext}
                disabled={loadingContext || !calcId || contextData}
                className={`mt-4 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  contextData
                    ? 'bg-teal-900/50 text-teal-300 border border-teal-700 cursor-default'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md hover:shadow-lg'
                } disabled:opacity-50`}
              >
                {loadingContext && <Loader2 className="animate-spin" size={18} />}
                {loadingContext ? 'Loading...' : contextData ? 'Context Loaded ✓' : 'Load Benchmark'}
              </button>
            </div>

            {/* Benchmark Preview (if loaded) */}
            {contextData && (
              <div className="bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-bold flex items-center gap-3 mb-4 uppercase tracking-wide">
                  <Target className="text-yellow-400" size={20} /> Top Builds Preview
                </h3>
                <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar">
                  {contextData.map((entry, i) => (
                    <div key={i} className="bg-slate-900/60 p-4 rounded-xl flex justify-between items-center text-sm border border-slate-800 hover:border-slate-600 transition">
                      <div className="flex items-center gap-3">
                        <span className="bg-teal-900/60 text-teal-300 font-bold px-2.5 py-1 rounded text-xs">#{i + 1}</span>
                        <span>CR/CD: <strong className="text-white">{entry['Crit Ratio'] || 'N/A'}</strong></span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{entry['Set'] || 'Mixed'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Controls */}
            <div className="bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-lg space-y-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-3 mb-4">
                  <Brain className="text-cyan-400" size={20} /> AI Model
                </h3>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 pr-10 text-sm appearance-none focus:border-cyan-500 transition"
                  >
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!contextData || loadingAI}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
              >
                {loadingAI ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin" size={28} />
                    <span className="text-base animate-pulse">{loadingMessage}</span>
                  </div>
                ) : (
                  <>
                    <Sparkles size={24} className="text-yellow-300" /> Generate Guide
                  </>
                )}
              </button>

              {errorFragment && (
                <div className="p-4 bg-red-950/40 border border-red-600/50 rounded-xl text-red-300 text-sm flex items-start gap-3">
                  <AlertCircle size={20} className="mt-0.5 text-red-400 shrink-0" />
                  {errorFragment}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9">
            <div className={`bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-10 min-h-[70vh] backdrop-blur-sm transition-all duration-300 ${loadingAI ? 'opacity-60 pointer-events-none' : ''}`}>
              {!analysis && !loadingAI ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-8 py-20">
                  <Layers size={100} strokeWidth={1} className="text-slate-700" />
                  <p className="text-2xl font-medium text-center">Load benchmark context and hit Generate to unlock AI insights.</p>
                </div>
              ) : (
                <div className="space-y-12 relative">
                  {analysis && !loadingAI && (
                    <button
                      onClick={handleReset}
                      className="absolute top-0 right-0 z-10 flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-sm font-medium transition shadow-md"
                    >
                      <RefreshCw size={16} /> New Analysis
                    </button>
                  )}

                  {(() => {
                    try {
                      const cleaned = analysis.replace(/```json|```/g, '').trim();
                      const jsonData = JSON.parse(cleaned);
                      const slotMap = { Flower: 1, Plume: 2, Sands: 3, Goblet: 4, Circlet: 5 };

                      return (
                        <div className="space-y-12 animate-fade-in">
                          {/* Final Stats Summary */}
                          {jsonData.final_stats && (
                            <section className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-8 rounded-2xl border border-teal-900/40 shadow-xl relative overflow-hidden">
                              <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
                                <Target size={160} className="text-teal-500" />
                              </div>
                              <h3 className="text-2xl font-bold flex items-center gap-4 mb-8 relative z-10">
                                <Target size={28} className="text-teal-400" /> Projected Final Stats
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
                                {Object.entries(jsonData.final_stats).map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <div className="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-1">{key}</div>
                                    <div className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-teal-200 to-cyan-300 font-mono">
                                      {value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                          {/* Artifact Grid */}
                          <section>
                            <h3 className="text-3xl font-bold flex items-center gap-4 mb-8">
                              <Layers size={28} className="text-teal-400" /> Recommended Build
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                              {jsonData.recommended_build.map((art, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden hover:border-teal-500/60 hover:shadow-xl hover:shadow-teal-900/30 transition-all duration-300 group flex flex-col h-full"
                                >
                                  {/* Artifact Image */}
                                  <div className="relative h-40 bg-gradient-to-b from-slate-900/50 to-slate-800/50 flex items-center justify-center p-6">
                                    <div className="absolute inset-0 bg-gradient-radial from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img
                                      src={`/artifacts/${art.set}/${slotMap[art.slot]}.png`}
                                      alt={art.slot}
                                      className="max-h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 z-10"
                                      onError={e => {
                                        e.target.src = `https://placehold.co/120x120/1e293b/64748b?text=${art.slot.slice(0,3)}`;
                                      }}
                                    />
                                    <span className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-200 z-20">
                                      {art.slot}
                                    </span>
                                  </div>

                                  {/* Stats */}
                                  <div className="p-5 flex-grow flex flex-col">
                                    <div className="mb-4">
                                      <div className="text-xs uppercase text-slate-400 font-semibold mb-1">Main Stat</div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold text-teal-200 truncate pr-2" title={art.main_stat}>
                                          {art.main_stat}
                                        </span>
                                        <span className="font-mono text-base bg-teal-950/60 px-3 py-1 rounded-lg border border-teal-900/40">
                                          {art.main_value}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="h-px bg-slate-700 my-3" />

                                    <div className="space-y-2.5 flex-grow">
                                      {art.substats.slice(0, 4).map((sub, sIdx) => (
                                        <div key={sIdx} className="text-sm text-slate-200 flex items-center gap-2">
                                          <span className="text-teal-500">•</span>
                                          <span className="truncate">{sub}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>

                          {/* Mentor Analysis */}
                          <section className="bg-slate-800/50 p-8 md:p-10 rounded-2xl border border-slate-700 shadow-md relative overflow-hidden">
                            <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
                              <Brain size={140} className="text-cyan-500" />
                            </div>
                            <h3 className="text-2xl font-bold flex items-center gap-4 mb-8 relative z-10">
                              <Brain size={28} className="text-cyan-400" /> Detailed Analysis & Strategy
                            </h3>
                            <div className="prose prose-invert prose-teal prose-lg max-w-none relative z-10 leading-relaxed">
                              <ReactMarkdown
                                components={{
                                  p: props => <p className="mb-6 leading-7" {...props} />,
                                  strong: props => <strong className="text-teal-200 font-semibold" {...props} />,
                                  ul: props => <ul className="list-disc pl-6 space-y-3 my-6" {...props} />,
                                  li: props => <li className="pl-2" {...props} />,
                                }}
                              >
                                {jsonData.mentor_analysis}
                              </ReactMarkdown>
                            </div>
                          </section>
                        </div>
                      );
                    } catch (e) {
                      console.warn("Failed to parse JSON, falling back to raw markdown", e);
                      return (
                        <div className="bg-slate-800/50 p-10 rounded-2xl border border-slate-700 mt-8">
                          <h3 className="text-2xl font-bold flex items-center gap-4 mb-6">
                            <Brain size={28} className="text-cyan-400" /> Raw Analysis Report
                          </h3>
                          <div className="prose prose-invert prose-lg prose-teal max-w-none">
                            <ReactMarkdown>{analysis}</ReactMarkdown>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Mentor;