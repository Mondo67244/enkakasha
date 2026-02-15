import React, { useState, useEffect } from 'react';
import { Archive, Trash2, User, MessageSquare, Package, Clock, AlertTriangle } from 'lucide-react';

const DataManagement = () => {
    const [stats, setStats] = useState({
        scans: [],
        hasUserData: false,
        hasChatSessions: false,
        hasContextData: false,
        hasApiKey: false,
        hasProvider: false,
    });
    const [confirmDelete, setConfirmDelete] = useState(false);

    const loadStats = () => {
        // Recent scans from localStorage
        let scans = [];
        try {
            const raw = localStorage.getItem('recent_scans');
            if (raw) scans = JSON.parse(raw);
        } catch { }

        // Chat sessions
        let chatSessions = [];
        try {
            const raw = localStorage.getItem('chat_sessions');
            if (raw) chatSessions = JSON.parse(raw);
        } catch { }

        setStats({
            scans,
            chatSessionsCount: chatSessions.length,
            hasUserData: !!sessionStorage.getItem('user_data'),
            hasContextData: !!sessionStorage.getItem('context_data'),
            hasChatSessions: chatSessions.length > 0,
            hasApiKey: !!localStorage.getItem('gemini_key'),
            hasProvider: !!localStorage.getItem('ai_provider'),
            currentUid: sessionStorage.getItem('uid') || null,
        });
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleClearAll = () => {
        // Clear sessionStorage
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('uid');
        sessionStorage.removeItem('context_data');

        // Clear localStorage (user data only, keep API key)
        localStorage.removeItem('recent_scans');
        localStorage.removeItem('chat_sessions');
        localStorage.removeItem('last_chat_char');

        setConfirmDelete(false);
        loadStats();
    };

    const handleClearEverything = () => {
        // Clear absolutely everything
        sessionStorage.clear();
        localStorage.clear();

        setConfirmDelete(false);
        loadStats();
    };

    const handleClearApiKey = () => {
        localStorage.removeItem('gemini_key');
        localStorage.removeItem('ai_provider');
        loadStats();
    };

    const totalItems = stats.scans.length + stats.chatSessionsCount + (stats.hasUserData ? 1 : 0) + (stats.hasContextData ? 1 : 0);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--accent-soft)] rounded-xl">
                    <Archive className="text-[var(--accent-strong)]" size={28} />
                </div>
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Storage</p>
                    <h2 className="text-3xl font-semibold text-[var(--text-strong)] font-display">Mes données</h2>
                    <p className="text-[var(--text-muted)]">Gérez les données stockées sur cet appareil.</p>
                </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
                <p className="font-medium">🔒 Données privées</p>
                <p className="mt-1 text-blue-600">
                    Toutes vos données sont stockées localement sur cet appareil.
                    Personne d'autre ne peut y accéder.
                </p>
            </div>

            {/* Current session */}
            {stats.currentUid && (
                <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--line)] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <User className="text-[var(--accent-strong)]" size={20} />
                        <h3 className="font-semibold text-[var(--text-strong)]">Session active</h3>
                    </div>
                    <p className="text-[var(--text)]">
                        UID actuel : <span className="font-mono font-medium">{stats.currentUid}</span>
                    </p>
                    {stats.hasUserData && (
                        <p className="text-xs text-emerald-600 mt-1">✓ Données de personnages chargées</p>
                    )}
                    {stats.hasContextData && (
                        <p className="text-xs text-emerald-600">✓ Contexte leaderboard chargé</p>
                    )}
                </div>
            )}

            {/* Data summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--line)] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <Clock className="text-[var(--text-muted)]" size={18} />
                        <h4 className="font-medium text-[var(--text-strong)]">Scans récents</h4>
                    </div>
                    {stats.scans.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">Aucun scan enregistré</p>
                    ) : (
                        <div className="space-y-2">
                            {stats.scans.slice(0, 5).map((scan, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="font-mono text-[var(--text)]">{scan.uid}</span>
                                    <span className="text-[var(--text-muted)]">{scan.characters} persos</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--line)] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <MessageSquare className="text-[var(--text-muted)]" size={18} />
                        <h4 className="font-medium text-[var(--text-strong)]">Historique chat</h4>
                    </div>
                    {stats.chatSessionsCount === 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">Aucune conversation</p>
                    ) : (
                        <p className="text-sm text-[var(--text)]">
                            {stats.chatSessionsCount} conversation{stats.chatSessionsCount > 1 ? 's' : ''} enregistrée{stats.chatSessionsCount > 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* API Key status */}
            <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--line)] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <Package className="text-[var(--text-muted)]" size={18} />
                    <h4 className="font-medium text-[var(--text-strong)]">Configuration IA</h4>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        {stats.hasApiKey ? (
                            <p className="text-sm text-emerald-600">✓ Clé API Gemini enregistrée</p>
                        ) : (
                            <p className="text-sm text-[var(--text-muted)]">Pas de clé API (mode local)</p>
                        )}
                        {stats.hasProvider && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                Provider: {localStorage.getItem('ai_provider') || 'ollama'}
                            </p>
                        )}
                    </div>
                    {stats.hasApiKey && (
                        <button
                            onClick={handleClearApiKey}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--line)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-200"
                        >
                            Supprimer la clé
                        </button>
                    )}
                </div>
            </div>

            {/* Delete actions */}
            <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--line)] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Trash2 className="text-red-500" size={20} />
                    <h3 className="font-semibold text-[var(--text-strong)]">Supprimer les données</h3>
                </div>

                {!confirmDelete ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => setConfirmDelete(true)}
                            disabled={totalItems === 0}
                            className="w-full py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Effacer toutes mes données ({totalItems} élément{totalItems > 1 ? 's' : ''})
                        </button>
                        <p className="text-xs text-[var(--text-muted)] text-center">
                            Supprime les scans, conversations et données de session. Garde la clé API.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="font-medium text-red-700">Êtes-vous sûr ?</p>
                                    <p className="text-sm text-red-600 mt-1">
                                        Cette action supprimera définitivement toutes vos données locales.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 py-2.5 rounded-xl border border-[var(--line)] text-[var(--text-strong)] font-medium hover:bg-[var(--surface-muted)]"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600"
                            >
                                Confirmer
                            </button>
                        </div>
                        <button
                            onClick={handleClearEverything}
                            className="w-full text-xs text-red-400 hover:text-red-600 underline"
                        >
                            Tout supprimer (y compris la clé API)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataManagement;
