
import React, { useState, useEffect } from 'react';
import { verifyKey } from '../lib/api';
import { Key, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('gemini_key');
        if (stored) {
            setKey(stored);
        }
    }, []);

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!key) return;

        setLoading(true);
        setError(null);

        try {
            await verifyKey(key);
            localStorage.setItem('gemini_key', key);
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to verify key');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-8">
            <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-white">Unlock Your Potential</h2>
                <p className="text-slate-400 text-lg">
                    Connect your Gemini API Key to access the AI Mentor features.
                </p>
            </div>

            <div className="w-full bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl">
                <form onSubmit={handleConnect} className="space-y-6">
                    <div className="text-left space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Gemini API Key</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !key}
                        className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Connect <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>

            <p className="text-xs text-slate-600">
                Your key is stored locally in your browser. We do not save it on our servers.
            </p>
        </div>
    );
};

export default Welcome;
