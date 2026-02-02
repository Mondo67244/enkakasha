
import React, { useState, useEffect } from 'react';
import { verifyKey } from '../lib/api';
import { Key, ArrowRight, Loader2, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const trimmedKey = key.trim();
    const isKeyValid = trimmedKey.length >= 20;

    useEffect(() => {
        const stored = localStorage.getItem('gemini_key');
        if (stored) {
            setKey(stored);
        }
    }, []);

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!isKeyValid) return;

        setLoading(true);
        setError(null);

        try {
            await verifyKey(trimmedKey);
            localStorage.setItem('gemini_key', trimmedKey);
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to verify key');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[70vh]">
            <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Genshin build mentor</p>
                <h2 className="text-4xl sm:text-5xl font-semibold text-[var(--text-strong)] font-display">
                    A quieter, smarter way to refine your builds.
                </h2>
                <p className="text-lg text-[var(--text)] max-w-xl">
                    Connect your Gemini API key once, then get clear recommendations, comparisons, and a swap plan tailored to your inventory.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-sm">
                        <ShieldCheck className="text-[var(--accent-strong)]" size={20} />
                        <p className="mt-3 text-sm font-medium text-[var(--text-strong)]">Private by default</p>
                        <p className="text-xs text-[var(--text-muted)]">Keys stay in your browser.</p>
                    </div>
                    <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-sm">
                        <Sparkles className="text-[var(--accent-strong)]" size={20} />
                        <p className="mt-3 text-sm font-medium text-[var(--text-strong)]">Clean insights</p>
                        <p className="text-xs text-[var(--text-muted)]">No noise, only priorities.</p>
                    </div>
                    <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-sm">
                        <Lock className="text-[var(--accent-strong)]" size={20} />
                        <p className="mt-3 text-sm font-medium text-[var(--text-strong)]">Secure flow</p>
                        <p className="text-xs text-[var(--text-muted)]">Verify before scanning.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[var(--line)] rounded-3xl p-8 shadow-[var(--shadow)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-11 w-11 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
                        <Key className="text-[var(--accent-strong)]" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-strong)]">Connect your Gemini key</h3>
                        <p className="text-sm text-[var(--text-muted)]">Required to generate AI guidance.</p>
                    </div>
                </div>

                <form onSubmit={handleConnect} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-strong)]">Gemini API Key</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => {
                                    setKey(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="AIzaSy..."
                                className="w-full border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text-strong)] pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent-strong)] transition"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                            We only store the key locally in your browser.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !isKeyValid}
                        className="w-full py-3 px-4 bg-[var(--accent-strong)] hover:bg-[var(--accent)] text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Welcome;
