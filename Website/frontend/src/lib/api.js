
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

export const getLeaderboard = async (calcId) => {
    const response = await api.get(`/leaderboard/${calcId}`);
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
