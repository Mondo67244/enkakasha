import React, { useState, useEffect } from 'react';
import { listDataFolders, deleteDataFolder, renameDataFolder } from '../lib/api';
import { Folder, Trash2, Edit2, Archive, Loader2, AlertCircle, Check } from 'lucide-react';

const DataManagement = () => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [renameTarget, setRenameTarget] = useState(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        fetchFolders();
    }, []);

    const fetchFolders = async () => {
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
    };

    const handleDelete = async (name) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
        try {
            await deleteDataFolder(name);
            fetchFolders();
        } catch (err) {
            alert("Failed to delete folder");
        }
    };

    const handleRename = async () => {
        if (!newName.trim()) return;
        try {
            await renameDataFolder(renameTarget.name, newName);
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
                <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Archive className="text-blue-400" size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">Data Management</h2>
                    <p className="text-slate-400">Manage your scanned scans and imports.</p>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-slate-500" size={32} />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-400 flex flex-col items-center gap-2">
                        <AlertCircle /> {error}
                    </div>
                ) : folders.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        No scans found. Go to Home to scan a UID.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Created</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {folders.map((folder) => (
                                <tr key={folder.name} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-white font-medium flex items-center gap-3">
                                        <Folder size={18} className="text-slate-500" />
                                        {renameTarget?.name === folder.name ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                                />
                                                <button onClick={handleRename} className="p-1 hover:text-green-400"><Check size={16} /></button>
                                            </div>
                                        ) : (
                                            folder.name
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {new Date(folder.created * 1000).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => startRename(folder)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                                            title="Rename"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(folder.name)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
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
        </div>
    );
};

export default DataManagement;
