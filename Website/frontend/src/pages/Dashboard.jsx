
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search } from 'lucide-react';
import characterList from '@characters/characters.json';

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

const ElementIcon = ({ element, elementMap, overlay }) => {
    const normalized = normalizeElement(element);
    if (!normalized) return overlay ? null : <User className="text-[var(--text-muted)]" />;
    const key = normalized.toLowerCase();
    const src = elementMap[key] || `/elements/Element_${normalized}.svg`;
    if (overlay) {
        return (
            <div className="gi-avatar__element">
                <img src={src} alt={normalized} />
            </div>
        );
    }
    return <img src={src} alt={normalized} className="h-5 w-5" />;
};

const SLOT_ORDER = ['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet'];
const SLOT_FILENAME = {
    Flower: '01_Flower',
    Plume: '02_Plume',
    Sands: '03_Sands',
    Goblet: '04_Goblet',
    Circlet: '05_Circlet',
};

const SPECIAL_SET_MAP = {
    // Handle typos and variations
    'Finale of the deep galeries': 'Finale_of_the_Deep_Galleries',
    'Finale of the Deep Galleries': 'Finale_of_the_Deep_Galleries',
    // Handle apostrophes -> folder names without apostrophes
    "Gladiator's Finale": 'Gladiators_Finale',
    "Wanderer's Troupe": 'Wanderers_Troupe',
    "Shimenawa's Reminiscence": 'Shimenawas_Reminiscence',
    "Nymph's Dream": 'Nymphs_Dream',
    "Vourukasha's Glow": 'Vourukashas_Glow',
    "Night of the Sky's Unveiling": 'Night_of_the_Skys_Unveiling',
    "Silken Moon's Serenade": 'Silken_Moons_Serenade',
    "Long Night's Oath": 'Long_Nights_Oath',
    "Lavawalker's Epiphany": 'Lavawalkers_Epiphany',
};

const normalizeSetName = (setName) => {
    if (!setName) return 'Unknown_Set';
    if (SPECIAL_SET_MAP[setName]) return SPECIAL_SET_MAP[setName];
    let cleaned = setName.replace(/'/g, '');
    cleaned = cleaned.replace(/[^a-zA-Z0-9- ]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned.replace(/ /g, '_');
};

const buildArtifactSubstats = (art) => {
    const stats = [];
    for (let i = 1; i <= 4; i += 1) {
        const name = art[`Sub${i}`];
        const val = art[`Sub${i}_Val`];
        if (name) {
            const formatted = val === '' || val === undefined ? name : `${name}+${val}`;
            stats.push(formatted);
        }
    }
    return stats;
};

const ArtifactRow = ({ artifactsBySlot }) => {
    const [hoveredSlot, setHoveredSlot] = useState(null);
    const activeSlot = hoveredSlot || SLOT_ORDER.find((slot) => artifactsBySlot[slot]) || SLOT_ORDER[0];
    const activeArt = activeSlot ? artifactsBySlot[activeSlot] : null;
    const substats = activeArt ? buildArtifactSubstats(activeArt) : [];
    const setFolder = activeArt ? normalizeSetName(activeArt.Set) : '';
    const slotFile = activeSlot ? SLOT_FILENAME[activeSlot] : '';
    const imgSrc = activeArt ? `/artifacts/${setFolder}/${slotFile}.png` : '';

    return (
        <div className="space-y-3">
            <div className="gi-artifact-slots">
                {SLOT_ORDER.map((slot) => {
                    const art = artifactsBySlot[slot];
                    const hasArt = Boolean(art);
                    const isActive = slot === activeSlot;
                    const artSetFolder = art ? normalizeSetName(art.Set) : '';
                    const artSlotFile = SLOT_FILENAME[slot];
                    const artImg = art ? `/artifacts/${artSetFolder}/${artSlotFile}.png` : '';
                    return (
                        <button
                            key={slot}
                            type="button"
                            onMouseEnter={() => setHoveredSlot(slot)}
                            onMouseLeave={() => setHoveredSlot(null)}
                            className={`gi-artifact-slot ${isActive ? 'gi-artifact-slot--active' : ''}`}
                        >
                            {hasArt ? (
                                <img
                                    src={artImg}
                                    alt={slot}
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/64x64/1a1f2a/5a6272?text=?';
                                    }}
                                />
                            ) : (
                                <span className="gi-artifact-slot__placeholder">{slot.slice(0, 2)}</span>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="gi-artifact-detail">
                {activeArt ? (
                    <>
                        <p className="gi-artifact-detail__title">
                            {activeSlot} · {activeArt.Set}
                        </p>
                        <p className="gi-artifact-detail__main">
                            <span className="gi-stat-label">Main:</span> <span className="gi-stat-value">{activeArt.Main_Stat} {activeArt.Main_Value}</span>
                        </p>
                        {substats.length > 0 && (
                            <div className="gi-artifact-detail__subs">
                                {substats.slice(0, 4).map((sub, idx) => (
                                    <p key={idx} className="gi-artifact-detail__sub">- {sub}</p>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="gi-artifact-detail__empty">No artifact equipped for this slot.</p>
                )}
            </div>
        </div>
    );
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
    const rarityIndex = useMemo(() => {
        const index = {};
        characterList.forEach((entry) => {
            if (entry.name) index[entry.name] = entry.rarity || 4;
            if (entry.id) index[String(entry.id)] = entry.rarity || 4;
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
            <div className="gi-page-header">
                <div>
                    <p className="gi-page-header__subtitle">Showcase</p>
                    <h2 className="gi-page-header__title">Your characters</h2>
                </div>
                <button onClick={() => navigate('/home')} className="gi-page-header__action">
                    New scan
                </button>
            </div>

            <div className="gi-search-bar">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search character"
                    />
                </div>
                <select
                    value={elementFilter}
                    onChange={(e) => setElementFilter(e.target.value)}
                >
                    {elementOptions.map((el) => (
                        <option key={el} value={el}>{el}</option>
                    ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">No characters match your filters.</div>
            ) : (
                <div className="gi-grid">
                    {filtered.map((char, idx) => {
                        const stats = char.stats;
                        const artCount = char.artifacts?.length || 0;
                        const artifactsBySlot = (char.artifacts || []).reduce((acc, art) => {
                            if (art.Slot) acc[art.Slot] = art;
                            return acc;
                        }, {});
                        const displayName = resolveDisplayNameMemo(stats.Character);
                        const resolvedElement = resolveElementMemo(stats.Character, stats.Element);
                        const folderName = normalizeCharacterFolder(displayName);
                        const imageSrc = folderName ? iconMap[folderName] : '';
                        const fallbackSrc = folderName ? cardMap[folderName] : '';
                        const rarity = rarityIndex[displayName] || rarityIndex[stats.Character] || 4;
                        return (
                            <div
                                key={idx}
                                onClick={() => handleSelect(stats.Character)}
                                className={`gi-card gi-card--rarity-${rarity}`}
                            >
                                <div className="gi-card-content">
                                    <div className="gi-card-left">
                                        <div className={`gi-avatar gi-avatar--rarity-${rarity}`}>
                                            {imageSrc ? (
                                                <img
                                                    src={imageSrc}
                                                    alt={stats.Character}
                                                    onError={(e) => {
                                                        if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
                                                            e.currentTarget.src = fallbackSrc;
                                                        } else {
                                                            e.currentTarget.src = 'https://placehold.co/96x96/1a1f2a/5a6272?text=?';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <User className="text-[var(--text-muted)]" />
                                            )}
                                            <ElementIcon element={resolvedElement} elementMap={elementMap} overlay />
                                        </div>
                                        <div className="gi-stars">
                                            {Array.from({ length: rarity }).map((_, i) => (
                                                <div key={i} className={`gi-stars__star ${rarity === 5 ? 'gi-stars__star--gold' : 'gi-stars__star--purple'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="gi-card-right">
                                        <div className="gi-card-header">
                                            <h3 className="gi-char-name">{displayName || stats.Character}</h3>
                                            <span className="gi-level-badge">Lv.{stats.Level}</span>
                                        </div>

                                        {/* Primary Stats Block (CR, CD, ER) */}
                                        <div className="gi-stats-primary">
                                            <div className="gi-stat-primary-item">
                                                <span className="gi-stat-primary-label">CR</span>
                                                <span className="gi-stat-primary-value">{stats['Crit_Rate%']}%</span>
                                            </div>
                                            <div className="gi-stat-primary-item">
                                                <span className="gi-stat-primary-label">CD</span>
                                                <span className="gi-stat-primary-value">{stats['Crit_DMG%']}%</span>
                                            </div>
                                            <div className="gi-stat-primary-item">
                                                <span className="gi-stat-primary-label">ER</span>
                                                <span className="gi-stat-primary-value">{stats['ER%']}%</span>
                                            </div>
                                        </div>

                                        {/* Secondary Stats Column (HP, ATK, DEF, EM) */}
                                        <div className="gi-stats-secondary">
                                            <div className="gi-stat-row">
                                                <span className="gi-stat-label">HP</span>
                                                <span className="gi-stat-value">{stats.HP || stats.Max_HP || 0}</span>
                                            </div>
                                            <div className="gi-stat-row">
                                                <span className="gi-stat-label">ATK</span>
                                                <span className="gi-stat-value">{stats.ATK}</span>
                                            </div>
                                            <div className="gi-stat-row">
                                                <span className="gi-stat-label">DEF</span>
                                                <span className="gi-stat-value">{stats.DEF}</span>
                                            </div>
                                            <div className="gi-stat-row">
                                                <span className="gi-stat-label">EM</span>
                                                <span className="gi-stat-value">{stats.EM || stats.Elemental_Mastery || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <ArtifactRow artifactsBySlot={artifactsBySlot} />

                                <div className="gi-card__footer">
                                    <span className="gi-card__footer-count">{artCount} artifacts</span>
                                    <span className="gi-card__footer-link">Optimize &rarr;</span>
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
