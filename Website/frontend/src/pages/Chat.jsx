import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { chatBuild } from '../lib/api';
import characterList from '@characters/characters.json';

const Chat = () => {
    const navigate = useNavigate();
    const { charName } = useParams();
    const [userData, setUserData] = useState([]);
    const [contextData, setContextData] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [error, setError] = useState(null);

    const characterIndex = useMemo(() => {
        const index = {};
        characterList.forEach((entry) => {
            if (entry.id && entry.name) {
                index[String(entry.id)] = entry.name;
            }
        });
        return index;
    }, []);

    const resolveDisplayName = (rawName) => {
        if (!rawName) return '';
        if (rawName.startsWith('ID')) {
            const idMatch = rawName.match(/\d+/);
            if (idMatch && characterIndex[idMatch[0]]) {
                return characterIndex[idMatch[0]];
            }
        }
        return rawName;
    };

    const displayName = resolveDisplayName(charName || '');

    useEffect(() => {
        const stored = sessionStorage.getItem('user_data');
        if (!stored) {
            navigate('/home');
            return;
        }
        setUserData(JSON.parse(stored));
        const ctx = sessionStorage.getItem('context_data');
        if (ctx) {
            try {
                setContextData(JSON.parse(ctx));
            } catch {
                setContextData(null);
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (!charName) {
            const last = localStorage.getItem('last_chat_char');
            if (last) {
                navigate(`/chat/${last}`, { replace: true });
            }
        }
    }, [charName, navigate]);

    useEffect(() => {
        const raw = localStorage.getItem('chat_sessions');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setSessions(parsed);
                if (parsed.length > 0) {
                    setActiveSessionId(parsed[0].id);
                }
            } catch {
                setSessions([]);
            }
        }
    }, []);

    useEffect(() => {
        if (charName) {
            localStorage.setItem('last_chat_char', charName);
        }
    }, [charName]);

    const activeSession = sessions.find((s) => s.id === activeSessionId);

    const saveSessions = (next) => {
        setSessions(next);
        localStorage.setItem('chat_sessions', JSON.stringify(next));
    };

    const createSession = () => {
        const id = `chat_${Date.now()}`;
        const sameCharCount = sessions.filter((s) => s.charName === charName).length + 1;
        const titleBase = displayName || 'New chat';
        const title = charName ? `${titleBase} · Chat ${sameCharCount}` : titleBase;
        const newSession = {
            id,
            charName: charName || '',
            title,
            updatedAt: new Date().toISOString(),
            messages: []
        };
        const next = [newSession, ...sessions];
        saveSessions(next);
        setActiveSessionId(id);
        return newSession;
    };

    const handleSend = async () => {
        if (!message.trim()) return;
        if (!charName) {
            setError('Select a character first.');
            return;
        }
        setSending(true);
        setError(null);
        const apiKey = localStorage.getItem('gemini_key');
        const provider = localStorage.getItem('ai_provider') || 'ollama';
        
        if (provider === 'gemini' && !apiKey) {
            navigate('/');
            return;
        }

        const session = activeSession || createSession();
        const userMessage = { role: 'user', content: message.trim() };
        const nextMessages = [...session.messages, userMessage];

        const nextSessions = sessions.map((s) => (s.id === session.id ? { ...s, messages: nextMessages, updatedAt: new Date().toISOString(), charName } : s));
        if (!sessions.find((s) => s.id === session.id)) {
            nextSessions.unshift({ ...session, messages: nextMessages, updatedAt: new Date().toISOString(), charName });
        }
        saveSessions(nextSessions);
        setMessage('');

        try {
            const response = await chatBuild(
                apiKey,
                userData,
                contextData,
                charName,
                'gemini-2.5-flash',
                userMessage.content,
                nextMessages,
                provider
            );
            const assistantMessage = { role: 'assistant', content: response.reply };
            const updatedMessages = [...nextMessages, assistantMessage];
            const updatedSessions = nextSessions.map((s) => (s.id === session.id ? { ...s, messages: updatedMessages, updatedAt: new Date().toISOString() } : s));
            saveSessions(updatedSessions);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const handleSelectSession = (sessionId) => {
        setActiveSessionId(sessionId);
    };

    const exportSessionJson = () => {
        if (!activeSession) return;
        const blob = new Blob([JSON.stringify(activeSession, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeSession.title.replace(/\\s+/g, '_')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportSessionMarkdown = () => {
        if (!activeSession) return;
        const header = `# Chat history: ${activeSession.title}\\n\\n`;
        const body = activeSession.messages
            .map((msg) => `**${msg.role.toUpperCase()}**: ${msg.content}`)
            .join('\\n\\n');
        const blob = new Blob([header + body], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeSession.title.replace(/\\s+/g, '_')}.md`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const renderMessage = (msg, idx) => {
        const isUser = msg.role === 'user';
        return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-[var(--accent-strong)] text-white' : 'bg-[var(--surface-muted)] text-[var(--text-strong)] border border-[var(--line)]'}`}>
                    {msg.content}
                </div>
            </div>
        );
    };

    const visibleSessions = sessions.filter((session) => !charName || session.charName === charName);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-4 bg-white border border-[var(--line)] rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--text-strong)]">Chat history</h3>
                    <button
                        onClick={createSession}
                        className="text-xs font-medium text-[var(--accent-strong)] hover:text-[var(--accent)]"
                    >
                        New chat
                    </button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {visibleSessions.length === 0 && (
                        <p className="text-sm text-[var(--text-muted)]">No chat history yet.</p>
                    )}
                    {visibleSessions.map((session) => (
                        <button
                            key={session.id}
                            type="button"
                            onClick={() => handleSelectSession(session.id)}
                            className={`w-full text-left px-3 py-3 rounded-2xl border ${activeSessionId === session.id ? 'border-[var(--accent-strong)] bg-[var(--accent-soft)]' : 'border-[var(--line)] bg-white hover:bg-[var(--surface-muted)]'}`}
                        >
                            <p className="text-sm font-semibold text-[var(--text-strong)]">{session.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{new Date(session.updatedAt).toLocaleString()}</p>
                        </button>
                    ))}
                </div>
            </aside>

            <section className="lg:col-span-8 bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm flex flex-col min-h-[70vh]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Chat mode</p>
                        <h2 className="text-2xl font-semibold text-[var(--text-strong)]">{displayName || charName || 'Select a character'}</h2>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${contextData ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-amber-200 bg-amber-50 text-amber-600'}`}>
                                {contextData ? 'Leaderboard context loaded' : 'Leaderboard context missing'}
                            </span>
                            {activeSession && (
                                <span className="text-xs text-[var(--text-muted)]">Messages: {activeSession.messages.length}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportSessionMarkdown}
                            disabled={!activeSession}
                            className="text-xs font-medium px-3 py-2 rounded-full border border-[var(--line)] text-[var(--text-strong)] bg-white hover:bg-[var(--surface-muted)] disabled:opacity-50"
                        >
                            Export MD
                        </button>
                        <button
                            onClick={exportSessionJson}
                            disabled={!activeSession}
                            className="text-xs font-medium px-3 py-2 rounded-full border border-[var(--line)] text-[var(--text-strong)] bg-white hover:bg-[var(--surface-muted)] disabled:opacity-50"
                        >
                            Export JSON
                        </button>
                        <button
                            onClick={() => navigate(`/mentor/${charName}`)}
                            className="text-sm font-medium text-[var(--accent-strong)] hover:text-[var(--accent)]"
                        >
                            Back to mentor
                        </button>
                    </div>
                </div>

                {!contextData && (
                    <div className="mb-4 text-sm text-[var(--text-muted)] border border-[var(--line)] rounded-2xl p-3 bg-[var(--surface-muted)]">
                        Load leaderboard context in Mentor mode before chatting for best results.
                    </div>
                )}

                <div className="flex-1 space-y-4 overflow-y-auto border border-[var(--line)] rounded-2xl p-4 bg-[var(--surface-muted)]">
                    {activeSession?.messages?.length ? (
                        activeSession.messages.map(renderMessage)
                    ) : (
                        <p className="text-sm text-[var(--text-muted)]">Ask about your leaderboard benchmarks or artifact pool.</p>
                    )}
                </div>

                {error && (
                    <div className="mt-4 text-sm text-red-600">{error}</div>
                )}

                <div className="mt-4 flex items-center gap-2">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask about your build, stats, or swaps..."
                        className="flex-1 border border-[var(--line)] bg-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent-strong)]"
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="px-4 py-3 rounded-2xl bg-[var(--accent-strong)] text-white text-sm font-semibold hover:bg-[var(--accent)] disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Chat;
