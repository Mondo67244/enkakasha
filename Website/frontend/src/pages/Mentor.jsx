import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaderboard, analyzeBuild } from '../lib/api';
import { Brain, ArrowRight, BookOpen, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Mentor = () => {
    const { charName } = useParams();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [calcId, setCalcId] = useState('');
    const [contextData, setContextData] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');

    const [loadingContext, setLoadingContext] = useState(false);
    const [loadingAI, setLoadingAI] = useState(false);
    const [errorFragment, setErrorFragment] = useState(null);

    const models = [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fast & Good)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Smarter)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy)' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Preview)' }
    ];

    useEffect(() => {
        const stored = sessionStorage.getItem('user_data');
        if (!stored) {
            navigate('/home');
            return;
        }
        const parsed = JSON.parse(stored);
        setUserData(parsed);

        // Check if char exists
        const char = parsed.find(c => c.stats.Character === charName);
        if (!char) navigate('/dashboard');
    }, [charName, navigate]);

    const handleFetchContext = async () => {
        if (!calcId) return;
        setLoadingContext(true);
        setErrorFragment(null);
        try {
            const res = await getLeaderboard(calcId);
            setContextData(res.data);
        } catch (err) {
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
            setErrorFragment(err.response?.data?.detail || "AI Analysis Failed");
        } finally {
            setLoadingAI(false);
        }
    };

    const handleReset = () => {
        setContextData(null);
        setCalcId('');
        setAnalysis('');
        setErrorFragment(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Brain className="text-purple-400" size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">Mentor Mode: {charName}</h2>
                    <p className="text-slate-400">Optimize your build with AI-driven theorycrafting.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Context Setup */}
                <div className="md:col-span-1 space-y-6">
                    {/* Leaderboard ID Input */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <BookOpen size={18} /> Context
                        </h3>
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400">
                                To analyze effectively, the AI needs a "Gold Standard". Enter the Akasha Leaderboard ID for {charName}.
                            </p>
                            <input
                                type="text"
                                placeholder="Leaderboard ID"
                                value={calcId}
                                onChange={(e) => setCalcId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm"
                            />
                            <button
                                onClick={handleFetchContext}
                                disabled={loadingContext || !calcId || contextData}
                                className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${contextData ? 'bg-green-600/20 text-green-400 border border-green-600/50' :
                                    'bg-slate-700 hover:bg-slate-600 text-white'
                                    }`}
                            >
                                {loadingContext ? 'Fetching...' : contextData ? 'Context Loaded ✓' : 'Load Context'}
                            </button>
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                            <Sparkles size={16} className="text-blue-400" /> AI Model
                        </h3>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500 transition-colors"
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Leaderboard Preview */}
                    {contextData && (
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 animate-fade-in">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                                <Sparkles size={16} className="text-yellow-400" /> Top Builds Preview
                            </h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {contextData.map((entry, i) => (
                                    <div key={i} className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center text-xs">
                                        <div className="text-slate-300">
                                            <span className="text-purple-400 font-bold">#{i + 1}</span>
                                            <span className="mx-2">Crit: {entry['Crit Ratio'] || '?'}</span>
                                        </div>
                                        <div className="text-slate-500">{entry['Set'] || 'Mix'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={!contextData || loadingAI}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingAI ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> Generate Guide</>}
                    </button>

                    {errorFragment && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            {errorFragment}
                        </div>
                    )}
                </div>

                {/* Right Column: Results */}
                <div className="md:col-span-2">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 min-h-[400px]">
                        {!analysis ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                                <Brain size={64} strokeWidth={1} />
                                <p>Waiting for analysis...</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute top-0 right-0">
                                    <button
                                        onClick={handleReset}
                                        className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-xs"
                                    >
                                        <RefreshCw size={14} /> New Analysis
                                    </button>
                                </div>
                                <div className="prose prose-invert prose-purple max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-purple-300">
                                    <ReactMarkdown>{analysis}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mentor;
