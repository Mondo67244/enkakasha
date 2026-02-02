
import { react } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Ghost, Database, Home, LayoutDashboard } from 'lucide-react';

import logo from '../assets/logo.jpg';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-600/20 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl opacity-30"></div>
            </div>

            {/* Navbar */}
            <header className="relative z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden shadow-lg shadow-teal-500/20 border-2 border-slate-700">
                            <img src={logo} alt="Enkakasha Logo" className="h-full w-full object-cover" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-cyan-400">
                            Genshin AI Mentor
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/home')}
                            className={`p-2 rounded-lg transition-colors ${location.pathname === '/home' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Home size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className={`p-2 rounded-lg transition-colors ${location.pathname === '/dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <LayoutDashboard size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/data')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${location.pathname === '/data'
                                ? 'bg-teal-600/20 text-teal-400 border-teal-600/50'
                                : 'text-slate-400 border-transparent hover:bg-slate-800'
                                }`}
                        >
                            <Database size={16} />
                            <span className="text-sm font-medium">Data</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
