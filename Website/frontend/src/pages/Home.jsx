
import React, { useEffect, useState } from 'react';
import { scanUID } from '../lib/api';
import { Search, Loader2, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [uid, setUid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [recentScans, setRecentScans] = useState([]);
    const trimmedUid = uid.trim();
    const isUidValid = /^\d{9}$/.test(trimmedUid);

    useEffect(() => {
        const stored = localStorage.getItem('recent_scans');
        if (stored) {
            try {
                setRecentScans(JSON.parse(stored));
            } catch {
                setRecentScans([]);
            }
        }
    }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!isUidValid) {
            setError('UID must be 9 digits.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await scanUID(trimmedUid);
            // Store result in session storage
            sessionStorage.setItem('user_data', JSON.stringify(data.data));
            sessionStorage.setItem('uid', trimmedUid);

            const newEntry = {
                uid: trimmedUid,
                characters: data.data?.length || 0,
                at: new Date().toISOString(),
            };
            const nextScans = [newEntry, ...recentScans.filter(r => r.uid !== trimmedUid)].slice(0, 5);
            setRecentScans(nextScans);
            localStorage.setItem('recent_scans', JSON.stringify(nextScans));
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to scan UID. Is the character showcase public?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Account scan</p>
                    <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--text-strong)] font-display">Analyze your showcase</h2>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Sparkles size={16} className="text-[var(--accent-strong)]" />
                    <span>Clean comparisons, actionable swaps</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[var(--surface)] backdrop-blur-md border border-[var(--line)] rounded-3xl p-8 shadow-[var(--shadow)] relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-[var(--app-bg)]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                            <Loader2 className="animate-spin text-[var(--accent-strong)] mb-2" size={36} />
                            <p className="text-[var(--text-muted)] font-medium">Fetching showcase...</p>
                        </div>
                    )}

                    <form onSubmit={handleScan} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-strong)]">UID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                                <input
                                    type="text"
                                    value={uid}
                                    onChange={(e) => {
                                        setUid(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="e.g. 700123456"
                                    className="w-full border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text-strong)] pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent-strong)] transition"
                                />
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">We support public showcases only.</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !isUidValid}
                            className="w-full py-3 px-4 bg-[var(--accent-strong)] hover:bg-[var(--accent)] text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start scan
                        </button>
                    </form>
                </div>

                <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--line)] rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-[var(--accent-strong)]" />
                        <h3 className="text-base font-semibold text-[var(--text-strong)]">Recent scans</h3>
                    </div>
                    {recentScans.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">No scans yet. Your last 5 scans will appear here.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentScans.map((scan) => (
                                <div key={scan.uid} className="flex items-center justify-between bg-[var(--surface-muted)] border border-[var(--line)] rounded-2xl px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-strong)]">{scan.uid}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{scan.characters} characters</p>
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {new Date(scan.at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
