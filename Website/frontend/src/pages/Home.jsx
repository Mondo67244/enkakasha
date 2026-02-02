
import React, { useState } from 'react';
import { scanUID } from '../lib/api';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [uid, setUid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleScan = async (e) => {
        e.preventDefault();
        if (!uid) return;

        setLoading(true);
        setError(null);

        try {
            const data = await scanUID(uid);
            // Store result in session storage
            sessionStorage.setItem('user_data', JSON.stringify(data.data));
            sessionStorage.setItem('uid', uid);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to scan UID. Is the character showcase public?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-8">
            <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-white">Analyze Your Account</h2>
                <p className="text-slate-400 text-lg">
                    Enter your UID to fetch your characters and artifacts.
                </p>
            </div>

            <div className="w-full bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl relative overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                        <Loader2 className="animate-spin text-purple-400 mb-2" size={40} />
                        <p className="text-purple-200 font-medium">Fetching showcase...</p>
                    </div>
                )}

                <form onSubmit={handleScan} className="space-y-6">
                    <div className="text-left space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">UID</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                placeholder="e.g. 700123456"
                                className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
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
                        disabled={loading || !uid}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start Scan
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Home;
