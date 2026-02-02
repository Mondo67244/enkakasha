
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Droplets, Flame, Zap, Wind, Mountain, Snowflake, Sprout } from 'lucide-react';

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
    const navigate = useNavigate();

    useEffect(() => {
        const stored = sessionStorage.getItem('user_data');
        if (!stored) {
            navigate('/home');
            return;
        }
        setData(JSON.parse(stored));
    }, []);

    const handleSelect = (charName) => {
        navigate(`/mentor/${charName}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Your Showcase</h2>
                <button onClick={() => navigate('/home')} className="text-sm text-slate-400 hover:text-white">New Scan</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((char, idx) => {
                    const stats = char.stats;
                    const artCount = char.artifacts?.length || 0;
                    return (
                        <div
                            key={idx}
                            onClick={() => handleSelect(stats.Character)}
                            className="bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 p-6 rounded-2xl cursor-pointer transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">
                                    <ElementIcon element={stats.Element} />
                                </div>
                                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">Lv.{stats.Level}</span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{stats.Character}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                                <span>ATK {stats.ATK}</span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <span>CR {stats['Crit_Rate%']}%</span>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
                                <span className="text-xs text-slate-500">{artCount} Artifacts</span>
                                <span className="text-purple-400 text-sm font-medium group-hover:underline">Optimize &rarr;</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default Dashboard;
