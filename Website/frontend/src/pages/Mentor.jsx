import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLeaderboard, getLeaderboardDeep, analyzeBuild } from "../lib/api";
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
  Gauge,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import characterList from "@characters/characters.json";

const iconFiles = import.meta.glob("../../../../Characters/**/icon.png", {
  eager: true,
  import: "default",
});
const cardFiles = import.meta.glob("../../../../Characters/**/card.png", {
  eager: true,
  import: "default",
});
const elementFiles = import.meta.glob("../../../../elements/Element_*.svg", {
  eager: true,
  import: "default",
});

const SLOT_ORDER = ["Flower", "Plume", "Sands", "Goblet", "Circlet"];
const SLOT_FILENAME = {
  Flower: "01_Flower",
  Plume: "02_Plume",
  Sands: "03_Sands",
  Goblet: "04_Goblet",
  Circlet: "05_Circlet",
};

const SPECIAL_SET_MAP = {
  "Finale of the deep galeries": "Finale_of_the_Deep_Galleries",
  "Finale of the Deep Galleries": "Finale_of_the_Deep_Galleries",
};

const SPECIAL_CHARACTER_MAP = {
  "Raiden Shogun": "RaidenShogun",
  "Arataki Itto": "AratakiItto",
  "Sangonomiya Kokomi": "SangonomiyaKokomi",
  "Kaedehara Kazuha": "KaedeharaKazuha",
  "Kuki Shinobu": "KukiShinobu",
  "Yun Jin": "YunJin",
  "Hu Tao": "HuTao",
  "Hu Tao (Trial)": "HuTao(Trial)",
  "Kamisato Ayaka": "KamisatoAyaka",
  "Kamisato Ayato": "KamisatoAyato",
  "Kujou Sara": "KujouSara",
  Mavuika: "Mavuika",
};

const LOADING_MESSAGES = [
  "Analyzing scaling...",
  "Comparing top builds...",
  "Calculating stat targets...",
  "Building swap plan...",
  "Drafting final report...",
];

const MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Fast)" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Smarter)" },
  { id: "gemini-pro-latest", name: "Gemini Pro Latest (Experimental)" },
];

const PROVIDERS = [
  { id: "ollama", name: "🏠 Local (Mistral)", requiresKey: false },
  { id: "gemini", name: "☁️ Cloud (Gemini)", requiresKey: true },
];

const buildImageMap = (files) => {
  const map = {};
  Object.entries(files).forEach(([filePath, url]) => {
    const parts = filePath.split("/");
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

const ALLOWED_ELEMENTS = new Set([
  "Pyro",
  "Hydro",
  "Electro",
  "Cryo",
  "Dendro",
  "Anemo",
  "Geo",
]);

const normalizeElement = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") return "";
  const lower = trimmed.toLowerCase();
  const normalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  return ALLOWED_ELEMENTS.has(normalized) ? normalized : "";
};

const normalizeCharacterFolder = (name) => {
  if (!name) return "";
  if (SPECIAL_CHARACTER_MAP[name]) return SPECIAL_CHARACTER_MAP[name];
  return name.replace(/[^a-zA-Z0-9]/g, "");
};

const ElementIcon = ({ element, elementMap }) => {
  const normalized = normalizeElement(element);
  if (!normalized) return null;
  const key = normalized.toLowerCase();
  const src = elementMap[key] || `/elements/Element_${normalized}.svg`;
  return <img src={src} alt={normalized} className="h-5 w-5" />;
};

const normalizeSetName = (setName) => {
  if (!setName) return "Unknown_Set";
  if (SPECIAL_SET_MAP[setName]) return SPECIAL_SET_MAP[setName];
  let cleaned = setName.replace(/'/g, "");
  cleaned = cleaned.replace(/[^a-zA-Z0-9- ]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned.replace(/ /g, "_");
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/[^0-9.-]+/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const repairJsonString = (input) => {
  let out = "";
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
      if (ch === "\\\\") {
        escape = true;
        out += ch;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === "\n" || ch === "\r") {
        out += "\\n";
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
  if (value === null || value === undefined) return "--";
  if (typeof value === "string") return value;
  if (isPercent) return `${value}%`;
  return `${value}`;
};

const Mentor = () => {
  const { charName } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState([]);
  const [calcId, setCalcId] = useState("");
  const [contextData, setContextData] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [parsedAnalysisData, setParsedAnalysisData] = useState(null);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [selectedProvider, setSelectedProvider] = useState(() => {
    return localStorage.getItem("ai_provider") || "ollama";
  });
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorFragment, setErrorFragment] = useState(null);
  const [buildNotes, setBuildNotes] = useState("");
  const [deepLimit, setDeepLimit] = useState("20");

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
    const stored = sessionStorage.getItem("user_data");
    if (!stored) {
      navigate("/home");
      return;
    }
    const parsed = JSON.parse(stored);
    setUserData(parsed);
    const char = parsed.find((c) => c.stats.Character === charName);
    if (!char) navigate("/dashboard");
  }, [charName, navigate]);

  useEffect(() => {
    setAnalysis("");
    setContextData(null);
    setCalcId("");
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
      setLoadingMessage("");
    }
    return () => clearInterval(interval);
  }, [loadingAI]);

  const currentChar = useMemo(() => {
    return userData.find((c) => c.stats.Character === charName);
  }, [userData, charName]);

  const resolveDisplayName = (rawName) => {
    if (!rawName) return "";
    if (rawName.startsWith("ID")) {
      const idMatch = rawName.match(/\d+/);
      if (idMatch && characterIndex[idMatch[0]]) {
        return characterIndex[idMatch[0]];
      }
    }
    return rawName;
  };

  const resolveElement = (rawName, fallback) => {
    if (!rawName) return "";
    const idMatch = rawName.match(/\d+/);
    if (idMatch && elementIndex[idMatch[0]]) {
      return elementIndex[idMatch[0]];
    }
    if (elementIndex[rawName]) {
      return elementIndex[rawName];
    }
    return normalizeElement(fallback);
  };

  const displayName = useMemo(
    () => resolveDisplayName(charName),
    [charName, characterIndex],
  );
  const resolvedElement = useMemo(
    () => resolveElement(charName, currentChar?.stats?.Element),
    [charName, currentChar, elementIndex],
  );
  const folderName = useMemo(
    () => normalizeCharacterFolder(displayName),
    [displayName],
  );
  const heroImage = folderName
    ? cardMap[folderName] || iconMap[folderName]
    : "";

  const currentBuild = useMemo(() => {
    const map = {};
    if (!currentChar?.artifacts) return map;
    currentChar.artifacts.forEach((art) => {
      const substats = [];
      for (let i = 1; i <= 4; i += 1) {
        const name = art[`Sub${i}`];
        const val = art[`Sub${i}_Val`];
        if (name) substats.push(`${name}${val !== "" ? `+${val}` : ""}`);
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
    // First check if we have parsed data from handleAnalyze
    if (parsedAnalysisData) return parsedAnalysisData;

    // Fallback: try to parse analysis text as JSON
    if (!analysis) return null;
    try {
      const cleaned = analysis.replace(/```json|```/g, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      const slice =
        jsonStart !== -1 && jsonEnd !== -1
          ? cleaned.slice(jsonStart, jsonEnd + 1)
          : cleaned;
      const noTrailingCommas = slice.replace(/,\s*([}\]])/g, "$1");
      const repaired = repairJsonString(noTrailingCommas);
      return JSON.parse(repaired);
    } catch (e) {
      return null;
    }
  }, [analysis, parsedAnalysisData]);

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
      er: toNumber(stats["ER%"]),
      cr: toNumber(stats["Crit_Rate%"]),
      cd: toNumber(stats["Crit_DMG%"]),
    };
  }, [currentChar]);

  const finalStats = parsedAnalysis?.final_stats || {};

  const statRows = useMemo(() => {
    const meta = [
      { key: "hp", label: "HP", isPercent: false },
      { key: "atk", label: "ATK", isPercent: false },
      { key: "def", label: "DEF", isPercent: false },
      { key: "em", label: "EM", isPercent: false },
      { key: "er", label: "ER", isPercent: true },
      { key: "cr", label: "CR", isPercent: true },
      { key: "cd", label: "CD", isPercent: true },
    ];

    return meta.map((item) => {
      const current = currentStats[item.key];
      const target = toNumber(finalStats[item.key]);
      const delta =
        current !== null && target !== null ? target - current : null;
      return { ...item, current, target, delta };
    });
  }, [currentStats, finalStats]);

  const benchmarkStats = useMemo(() => {
    if (!contextData || !Array.isArray(contextData) || contextData.length === 0)
      return null;
    const totals = {
      hp: 0,
      atk: 0,
      def: 0,
      em: 0,
      er: 0,
      cr: 0,
      cd: 0,
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

  const priorityList = Array.isArray(parsedAnalysis?.priority_list)
    ? parsedAnalysis.priority_list
    : [];

  const derivedSwapPlan = useMemo(() => {
    if (!parsedAnalysis?.recommended_build) return [];
    return SLOT_ORDER.reduce((acc, slot) => {
      const recommended = recommendedBuild[slot];
      const current = currentBuild[slot];
      if (!recommended) return acc;
      const currentDesc = current
        ? `${current.set || "Unknown Set"} - ${current.main_stat || "Main"} ${current.main_value || ""}`
        : "None equipped";
      const recDesc = `${recommended.set || "Unknown Set"} - ${recommended.main_stat || "Main"} ${recommended.main_value || ""}`;
      acc.push({
        slot,
        from: currentDesc,
        to: recDesc,
        reason: recommended.reason || "Aligns with optimal stat distribution",
      });
      return acc;
    }, []);
  }, [parsedAnalysis, recommendedBuild, currentBuild]);

  const swapPlan =
    Array.isArray(parsedAnalysis?.swap_plan) && parsedAnalysis.swap_plan.length
      ? parsedAnalysis.swap_plan
      : derivedSwapPlan;

  const calcIdValid = /^\d{5,}$/.test(calcId.trim());

  const handleFetchContext = async () => {
    if (!calcIdValid) {
      setErrorFragment("Leaderboard ID must be numeric.");
      return;
    }
    setLoadingContext(true);
    setErrorFragment(null);
    try {
      const res = await getLeaderboard(calcId.trim());
      const payload = res?.data ?? res;
      setContextData(payload);
      sessionStorage.setItem("context_data", JSON.stringify(payload));
    } catch (err) {
      console.error("getLeaderboard error", err, err.response?.data);
      setErrorFragment(
        err.response?.data?.detail || "Failed to fetch leaderboard. Check ID.",
      );
    } finally {
      setLoadingContext(false);
    }
  };

  const handleFetchDeepContext = async () => {
    if (!calcIdValid) {
      setErrorFragment("Leaderboard ID must be numeric.");
      return;
    }
    const parsedLimit = Number(deepLimit);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.round(parsedLimit), 5), 100)
      : 20;
    setLoadingDeep(true);
    setErrorFragment(null);
    try {
      const target = displayName || charName;
      const res = await getLeaderboardDeep(calcId.trim(), target, safeLimit);
      const payload = res?.data ?? res;
      setContextData(payload);
      sessionStorage.setItem("context_data", JSON.stringify(payload));
    } catch (err) {
      console.error("getLeaderboardDeep error", err, err.response?.data);
      setErrorFragment(
        err.response?.data?.detail ||
        "Deep scan failed. This can take time or hit rate limits.",
      );
    } finally {
      setLoadingDeep(false);
    }
  };

  const handleAnalyze = async () => {
    const apiKey = localStorage.getItem("gemini_key");
    const requiresKey = PROVIDERS.find(
      (p) => p.id === selectedProvider,
    )?.requiresKey;

    if (requiresKey && !apiKey) {
      navigate("/");
      return;
    }
    setLoadingAI(true);
    setErrorFragment(null);
    try {
      const res = await analyzeBuild(
        apiKey,
        userData,
        contextData,
        charName,
        selectedModel,
        buildNotes,
        selectedProvider,
      );

      // Extract and parse the JSON response
      let analysisText = res.analysis || res.message || res.response || "";
      let fullData = null;

      try {
        // First try to parse as JSON directly (with or without code fences)
        let cleanText = analysisText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        // Look for { at start of JSON
        const jsonStart = cleanText.indexOf("{");
        const jsonEnd = cleanText.lastIndexOf("}");

        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = cleanText.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonStr);

          // Store the full data for swap plan and recommendations
          fullData = parsed;

          // Extract mentor_analysis - ALWAYS use this if it exists
          if (parsed.mentor_analysis) {
            analysisText = parsed.mentor_analysis;
            // Replace escaped newlines with actual newlines
            analysisText = analysisText.replace(/\\n/g, "\n");
          } else {
            // If no mentor_analysis, show that analysis failed
            analysisText =
              "Analysis completed but no mentor analysis text was returned.";
          }
        } else {
          // No JSON found - show the text as-is
          analysisText = cleanText;
        }
      } catch (parseErr) {
        console.error("Failed to parse JSON:", parseErr);
        // Just strip code fences and show raw text
        analysisText = analysisText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        if (!analysisText) {
          analysisText = "Failed to parse analysis response.";
        }
      }

      setAnalysis(analysisText);
      setParsedAnalysisData(fullData);
      localStorage.setItem("last_chat_char", charName);
    } catch (err) {
      console.error(err);
      setErrorFragment(
        err.response?.data?.detail || "AI Analysis Failed. Please try again.",
      );
    } finally {
      setLoadingAI(false);
    }
  };

  const handleReset = () => {
    setAnalysis("");
    setParsedAnalysisData(null);
    setErrorFragment(null);
  };

  const StatDelta = ({ rows }) => (
    <div className="p-3 bg-[var(--color-surface)] rounded-xl">
      <h3 className="text-lg font-display text-[var(--color-text-strong)] flex items-center gap-2">
        <Target size={16} /> Stat Delta → Target
      </h3>
      <div className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex justify-between text-[var(--color-text)]"
          >
            <div className="text-[var(--color-text-muted)]">{row.label}</div>
            <div className="font-sans font-semibold">
              <span
                className={
                  row.delta > 0
                    ? "text-green-400"
                    : row.delta < 0
                      ? "text-red-400"
                      : ""
                }
              >
                {row.delta
                  ? `${row.delta > 0 ? "+" : ""}${formatStatValue(row.delta.toFixed(1), row.isPercent)}`
                  : ""}
              </span>{" "}
              → {formatStatValue(row.target, row.isPercent)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SwapPlan = ({ items, recommendedBuild }) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-[var(--color-text-muted)]">
          Run analysis to generate a swap plan.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item, i) => {
          const recommended = recommendedBuild[item.slot];
          return (
            <div
              key={i}
              className="p-3 bg-[var(--color-surface-muted)] rounded-lg flex gap-4 items-center"
            >
              {/* Left side: Artifact Icon */}
              <div className="flex-shrink-0">
                <ArtifactCard
                  artifact={recommended}
                  slotKey={item.slot}
                  isMini
                />
              </div>

              {/* Right side: Details */}
              <div className="flex-1 text-sm overflow-hidden">
                <p className="font-bold text-[var(--color-text-strong)] truncate">
                  {recommended?.set || "Unknown Set"}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {item.slot} →{" "}
                  <span className="font-semibold text-[var(--color-text-strong)]">
                    {recommended?.main_stat || "N/A"}{" "}
                    {recommended?.main_value
                      ? `+${recommended.main_value}`
                      : ""}
                  </span>
                </p>

              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const ArtifactCard = ({ title, artifact, slotKey, isMini = false }) => {
    // --- No Artifact State ---
    if (!artifact) {
      const cardSize = isMini ? "h-14 w-14" : "h-28 w-28";
      const textSize = isMini ? "text-[10px]" : "text-xs";
      return (
        <div
          className={`border border-[var(--line)] rounded-xl p-2 flex flex-col items-center justify-center bg-[var(--surface-muted)] ${cardSize}`}
        >
          <p
            className={`uppercase tracking-wide text-center text-[var(--text-muted)] ${textSize}`}
          >
            {title || slotKey}
          </p>
          <p className={`mt-1 text-center ${textSize} text-[var(--text-muted)]`}>
            None
          </p>
        </div>
      );
    }
    // --- Image Source Logic ---
    const slotFile =
      SLOT_FILENAME[slotKey] ||
      SLOT_FILENAME[artifact.slot] ||
      "01_Flower";
    const setName =
      artifact.set ||
      artifact.set_name ||
      "";
    const setFolder = normalizeSetName(setName);

    // Prioritize direct icon URLs, then construct path
    const imgSrc =
      artifact.artifact_icon ||
      artifact.image_url ||
      `/artifacts/${setFolder}/${slotFile}.png`;

    const handleError = (e) => {
      // 1. Try the base folder path (in case the slot filename was wrong)
      e.currentTarget.src = `/artifacts/${setFolder}/01_Flower.png`;
      // 2. If that also fails, use a placeholder
      e.currentTarget.onerror = () => {
        e.currentTarget.src = `https://placehold.co/96x96/1a1f2c/a0a5b1?text=${(slotKey || "ART").slice(0, 3)}`;
      };
    };

    // --- Substats ---
    const substats = artifact.substats || artifact.subs || [];

    // --- Mini Variant ---
    if (isMini) {
      return (
        <div className="h-14 w-14 rounded-lg bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-center overflow-hidden">
          <img
            src={imgSrc}
            alt={setName}
            className="h-12 w-12 object-contain"
            onError={handleError}
          />
        </div>
      );
    }
    // --- Full Card Variant ---
    return (
      <div className="border border-[var(--line)] rounded-2xl p-3 bg-[var(--surface)] glass-ai h-full flex flex-col">
        <p className="text-xs uppercase tracking-wide font-bold text-center text-[var(--text-muted)] mb-2">
          {title || slotKey}
        </p>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="h-16 w-16 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-center overflow-hidden">
            <img
              src={imgSrc}
              alt={setName}
              className="h-14 w-14 object-contain"
              onError={handleError}
            />
          </div>
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-[var(--color-text-strong)] leading-tight">
              {setName}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {artifact.main_stat}{" "}
              <span className="font-bold text-[var(--color-text-strong)]">
                {`+${artifact.main_value}`}
              </span>
            </p>
          </div>
        </div>
        {substats.length > 0 && (
          <ul className="mt-2 pt-2 border-t border-[var(--line)] space-y-0.5 text-xs text-[var(--color-text)]">
            {substats.slice(0, 4).map((sub, idx) => (
              <li key={idx} className="truncate">
                + {sub}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      <div className="w-full surface rounded-2xl overflow-hidden shadow-lg">
        {/* ZONE A - HEADER SHOWCASE (Horizontal container) */}
        <div className="flex flex-col md:flex-row items-stretch gap-4 p-6 md:p-8">
          {/* Left (Portrait) - full-height aura */}
          <div
            className="md:w-1/3 flex-shrink-0 relative overflow-visible"
          >
            <div className="h-full flex flex-col items-center justify-center p-4 md:p-6">
              <div className="w-full h-72 md:h-[340px] rounded-2xl overflow-hidden flex items-center justify-center border border-[var(--color-accent-soft)] ring-1 ring-[var(--color-accent-soft)]" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,164,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={displayName}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      if (heroImage && e.currentTarget.src !== heroImage)
                        e.currentTarget.src = heroImage;
                    }}
                  />
                ) : (
                  <div className="w-full h-full surface-muted flex items-center justify-center text-[var(--color-text-muted)]">
                    No Image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center (Stats Actuelles) - compact */}
          <div className="md:flex-1 flex flex-col justify-center p-4">
            <div className="bg-[var(--color-surface)] p-4 rounded-xl">
              <h3 className="text-xl font-display text-[var(--color-text-strong)]">
                Current Stats
              </h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[var(--color-text)]">
                <div className="text-sm">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    ATK
                  </div>
                  <div className="font-sans font-semibold">
                    {currentStats.atk ?? "--"}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    CR
                  </div>
                  <div className="font-sans font-semibold">
                    {currentStats.cr ?? "--"}%
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    CD
                  </div>
                  <div className="font-sans font-semibold">
                    {currentStats.cd ?? "--"}%
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    ER
                  </div>
                  <div className="font-sans font-semibold">
                    {currentStats.er ?? "--"}%
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    EM
                  </div>
                  <div className="font-sans font-semibold">
                    {currentStats.em ?? "--"}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    HP
                  </div>
                  <div className="font-sans font-semibold">
                    {currentStats.hp ?? "--"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right (Diagnostic) - Delta to Target + Swap Plan merged */}
          <div className="md:w-1/3 p-4 flex flex-col gap-4">
            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={loadingAI}
                className="px-3 py-1 rounded-md bg-[var(--color-accent-strong)] text-black"
              >
                {loadingAI ? loadingMessage : "Run Analysis"}
              </button>
            </div>
            <div className="p-3 bg-[var(--color-surface)] rounded-xl">
              <h3 className="text-lg font-display text-[var(--color-text-strong)] flex items-center gap-2">
                <Target size={16} /> Stat Delta → Target
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                {statRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex justify-between text-[var(--color-text)]"
                  >
                    <div className="text-[var(--color-text-muted)]">
                      {row.label}
                    </div>
                    <div className="font-sans font-semibold">
                      {row.target ?? "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SWAP PLAN - Moved to top */}
        <div className="p-6 bg-[var(--color-surface)] rounded-xl mx-6 mb-6 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-display text-[var(--color-text-strong)] flex items-center gap-2">
            <ListChecks size={16} /> Swap Plan
          </h3>
          <div className="mt-4 space-y-3">
            {!swapPlan || swapPlan.length === 0 ? (
              <div className="text-[var(--color-text-muted)]">
                No swap recommendations.
              </div>
            ) : (
              swapPlan.map((s, i) => {
                const rec = recommendedBuild[s.slot];
                const slotFile = SLOT_FILENAME[s.slot] || "01_Flower";
                const setName = rec?.set || rec?.Set || "";
                const setFolder = setName ? normalizeSetName(setName) : "";
                const mainStat = rec?.main_stat || "Main Stat";
                const mainValue = rec?.main_value || "";

                return (
                  <div
                    key={i}
                    className="p-3 bg-[var(--color-surface-muted)] rounded-lg flex gap-3 items-start"
                  >
                    <div className="flex-shrink-0 w-16 h-16">
                      <ArtifactCard
                        title={s.slot}
                        artifact={rec}
                        slotKey={s.slot}
                        isMini
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="text-xs text-[var(--color-text-muted)] font-semibold">
                        {s.slot}
                      </div>
                      <div className="font-sans font-semibold text-[var(--color-text-strong)]">
                        {mainStat} {mainValue && `+${mainValue}`}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">
                        {s.reason || "Aligns with optimal stat distribution"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ZONE B - DASHBOARD TECHNIQUE (Grid 2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Colonne Gauche - Build Comparison */}
          <div className="p-4 bg-[var(--color-surface)] rounded-xl">
            <h3 className="text-lg font-display text-[var(--color-text-strong)]">
              Build Comparison
            </h3>
            <div className="mt-4 space-y-3">
              {SLOT_ORDER.map((slot) => (
                <div key={slot} className="grid grid-cols-2 gap-3 items-start">
                  <div>
                    <h5 className="text-xs text-[var(--color-text-muted)] mb-2">
                      {slot} — Current
                    </h5>
                    <ArtifactCard
                      title={slot}
                      artifact={currentBuild[slot]}
                      slotKey={slot}
                    />
                  </div>
                  <div>
                    <h5 className="text-xs text-[var(--color-text-muted)] mb-2">
                      {slot} — Recommended
                    </h5>
                    <ArtifactCard
                      title={slot}
                      artifact={recommendedBuild[slot]}
                      slotKey={slot}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne Droite - Config & Intelligence */}
          <div className="p-4 bg-[var(--color-surface)] rounded-xl flex flex-col gap-4">
            {/* Benchmark Context */}
            <div className="p-3 bg-[var(--color-surface-muted)] rounded-md">
              <h4 className="text-sm font-display text-[var(--color-text-strong)]">
                Benchmark Context
              </h4>
              <div className="mt-3 space-y-2 text-sm">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Leaderboard ID
                </label>
                <div className="flex gap-2">
                  <input
                    value={calcId}
                    onChange={(e) => setCalcId(e.target.value)}
                    className="flex-1 p-2 bg-[var(--color-surface-muted)] rounded-md text-[var(--color-text-strong)]"
                    placeholder="Enter leaderboard ID"
                  />
                  <button
                    onClick={handleFetchContext}
                    disabled={loadingContext || !calcIdValid}
                    className="px-3 py-2 rounded-md border border-[var(--color-line)] text-[var(--color-text-strong)] disabled:opacity-50"
                  >
                    {loadingContext ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Quick"
                    )}
                  </button>
                  <button
                    onClick={handleFetchDeepContext}
                    disabled={loadingDeep || !calcIdValid}
                    className="px-3 py-2 rounded-md bg-[var(--color-accent-strong)] text-black disabled:opacity-50"
                  >
                    {loadingDeep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Deep"
                    )}
                  </button>
                </div>
                {errorFragment && (
                  <div className="text-xs text-red-400">{errorFragment}</div>
                )}
              </div>

              {/* Leaderboard Display */}
              {contextData && contextData.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs text-[var(--color-text-muted)] mb-2">
                    Benchmark Data ({contextData.length} profiles)
                  </h5>
                  <div className="overflow-x-auto max-h-48 overflow-y-auto border border-[var(--color-surface)] rounded-md">
                    <table className="w-full text-[0.75rem] text-[var(--color-text)]">
                      <thead className="sticky top-0 bg-[var(--color-surface-muted)]">
                        <tr>
                          <th className="px-2 py-1 text-left">Rank</th>
                          <th className="px-2 py-1 text-left">UID</th>
                          <th className="px-2 py-1 text-right">ATK</th>
                          <th className="px-2 py-1 text-right">CR</th>
                          <th className="px-2 py-1 text-right">CD</th>
                          <th className="px-2 py-1 text-right">HP</th>
                          <th className="px-2 py-1 text-right">DEF</th>
                          <th className="px-2 py-1 text-right">EM</th>
                          <th className="px-2 py-1 text-right">ER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contextData.slice(0, 5).map((entry, idx) => (
                          <tr
                            key={idx}
                            className="border-t border-[var(--color-surface)]"
                          >
                            <td className="px-2 py-1">
                              {entry.Rank || idx + 1}
                            </td>
                            <td className="px-2 py-1">{entry.UID}</td>
                            <td className="px-2 py-1 text-right">
                              {entry.ATK}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {entry.Crit_Rate?.toFixed(1)}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {entry.Crit_DMG?.toFixed(1)}
                            </td>
                            <td className="px-2 py-1 text-right">{entry.HP}</td>
                            <td className="px-2 py-1 text-right">
                              {entry.DEF}
                            </td>
                            <td className="px-2 py-1 text-right">{entry.EM}</td>
                            <td className="px-2 py-1 text-right">
                              {entry.ER?.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* AI Settings */}
            <div className="p-3 bg-[var(--color-surface-muted)] rounded-md">
              <h4 className="text-sm font-display text-[var(--color-text-strong)]">
                AI Settings
              </h4>
              <div className="mt-3 space-y-2 text-sm">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Provider
                </label>
                <div className="flex gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id)}
                      className={`px-2 py-1 rounded-md ${selectedProvider === p.id ? "bg-[var(--color-accent-strong)] text-black" : "bg-[var(--color-surface-muted)] text-[var(--color-text)]"}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <label className="text-xs text-[var(--color-text-muted)] mt-2">
                  Model
                </label>
                <div className="flex gap-2">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`px-2 py-1 rounded-md ${selectedModel === m.id ? "bg-[var(--color-accent-strong)] text-black" : "bg-[var(--color-surface-muted)] text-[var(--color-text)]"}`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                <label className="text-xs text-[var(--color-text-muted)] mt-2">
                  Build Preferences
                </label>
                <textarea
                  value={buildNotes}
                  onChange={(e) => setBuildNotes(e.target.value)}
                  className="w-full p-2 bg-[var(--color-surface-muted)] rounded-md text-[var(--color-text-strong)]"
                  placeholder="e.g. 140% ER, 4pc Gilded"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={loadingAI}
                className="flex-1 px-4 py-2 bg-[var(--color-accent-strong)] text-black rounded-md"
              >
                {loadingAI ? loadingMessage : "Generate Guide"}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-[var(--color-line)] text-[var(--color-text-strong)] rounded-md"
              >
                Reset
              </button>
            </div>

            {/* AI Analysis final verdict */}
            <div className="p-3 bg-[var(--color-surface-muted)] rounded-md mt-2">
              <h4 className="text-sm font-display text-[var(--color-text-strong)]">
                AI Analysis
              </h4>
              <div className="mt-3 text-sm text-[var(--color-text)] max-h-96 overflow-auto">
                {loadingAI ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" /> {loadingMessage}
                  </div>
                ) : analysis ? (
                  <div className="prose prose-sm max-w-none leading-relaxed dark:prose-invert">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-[var(--color-text-muted)]">
                    No analysis yet. Use Generate Guide to produce the report.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentor;
