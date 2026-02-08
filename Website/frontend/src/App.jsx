
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

import Mentor from './pages/Mentor';
import DataManagement from './pages/DataManagement';
import Chat from './pages/Chat';

const RequireKey = ({ children }) => {
  const key = localStorage.getItem('gemini_key');
  const provider = localStorage.getItem('ai_provider');
  
  // Allow access if key exists OR if provider is set to local/ollama
  if (!key && provider !== 'ollama') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<RequireKey><Home /></RequireKey>} />
          <Route path="/dashboard" element={<RequireKey><Dashboard /></RequireKey>} />
          <Route path="/data" element={<RequireKey><DataManagement /></RequireKey>} />
          <Route path="/mentor/:charName" element={<RequireKey><Mentor /></RequireKey>} />
          <Route path="/chat" element={<RequireKey><Chat /></RequireKey>} />
          <Route path="/chat/:charName" element={<RequireKey><Chat /></RequireKey>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
