import React, { useState, useEffect, useCallback } from 'react';
import { listDataFolders, deleteDataFolder, renameDataFolder, clearDataFolders } from '../lib/api';
import { Folder, Trash2, Edit2, Archive, Loader2, AlertCircle, Check } from 'lucide-react';

const DataManagement = () => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [renameTarget, setRenameTarget] = useState(null);
    const [newName, setNewName] = useState('');
    const isNameValid = /^[A-Za-z0-9._-]+$/.test(newName);

    const fetchFolders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await listDataFolders();
            setFolders(res.folders);
            setError(null);
        } catch (err) {
            setError("Failed to load data folders.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    const handleDelete = async (name) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
        try {
            await deleteDataFolder(name);
            fetchFolders();
        } catch (err) {
            alert("Failed to delete folder");
        }
    };

    const handleClearCache = () => {
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('uid');
        localStorage.removeItem('recent_scans');
        alert('Local scan cache cleared.');
    };

    const handleDeleteAll = async () => {
        if (!confirm('Delete all scan folders on the server? This cannot be undone.')) return;
        try {
            await clearDataFolders();
            fetchFolders();
        } catch (err) {
            alert('Failed to delete all scans.');
        }
    };

    const handleRename = async () => {
        const cleaned = newName.trim();
        if (!cleaned || !isNameValid) return;
        try {
            await renameDataFolder(renameTarget.name, cleaned);
            setRenameTarget(null);
            setNewName('');
            fetchFolders();
        } catch (err) {
            alert("Failed to rename folder. Name might be taken.");
        }
    };

    const startRename = (folder) => {
        setRenameTarget(folder);
        setNewName(folder.name);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--accent-soft)] rounded-xl">
                    <Archive className="text-[var(--accent-strong)]" size={28} />
                </div>
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Storage</p>
                    <h2 className="text-3xl font-semibold text-[var(--text-strong)] font-display">Data management</h2>
                    <p className="text-[var(--text-muted)]">Organize your scans and tidy up older runs.</p>
                </div>
            </div>

            <div className="bg-white border border-[var(--line)] rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600 flex flex-col items-center gap-2">
                        <AlertCircle /> {error}
                    </div>
                ) : folders.length === 0 ? (
                    <div className="p-12 text-center text-[var(--text-muted)]">
                        No scans found. Go to Scan to fetch a UID.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Created</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                            {folders.map((folder) => (
                                <tr key={folder.name} className="hover:bg-[var(--surface-muted)] transition-colors">
                                    <td className="p-4 text-[var(--text-strong)] font-medium flex items-center gap-3">
                                        <Folder size={18} className="text-[var(--text-muted)]" />
                                        {renameTarget?.name === folder.name ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    className="bg-white border border-[var(--line)] rounded px-2 py-1 text-sm focus:border-[var(--accent-strong)] outline-none"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                                />
                                                <button
                                                    onClick={handleRename}
                                                    disabled={!isNameValid}
                                                    className="p-1 hover:text-green-600 disabled:text-slate-300"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            folder.name
                                        )}
                                    </td>
                                    <td className="p-4 text-[var(--text-muted)] text-sm">
                                        {new Date(folder.created * 1000).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => startRename(folder)}
                                            className="p-2 hover:bg-[var(--surface-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-strong)] transition-colors"
                                            title="Rename"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(folder.name)}
                                            className="p-2 hover:bg-[var(--surface-muted)] rounded-lg text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleClearCache}
                    className="px-4 py-2 rounded-xl border border-[var(--line)] bg-white text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--surface-muted)]"
                >
                    Clear local cache
                </button>
                <button
                    onClick={handleDeleteAll}
                    className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                    Delete all scans (server)
                </button>
            </div>
            {renameTarget && !isNameValid && (
                <p className="text-xs text-red-600">Folder names can only include letters, numbers, dots, underscores, and dashes.</p>
            )}
        </div>
    );
};

export default DataManagement;
