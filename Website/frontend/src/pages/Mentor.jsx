import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaderboard, analyzeBuild } from '../lib/api';
import {
  Brain,
  BookOpen,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Target,
  Layers,
  ArrowRightLeft,
  ListChecks,
  Gauge
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import characterList from '../../../../Characters/characters.json';

const iconFiles = import.meta.glob('../../../../Characters/**/icon.png', { eager: true, import: 'default' });
const cardFiles = import.meta.glob('../../../../Characters/**/card.png', { eager: true, import: 'default' });
const elementFiles = import.meta.glob('../../../../elements/Element_*.svg', { eager: true, import: 'default' });

const SLOT_ORDER = ['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet'];
const SLOT_FILENAME = {
  Flower: '05_Circlet',
  Plume: '04_Goblet',
  Sands: '03_Sands',
  Goblet: '02_Plume',
  Circlet: '01_Flower',
};

const SPECIAL_SET_MAP = {
  'Finale of the deep galeries': 'Finale_of_the_Deep_Galleries',
  'Finale of the Deep Galleries': 'Finale_of_the_Deep_Galleries',
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

const LOADING_MESSAGES = [
  'Analyzing scaling...',
  'Comparing top builds...',
  'Calculating stat targets...',
  'Building swap plan...',
  'Drafting final report...'
];

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Smarter)' },
  { id: 'gemini-pro-latest', name: 'Gemini Pro Latest (Experimental)' }
];

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

const normalizeCharacterFolder = (name) => {
  if (!name) return '';
  if (SPECIAL_CHARACTER_MAP[name]) return SPECIAL_CHARACTER_MAP[name];
  return name.replace(/[^a-zA-Z0-9]/g, '');
};

const ElementIcon = ({ element, elementMap }) => {
  const normalized = normalizeElement(element);
  if (!normalized) return null;
  const key = normalized.toLowerCase();
  const src = elementMap[key] || `/elements/Element_${normalized}.svg`;
  return <img src={src} alt={normalized} className="h-5 w-5" />;
};

const normalizeSetName = (setName) => {
  if (!setName) return 'Unknown_Set';
  if (SPECIAL_SET_MAP[setName]) return SPECIAL_SET_MAP[setName];
  let cleaned = setName.replace(/'/g, '');
  cleaned = cleaned.replace(/[^a-zA-Z0-9- ]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.replace(/ /g, '_');
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]+/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const repairJsonString = (input) => {
  let out = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (inString) {
      if (escape) {
        escape = false;
        out += ch;
        continue;
      }
      if (ch === '\\\\') {
        escape = true;
        out += ch;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === '\n' || ch === '\r') {
        out += '\\n';
        continue;
      }
      out += ch;
    } else {
      if (ch === '"') {
        inString = true;
      }
      out += ch;
    }
  }
  return out;
};

const formatStatValue = (value, isPercent = false) => {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'string') return value;
  if (isPercent) return `${value}%`;
  return `${value}`;
};

const Mentor = () => {
  const { charName } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState([]);
  const [calcId, setCalcId] = useState('');
  const [contextData, setContextData] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorFragment, setErrorFragment] = useState(null);
  const [buildNotes, setBuildNotes] = useState('');

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

  useEffect(() => {
    const stored = sessionStorage.getItem('user_data');
    if (!stored) {
      navigate('/home');
      return;
    }
    const parsed = JSON.parse(stored);
    setUserData(parsed);
    const char = parsed.find(c => c.stats.Character === charName);
    if (!char) navigate('/dashboard');
  }, [charName, navigate]);

  useEffect(() => {
    setAnalysis('');
    setContextData(null);
    setCalcId('');
    setErrorFragment(null);
  }, [charName]);

  useEffect(() => {
    let interval;
    if (loadingAI) {
      setLoadingMessage(LOADING_MESSAGES[0]);
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[i]);
      }, 2500);
    } else {
      setLoadingMessage('');
    }
    return () => clearInterval(interval);
  }, [loadingAI]);

  const currentChar = useMemo(() => {
    return userData.find(c => c.stats.Character === charName);
  }, [userData, charName]);

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

  const displayName = useMemo(() => resolveDisplayName(charName), [charName, characterIndex]);
  const resolvedElement = useMemo(() => resolveElement(charName, currentChar?.stats?.Element), [charName, currentChar, elementIndex]);
  const folderName = useMemo(() => normalizeCharacterFolder(displayName), [displayName]);
  const heroImage = folderName ? cardMap[folderName] || iconMap[folderName] : '';

  const currentBuild = useMemo(() => {
    const map = {};
    if (!currentChar?.artifacts) return map;
    currentChar.artifacts.forEach((art) => {
      const substats = [];
      for (let i = 1; i <= 4; i += 1) {
        const name = art[`Sub${i}`];
        const val = art[`Sub${i}_Val`];
        if (name) substats.push(`${name}${val !== '' ? `+${val}` : ''}`);
      }
      map[art.Slot] = {
        slot: art.Slot,
        set: art.Set,
        main_stat: art.Main_Stat,
        main_value: art.Main_Value,
        substats,
        owner: art.Character,
      };
    });
    return map;
  }, [currentChar]);

  const parsedAnalysis = useMemo(() => {
    if (!analysis) return null;
    try {
      const cleaned = analysis.replace(/```json|```/g, '').trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      const slice = jsonStart !== -1 && jsonEnd !== -1 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
      const noTrailingCommas = slice.replace(/,\s*([}\]])/g, '$1');
      const repaired = repairJsonString(noTrailingCommas);
      return JSON.parse(repaired);
    } catch (e) {
      return null;
    }
  }, [analysis]);

  const recommendedBuild = useMemo(() => {
    const map = {};
    if (!parsedAnalysis?.recommended_build) return map;
    parsedAnalysis.recommended_build.forEach((art) => {
      map[art.slot] = art;
    });
    return map;
  }, [parsedAnalysis]);

  const currentStats = useMemo(() => {
    const stats = currentChar?.stats || {};
    return {
      hp: toNumber(stats.HP),
      atk: toNumber(stats.ATK),
      def: toNumber(stats.DEF),
      em: toNumber(stats.EM),
      er: toNumber(stats['ER%']),
      cr: toNumber(stats['Crit_Rate%']),
      cd: toNumber(stats['Crit_DMG%']),
    };
  }, [currentChar]);

  const finalStats = parsedAnalysis?.final_stats || {};

  const statRows = useMemo(() => {
    const meta = [
      { key: 'hp', label: 'HP', isPercent: false },
      { key: 'atk', label: 'ATK', isPercent: false },
      { key: 'def', label: 'DEF', isPercent: false },
      { key: 'em', label: 'EM', isPercent: false },
      { key: 'er', label: 'ER', isPercent: true },
      { key: 'cr', label: 'CR', isPercent: true },
      { key: 'cd', label: 'CD', isPercent: true },
    ];

    return meta.map((item) => {
      const current = currentStats[item.key];
      const target = toNumber(finalStats[item.key]);
      const delta = current !== null && target !== null ? target - current : null;
      return { ...item, current, target, delta };
    });
  }, [currentStats, finalStats]);

  const benchmarkStats = useMemo(() => {
    if (!contextData || !Array.isArray(contextData) || contextData.length === 0) return null;
    const totals = {
      hp: 0, atk: 0, def: 0, em: 0, er: 0, cr: 0, cd: 0,
    };
    contextData.forEach((entry) => {
      totals.hp += Number(entry.HP || 0);
      totals.atk += Number(entry.ATK || 0);
      totals.def += Number(entry.DEF || 0);
      totals.em += Number(entry.EM || 0);
      totals.er += Number(entry.ER || 0);
      totals.cr += Number(entry.Crit_Rate || 0);
      totals.cd += Number(entry.Crit_DMG || 0);
    });
    const count = contextData.length || 1;
    return {
      hp: totals.hp / count,
      atk: totals.atk / count,
      def: totals.def / count,
      em: totals.em / count,
      er: totals.er / count,
      cr: totals.cr / count,
      cd: totals.cd / count,
    };
  }, [contextData]);

  const benchmarkRows = useMemo(() => {
    if (!benchmarkStats) return [];
    return statRows.map((row) => {
      const bench = benchmarkStats[row.key];
      const current = currentStats[row.key];
      const gap = bench !== null && current !== null ? bench - current : null;
      return { ...row, benchmark: bench, gap };
    });
  }, [benchmarkStats, statRows, currentStats]);

  const priorityList = Array.isArray(parsedAnalysis?.priority_list) ? parsedAnalysis.priority_list : [];

  const derivedSwapPlan = useMemo(() => {
    if (!parsedAnalysis?.recommended_build) return [];
    return SLOT_ORDER.reduce((acc, slot) => {
      const recommended = recommendedBuild[slot];
      const current = currentBuild[slot];
      if (!recommended) return acc;
      const currentDesc = current
        ? `${current.set || 'Unknown Set'} - ${current.main_stat || 'Main'} ${current.main_value || ''}`
        : 'None equipped';
      const recDesc = `${recommended.set || 'Unknown Set'} - ${recommended.main_stat || 'Main'} ${recommended.main_value || ''}`;
      const changed = !current || current.set !== recommended.set || current.main_stat !== recommended.main_stat;
      if (changed) {
        acc.push({
          slot,
          from: currentDesc,
          to: recDesc,
          reason: recommended.reason || 'Aligns with optimal stat distribution',
        });
      }
      return acc;
    }, []);
  }, [parsedAnalysis, recommendedBuild, currentBuild]);

  const swapPlan = Array.isArray(parsedAnalysis?.swap_plan) && parsedAnalysis.swap_plan.length
    ? parsedAnalysis.swap_plan
    : derivedSwapPlan;

  const calcIdValid = /^\d{5,}$/.test(calcId.trim());

  const handleFetchContext = async () => {
    if (!calcIdValid) {
      setErrorFragment('Leaderboard ID must be numeric.');
      return;
    }
    setLoadingContext(true);
    setErrorFragment(null);
    try {
      const res = await getLeaderboard(calcId.trim());
      setContextData(res.data);
    } catch (err) {
      console.error(err);
      setErrorFragment('Failed to fetch leaderboard. Check ID.');
    } finally {
      setLoadingContext(false);
    }
  };

  const handleAnalyze = async () => {
    const apiKey = localStorage.getItem('gemini_key');
    if (!apiKey) {
      navigate('/');
      return;
    }
    setLoadingAI(true);
    setErrorFragment(null);
    try {
      const res = await analyzeBuild(apiKey, userData, contextData, charName, selectedModel, buildNotes);
      setAnalysis(res.analysis);
    } catch (err) {
      console.error(err);
      setErrorFragment(err.response?.data?.detail || 'AI Analysis Failed. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleReset = () => {
    setAnalysis('');
    setErrorFragment(null);
  };

  const ArtifactCard = ({ title, artifact, slotKey }) => {
    if (!artifact) {
      return (
        <div className="border border-[var(--line)] rounded-2xl p-4 bg-[var(--surface-muted)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">No artifact</p>
        </div>
      );
    }

    const setFolder = normalizeSetName(artifact.set || artifact.Set);
    const slotFile = SLOT_FILENAME[slotKey] || SLOT_FILENAME[artifact.slot || artifact.Slot] || '01_Flower';
    const imgSrc = `/artifacts/${setFolder}/${slotFile}.png`;
    const substats = Array.isArray(artifact.substats) ? artifact.substats : [];

    return (
      <div className="border border-[var(--line)] rounded-2xl p-4 bg-white">
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
        <div className="flex items-center gap-4 mt-4">
          <div className="h-16 w-16 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-center">
            <img
              src={imgSrc}
              alt={artifact.slot || artifact.Slot}
              className="h-12 w-12 object-contain"
              onError={(e) => {
                e.target.src = `https://placehold.co/96x96/f8fafc/94a3b8?text=${(artifact.slot || artifact.Slot || 'ART').slice(0, 2)}`;
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text-strong)]">{artifact.set || artifact.Set || 'Unknown set'}</p>
            <p className="text-xs text-[var(--text-muted)]">{artifact.main_stat || artifact.Main_Stat} {artifact.main_value || artifact.Main_Value}</p>
          </div>
        </div>
        {substats.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-[var(--text)]">
            {substats.slice(0, 4).map((sub, idx) => (
              <li key={idx}>- {sub}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-white">
          {heroImage && (
            <div className="absolute inset-0 opacity-10">
              <img src={heroImage} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-10">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Mentor mode</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium text-[var(--accent-strong)] hover:text-[var(--accent)]"
              >
                Back to dashboard
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="h-28 w-20 sm:h-32 sm:w-24 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] overflow-hidden shadow-sm flex items-center justify-center">
                {heroImage ? (
                  <img
                    src={heroImage.replace('/card.png', '/icon.png')}
                    alt={displayName || charName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      if (heroImage) {
                        e.currentTarget.src = heroImage;
                      } else {
                        e.currentTarget.src = 'https://placehold.co/160x240/f8fafc/94a3b8?text=?';
                      }
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)]">?</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text-strong)] font-display">{displayName || charName}</h1>
                  <div className="h-8 w-8 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] flex items-center justify-center">
                    <ElementIcon element={resolvedElement} elementMap={elementMap} />
                  </div>
                </div>
                <p className="text-[var(--text-muted)] mt-2">Comparisons, swap plan, and tailored analysis.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Gauge className="text-[var(--accent-strong)]" size={20} />
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Stat delta to target</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">Current stats vs recommended final stats.</p>

            {!parsedAnalysis ? (
              <div className="mt-6 text-sm text-[var(--text-muted)]">Generate an analysis to see deltas.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                {statRows.map((row) => (
                  <div key={row.key} className="border border-[var(--line)] rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{row.label}</p>
                    <p className="text-sm text-[var(--text)] mt-2">
                      Current: {formatStatValue(row.current, row.isPercent)}
                    </p>
                    <p className="text-sm text-[var(--text-strong)]">
                      Target: {formatStatValue(row.target, row.isPercent)}
                    </p>
                    <p className={`text-xs mt-2 ${row.delta === null ? 'text-[var(--text-muted)]' : row.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Delta: {row.delta === null ? '--' : `${row.delta > 0 ? '+' : ''}${row.delta.toFixed(1)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="text-[var(--accent-strong)]" size={20} />
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Swap plan</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">Suggested swaps by slot, based on the AI selection.</p>

            {swapPlan.length === 0 ? (
              <div className="mt-5 text-sm text-[var(--text-muted)]">Generate an analysis to unlock the swap plan.</div>
            ) : (
              <div className="mt-5 space-y-4">
                {swapPlan.map((swap, idx) => (
                  <div key={`${swap.slot}-${idx}`} className="border border-[var(--line)] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--text-strong)]">{swap.slot}</p>
                      <span className="text-xs text-[var(--text-muted)]">{swap.reason || 'Upgrade'}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">From: {swap.from}</p>
                    <p className="text-xs text-[var(--text)]">To: {swap.to}</p>
                  </div>
                ))}
              </div>
            )}

            {priorityList.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <ListChecks size={16} className="text-[var(--accent-strong)]" />
                  <p className="text-sm font-semibold text-[var(--text-strong)]">Priority list</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {priorityList.map((item, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Layers className="text-[var(--accent-strong)]" size={20} />
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Current vs recommended build</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">Side-by-side artifacts by slot.</p>

            <div className="mt-6 space-y-6">
              {SLOT_ORDER.map((slot) => (
                <div key={slot}>
                  <p className="text-sm font-semibold text-[var(--text-strong)] mb-3">{slot}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ArtifactCard title="Current" artifact={currentBuild[slot]} slotKey={slot} />
                    <ArtifactCard title="Recommended" artifact={recommendedBuild[slot]} slotKey={slot} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {benchmarkStats && (
            <div className="bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Target className="text-[var(--accent-strong)]" size={20} />
                <h3 className="text-lg font-semibold text-[var(--text-strong)]">Benchmark gap</h3>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-2">Difference between your stats and top leaderboard averages.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                {benchmarkRows.map((row) => (
                  <div key={row.key} className="border border-[var(--line)] rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{row.label}</p>
                    <p className="text-sm text-[var(--text)] mt-2">Avg: {formatStatValue(row.benchmark, row.isPercent)}</p>
                    <p className={`text-xs mt-2 ${row.gap === null ? 'text-[var(--text-muted)]' : row.gap <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Gap: {row.gap === null ? '--' : `${row.gap > 0 ? '+' : ''}${row.gap.toFixed(1)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BookOpen className="text-[var(--accent-strong)]" size={20} />
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Benchmark context</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">Load Akasha leaderboard data to calibrate your target stats.</p>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Leaderboard ID"
                value={calcId}
                onChange={(e) => {
                  setCalcId(e.target.value);
                  if (errorFragment) setErrorFragment(null);
                }}
                className="w-full border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent-strong)]"
              />
              <button
                onClick={handleFetchContext}
                disabled={loadingContext || !calcIdValid}
                className="w-full py-3 rounded-xl font-semibold bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingContext ? 'Loading...' : 'Load benchmark'}
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">AI model</p>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-2 w-full border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3 rounded-xl text-sm focus:outline-none"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Build preferences</p>
              <textarea
                value={buildNotes}
                onChange={(e) => setBuildNotes(e.target.value)}
                rows={4}
                placeholder="Example: I want 200% ER, 70% Crit Rate, prioritize ATK over EM..."
                className="mt-2 w-full border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent-strong)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">These notes are sent to the AI as constraints.</p>
            </div>

          <button
            onClick={handleAnalyze}
            disabled={!contextData || loadingAI}
              className="mt-6 w-full py-3 bg-[var(--text-strong)] text-white rounded-xl font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingAI ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Generate guide
                </>
              )}
            </button>

            {errorFragment && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertCircle size={18} />
                {errorFragment}
              </div>
            )}
          </div>

          {contextData && (
            <div className="bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Top build preview</p>
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                {contextData.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="border border-[var(--line)] rounded-2xl p-3 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">#{idx + 1}</span>
                    <span className="text-[var(--text)]">CR {entry.Crit_Rate}% / CD {entry.Crit_DMG}%</span>
                    <span className="text-[var(--text-muted)]">{entry.Weapon || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[var(--line)] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="text-[var(--accent-strong)]" size={20} />
                <h3 className="text-lg font-semibold text-[var(--text-strong)]">AI analysis</h3>
              </div>
              {analysis && !loadingAI && (
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] flex items-center gap-1"
                >
                  <RefreshCw size={14} /> New analysis
                </button>
              )}
            </div>

            {!analysis && !loadingAI ? (
              <div className="mt-6 text-sm text-[var(--text-muted)]">Generate a guide to view the AI analysis.</div>
            ) : (
              <div className="mt-6 space-y-3">
                {parsedAnalysis && typeof parsedAnalysis.mentor_analysis === 'string' && parsedAnalysis.mentor_analysis.trim() ? (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{parsedAnalysis.mentor_analysis}</ReactMarkdown>
                  </div>
                ) : parsedAnalysis ? (
                  <>
                    <p className="text-xs text-[var(--text-muted)]">
                      AI returned structured JSON without a detailed analysis block. Showing raw JSON output.
                    </p>
                    <pre className="text-xs bg-[var(--surface-muted)] border border-[var(--line)] rounded-2xl p-4 overflow-auto text-[var(--text-strong)]">
{JSON.stringify(parsedAnalysis, null, 2)}
                    </pre>
                  </>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Mentor;
