
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search } from 'lucide-react';
import characterList from '../../../../Characters/characters.json';

const iconFiles = import.meta.glob('../../../../Characters/**/icon.png', { eager: true, import: 'default' });
const cardFiles = import.meta.glob('../../../../Characters/**/card.png', { eager: true, import: 'default' });
const elementFiles = import.meta.glob('../../../../elements/Element_*.svg', { eager: true, import: 'default' });

const buildImageMap = (files) => {
    const map = {};
    Object.entries(files).forEach(([filePath, url]) => {
        const parts = filePath.split('/');
        const folder = parts[parts.length - 2];
        if (folder) {
            map[folder] = url;
        }
    });
    return map;
};

const buildElementMap = (files) => {
    const map = {};
    Object.entries(files).forEach(([filePath, url]) => {
        const match = filePath.match(/Element_(\w+)\.svg$/);
        if (match) {
            map[match[1].toLowerCase()] = url;
        }
    });
    return map;
};

const ALLOWED_ELEMENTS = new Set(['Pyro', 'Hydro', 'Electro', 'Cryo', 'Dendro', 'Anemo', 'Geo']);

const normalizeElement = (value) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!trimmed || trimmed.toLowerCase() === 'n/a') return '';
    const lower = trimmed.toLowerCase();
    const normalized = lower.charAt(0).toUpperCase() + lower.slice(1);
    return ALLOWED_ELEMENTS.has(normalized) ? normalized : '';
};

const ElementIcon = ({ element, elementMap }) => {
    const normalized = normalizeElement(element);
    if (!normalized) return <User className="text-[var(--text-muted)]" />;
    const key = normalized.toLowerCase();
    const src = elementMap[key] || `/elements/Element_${normalized}.svg`;
    return <img src={src} alt={normalized} className="h-5 w-5" />;
};

const SPECIAL_CHARACTER_MAP = {
    'Raiden Shogun': 'RaidenShogun',
    'Arataki Itto': 'AratakiItto',
    'Sangonomiya Kokomi': 'SangonomiyaKokomi',
    'Kaedehara Kazuha': 'KaedeharaKazuha',
    'Kuki Shinobu': 'KukiShinobu',
    'Yun Jin': 'YunJin',
    'Hu Tao': 'HuTao',
    'Hu Tao (Trial)': 'HuTao(Trial)',
    'Kamisato Ayaka': 'KamisatoAyaka',
    'Kamisato Ayato': 'KamisatoAyato',
    'Kujou Sara': 'KujouSara',
    'Mavuika': 'Mavuika',
};

const normalizeCharacterFolder = (name) => {
    if (!name) return '';
    if (SPECIAL_CHARACTER_MAP[name]) return SPECIAL_CHARACTER_MAP[name];
    return name.replace(/[^a-zA-Z0-9]/g, '');
};

const Dashboard = () => {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [elementFilter, setElementFilter] = useState('All');
    const characterIndex = useMemo(() => {
        const index = {};
        characterList.forEach((entry) => {
            if (entry.id && entry.name) {
                index[String(entry.id)] = entry.name;
            }
        });
        return index;
    }, []);
    const elementIndex = useMemo(() => {
        const index = {};
        characterList.forEach((entry) => {
            if (entry.id && entry.element) {
                index[String(entry.id)] = entry.element;
            }
            if (entry.name && entry.element) {
                index[entry.name] = entry.element;
            }
        });
        return index;
    }, []);
    const iconMap = useMemo(() => buildImageMap(iconFiles), []);
    const cardMap = useMemo(() => buildImageMap(cardFiles), []);
    const elementMap = useMemo(() => buildElementMap(elementFiles), []);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = sessionStorage.getItem('user_data');
        if (!stored) {
            navigate('/home');
            return;
        }
        setData(JSON.parse(stored));
    }, [navigate]);

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

    const resolveDisplayNameMemo = useMemo(() => resolveDisplayName, [characterIndex]);

    const resolveElement = (rawName, fallback) => {
        if (!rawName) return '';
        const idMatch = rawName.match(/\d+/);
        if (idMatch && elementIndex[idMatch[0]]) {
            return elementIndex[idMatch[0]];
        }
        if (elementIndex[rawName]) {
            return elementIndex[rawName];
        }
        return normalizeElement(fallback);
    };

    const resolveElementMemo = useMemo(() => resolveElement, [elementIndex]);

    const handleSelect = (charName) => {
        navigate(`/mentor/${charName}`);
    };

    const filtered = data.filter((char) => {
        const stats = char.stats || {};
        const name = resolveDisplayNameMemo(stats.Character || '');
        const element = resolveElementMemo(stats.Character || '', stats.Element);
        const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchesElement = elementFilter === 'All' || element === elementFilter;
        return matchesSearch && matchesElement;
    });

    const elementOptions = [
        'All',
        ...new Set(
            data
                .map((c) => resolveElementMemo(c.stats?.Character || '', c.stats?.Element))
                .filter(Boolean)
        )
    ];

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
                        const displayName = resolveDisplayNameMemo(stats.Character);
                        const resolvedElement = resolveElementMemo(stats.Character, stats.Element);
                        const folderName = normalizeCharacterFolder(displayName);
                        const imageSrc = folderName ? iconMap[folderName] : '';
                        const fallbackSrc = folderName ? cardMap[folderName] : '';
                        return (
                            <div
                                key={idx}
                                onClick={() => handleSelect(stats.Character)}
                                className="bg-white border border-[var(--line)] hover:border-[var(--accent-strong)] p-6 rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] overflow-hidden flex items-center justify-center">
                                            {imageSrc ? (
                                                <img
                                                    src={imageSrc}
                                                    alt={stats.Character}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
                                                            e.currentTarget.src = fallbackSrc;
                                                        } else {
                                                            e.currentTarget.src = 'https://placehold.co/96x96/f8fafc/94a3b8?text=?';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <User className="text-[var(--text-muted)]" />
                                            )}
                                        </div>
                                        <div className="p-2 bg-[var(--surface-muted)] rounded-xl">
                                            <ElementIcon element={resolvedElement} elementMap={elementMap} />
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-muted)] px-2 py-1 rounded">Lv.{stats.Level}</span>
                                </div>

                                <h3 className="text-xl font-semibold text-[var(--text-strong)] mb-1">{displayName || stats.Character}</h3>
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
