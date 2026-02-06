
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

export const verifyKey = async (apiKey) => {
    const response = await api.post('/verify_key', { api_key: apiKey });
    return response.data;
};

export const scanUID = async (uid) => {
    const response = await api.post(`/scan/${uid}`);
    return response.data;
};

// Direct call to Akasha API from browser (bypasses Cloudflare blocking VPS IPs)
export const getLeaderboard = async (calcId) => {
    const AKASHA_URL = 'https://akasha.cv/api/leaderboards';
    const limit = 20;
    
    // Try both API formats (Akasha changed their API structure)
    const paramSets = [
        { sort: 'Leaderboard.result', order: '-1', size: limit, LeaderboardId: calcId },
        { sort: 'calculation.result', order: '-1', size: limit, calculationId: calcId }
    ];
    
    for (const params of paramSets) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${AKASHA_URL}?${queryString}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) continue;
            
            const payload = await response.json();
            if (payload && payload.data && payload.data.length > 0) {
                // Transform data to match backend format
                return payload.data.map((entry, index) => {
                    const stats = entry.stats || {};
                    const calc = entry.Leaderboard || entry.calculation || entry.Calculation || {};
                    const weapon = entry.weapon || {};
                    const owner = entry.owner || {};
                    const weaponInfo = weapon.weaponInfo || {};
                    const refineObj = weaponInfo.refinementLevel || {};
                    
                    const getValue = (obj) => (obj && typeof obj === 'object' && 'value' in obj) ? obj.value : obj;
                    
                    // Find elemental bonus
                    let elementalBonus = null;
                    for (const key in stats) {
                        if (key.includes('DamageBonus') && key !== 'physicalDamageBonus') {
                            elementalBonus = Math.round(getValue(stats[key]) * 10000) / 100;
                            break;
                        }
                    }
                    
                    return {
                        Rank: entry.index || index + 1,
                        Player: owner.nickname,
                        UID: entry.uid,
                        Region: owner.region,
                        Weapon: weapon.name,
                        Refine: refineObj ? getValue(refineObj) + 1 : null,
                        HP: Math.round(getValue(stats.maxHp || 0)),
                        ATK: Math.round(getValue(stats.atk || 0)),
                        DEF: Math.round(getValue(stats.def || 0)),
                        EM: Math.round(getValue(stats.elementalMastery || 0)),
                        ER: Math.round(getValue(stats.energyRecharge || 0) * 10000) / 100,
                        Crit_Rate: Math.round(getValue(stats.critRate || 0) * 10000) / 100,
                        Crit_DMG: Math.round(getValue(stats.critDamage || 0) * 10000) / 100,
                        Elem_Bonus: elementalBonus,
                        DMG_Result: Math.round(getValue(calc.result || 0))
                    };
                });
            }
        } catch (e) {
            console.warn('Akasha API attempt failed:', e);
            continue;
        }
    }
    
    throw new Error('Failed to fetch leaderboard from Akasha');
};

export const getLeaderboardDeep = async (calcId, character, limit = 20) => {
    const response = await api.get(`/leaderboard/deep/${calcId}`, {
        params: { character, limit },
    });
    return response.data;
};

export const analyzeBuild = async (apiKey, userData, contextData, targetChar, modelName, buildNotes) => {
    const response = await api.post('/analyze', {
        api_key: apiKey,
        user_data: userData,
        context_data: contextData,
        target_char: targetChar,
        model_name: modelName,
        build_notes: buildNotes
    });
    return response.data;
};

export const chatBuild = async (apiKey, userData, contextData, targetChar, modelName, message, history) => {
    const response = await api.post('/chat', {
        api_key: apiKey,
        user_data: userData,
        context_data: contextData,
        target_char: targetChar,
        model_name: modelName,
        message,
        history
    });
    return response.data;
};

// Data Management Functions
export const listDataFolders = async () => {
    const response = await api.get('/data/list');
    return response.data;
};

export const deleteDataFolder = async (folderName) => {
    const response = await api.delete(`/data/delete/${folderName}`);
    return response.data;
};

export const renameDataFolder = async (oldName, newName) => {
    const response = await api.post('/data/rename', { old_name: oldName, new_name: newName });
    return response.data;
};

export const clearDataFolders = async () => {
    const response = await api.delete('/data/clear');
    return response.data;
};

export default api;
