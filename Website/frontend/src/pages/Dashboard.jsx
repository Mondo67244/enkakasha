
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Droplets, Flame, Zap, Wind, Mountain, Snowflake, Sprout, Search } from 'lucide-react';

const ElementIcon = ({ element }) => {
    switch (element) {
        case 'Pyro': return <Flame className="text-red-500" />;
        case 'Hydro': return <Droplets className="text-blue-500" />;
        case 'Electro': return <Zap className="text-purple-500" />;
        case 'Anemo': return <Wind className="text-teal-500" />;
        case 'Geo': return <Mountain className="text-yellow-500" />;
        case 'Cryo': return <Snowflake className="text-cyan-500" />;
        case 'Dendro': return <Sprout className="text-green-500" />;
        default: return <User className="text-slate-400" />;
    }
}

const Dashboard = () => {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [elementFilter, setElementFilter] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        const stored = sessionStorage.getItem('user_data');
        if (!stored) {
            navigate('/home');
            return;
        }
        setData(JSON.parse(stored));
    }, [navigate]);

    const handleSelect = (charName) => {
        navigate(`/mentor/${charName}`);
    };

    const filtered = data.filter((char) => {
        const stats = char.stats || {};
        const name = stats.Character || '';
        const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchesElement = elementFilter === 'All' || stats.Element === elementFilter;
        return matchesSearch && matchesElement;
    });

    const elementOptions = ['All', ...new Set(data.map((c) => c.stats?.Element).filter(Boolean))];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Showcase</p>
                    <h2 className="text-3xl font-semibold text-[var(--text-strong)] font-display">Your characters</h2>
                </div>
                <button onClick={() => navigate('/home')} className="text-sm font-medium text-[var(--accent-strong)] hover:text-[var(--accent)]">
                    New scan
                </button>
            </div>

            <div className="bg-white border border-[var(--line)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search character"
                        className="w-full border border-[var(--line)] bg-[var(--surface-muted)] pl-9 pr-3 py-2.5 rounded-xl text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent-strong)]"
                    />
                </div>
                <select
                    value={elementFilter}
                    onChange={(e) => setElementFilter(e.target.value)}
                    className="border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2.5 rounded-xl text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent-strong)]"
                >
                    {elementOptions.map((el) => (
                        <option key={el} value={el}>{el}</option>
                    ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">No characters match your filters.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((char, idx) => {
                        const stats = char.stats;
                        const artCount = char.artifacts?.length || 0;
                        return (
                            <div
                                key={idx}
                                onClick={() => handleSelect(stats.Character)}
                                className="bg-white border border-[var(--line)] hover:border-[var(--accent-strong)] p-6 rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-[var(--surface-muted)] rounded-xl group-hover:scale-110 transition-transform">
                                        <ElementIcon element={stats.Element} />
                                    </div>
                                    <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-muted)] px-2 py-1 rounded">Lv.{stats.Level}</span>
                                </div>

                                <h3 className="text-xl font-semibold text-[var(--text-strong)] mb-1">{stats.Character}</h3>
                                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
                                    <span>ATK {stats.ATK}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>CR {stats['Crit_Rate%']}%</span>
                                </div>

                                <div className="pt-4 border-t border-[var(--line)] flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-muted)]">{artCount} artifacts</span>
                                    <span className="text-[var(--accent-strong)] text-sm font-medium group-hover:underline">Optimize &rarr;</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
