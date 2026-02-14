
import React from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Database, Home, LayoutDashboard, MessageCircle } from 'lucide-react';

import logo from '../assets/logo.jpg';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const navItems = [
        { to: '/home', label: 'Scan', icon: Home },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/chat', label: 'Chat', icon: MessageCircle },
        { to: '/data', label: 'Data', icon: Database },
    ];
    return (
        <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)] font-sans">
            <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)] backdrop-blur-lg">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[var(--surface-muted)]">
                            <img src={logo} alt="Enkakasha Logo" className="h-full w-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-[var(--text-strong)] font-display">Genshin AI Mentor</h1>
                            <p className="text-xs text-[var(--text-muted)]">Build intelligence, refined</p>
                        </div>
                    </div>
                    <nav className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.to === '/dashboard'
                                ? location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/mentor')
                                : item.to === '/chat'
                                    ? location.pathname.startsWith('/chat')
                                    : location.pathname === item.to;
                            return (
                                <button
                                    key={item.to}
                                    onClick={() => {
                                        if (item.to === '/chat') {
                                            const lastChar = localStorage.getItem('last_chat_char');
                                            if (lastChar) {
                                                navigate(`/chat/${lastChar}`);
                                                return;
                                            }
                                        }
                                        navigate(item.to);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition ${isActive
                                        ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-muted)]'
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
};

export default Layout;
