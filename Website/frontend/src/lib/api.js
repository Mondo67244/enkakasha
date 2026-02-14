
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
    // FlareSolverr can take time, set a long timeout (e.g. 60s)
    const response = await api.post(`/scan/${uid}`, {}, { timeout: 90000 });
    return response.data;
};

// Call backend API which uses cloudscraper to bypass Cloudflare
export const getLeaderboard = async (calcId) => {
    const response = await api.get(`/leaderboard/${calcId}`);
    console.debug('API getLeaderboard response:', response?.data);
    return response.data;
};

export const getLeaderboardDeep = async (calcId, character, limit = 20) => {
    const response = await api.get(`/leaderboard/deep/${calcId}`, {
        params: { character, limit },
    });
    console.debug('API getLeaderboardDeep response:', response?.data);
    return response.data;
};

export const analyzeBuild = async (apiKey, userData, contextData, targetChar, modelName, buildNotes, provider = 'ollama') => {
    // Local AI (Mistral) can take several minutes on CPU - set 10 min timeout
    const response = await api.post('/analyze', {
        api_key: apiKey,
        user_data: userData,
        context_data: contextData,
        target_char: targetChar,
        model_name: modelName,
        build_notes: buildNotes,
        provider: provider
    }, { timeout: 600000 });
    return response.data;
};

export const chatBuild = async (apiKey, userData, contextData, targetChar, modelName, message, history, provider = 'ollama') => {
    // Local AI (Mistral) can take several minutes on CPU - set 10 min timeout
    const response = await api.post('/chat', {
        api_key: apiKey,
        user_data: userData,
        context_data: contextData,
        target_char: targetChar,
        model_name: modelName,
        message,
        history,
        provider: provider
    }, { timeout: 600000 });
    return response.data;
};

export const getOllamaStatus = async () => {
    const response = await api.get('/ollama/status');
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
