import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, AlertTriangle, ShieldCheck, Activity, Clock } from 'lucide-react';

const OdourDashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [pieData, setPieData] = useState([]); // State for the Donut chart
  const [latest, setLatest] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://smart-waste-io-t-w6cn.vercel.app/api/data');
        const data = await response.json();
        
        if (data && data.length > 0) {
          // 1. Line Chart Data (Exactly as you had it)
          const formatted = data.map((item, index) => ({
            name: `Read ${index + 1}`,
            riskScore: item.analytics?.risk_score || 0,
            rawGas: item.readings?.raw_gas || 0,
            temp: item.readings?.temperature_c || 0,
            humidity: item.readings?.humidity_percent || 0
          }));

          // 2. Donut Chart Logic (Calculating distribution of last 30 readings)
          const last30 = data.slice(-30);
          const dist = [
            { name: 'Low Risk', value: last30.filter(r => (r.analytics?.risk_score || 0) <= 40).length, color: '#22c55e' },
            { name: 'Moderate', value: last30.filter(r => (r.analytics?.risk_score || 0) > 40 && (r.analytics?.risk_score || 0) <= 70).length, color: '#f59e0b' },
            { name: 'High Risk', value: last30.filter(r => (r.analytics?.risk_score || 0) > 70).length, color: '#ef4444' },
          ];

          setLatest(data[data.length - 1]);
          setSensorData(formatted.slice(-30)); 
          setPieData(dist.filter(d => d.value > 0)); // Only show sectors with data
        }
      } catch (err) { 
        console.error("Database connection failed", err); 
      }
    };
    
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setCurrentTime(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!latest) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#eaf3f2] text-blue-600">
      <div className="animate-pulse flex flex-col items-center">
        <Activity size={64} className="mb-4" />
        <h2 className="text-2xl font-light tracking-[0.3em]">CONNECTING TO EDGE AI</h2>
      </div>
    </div>
  );

  const isHighRisk = latest.analytics.risk_score > 60;

  return (
    <div className="min-h-screen w-full bg-[#eaf3f2] text-slate-800 p-4 font-sans selection:bg-blue-500/20 overflow-hidden">
      
      {/* TOP NAVIGATION BAR */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mb-6 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.18)]">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">WasteGuard <span className="text-blue-600">Node-01</span></h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Central Monitoring Console</p>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={16} />
            <span className="text-sm font-mono">{currentTime}</span>
          </div>
          <div className={`px-4 py-1 rounded-md text-[11px] font-black border uppercase tracking-tighter ${isHighRisk ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'}`}>
            {isHighRisk ? '⚠️ Critical Anomaly Detected' : '✅ Environmental Stable'}
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl relative overflow-hidden group hover:border-orange-300 transition-all shadow-sm">
          <Thermometer className="absolute -right-4 -bottom-4 text-orange-500/10 group-hover:text-orange-500/20 transition-all" size={120} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Temperature</p>
          <h2 className="text-5xl font-black text-slate-900">{latest.readings.temperature_c}<span className="text-2xl text-orange-500">°C</span></h2>
          <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full" style={{width: `${(latest.readings.temperature_c/50)*100}%`}}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl relative overflow-hidden group hover:border-cyan-300 transition-all shadow-sm">
          <Droplets className="absolute -right-4 -bottom-4 text-cyan-500/10 group-hover:text-cyan-500/20 transition-all" size={120} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Humidity</p>
          <h2 className="text-5xl font-black text-slate-900">{latest.readings.humidity_percent}<span className="text-2xl text-cyan-500">%</span></h2>
          <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full" style={{width: `${latest.readings.humidity_percent}%`}}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl relative overflow-hidden group hover:border-purple-300 transition-all shadow-sm">
          <Wind className="absolute -right-4 -bottom-4 text-purple-500/10 group-hover:text-purple-500/20 transition-all" size={120} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Raw Gas (PPM)</p>
          <h2 className="text-5xl font-black text-slate-900">{latest.readings.raw_gas}</h2>
          <p className="text-[10px] text-purple-500 mt-1 font-bold">MQ135 SENSOR FEED</p>
        </div>

        <div className={`p-6 rounded-3xl relative overflow-hidden transition-all border-2 shadow-lg ${isHighRisk ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <AlertTriangle className={`absolute -right-4 -bottom-4 ${isHighRisk ? 'text-red-500/20' : 'text-blue-500/20'}`} size={120} />
          <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70 text-slate-700">TinyML Risk Index</p>
          <h2 className="text-6xl font-black text-slate-900">{latest.analytics.risk_score}<span className="text-2xl opacity-50">/100</span></h2>
          <div className="mt-3 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full animate-ping ${isHighRisk ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <span className={`text-[11px] font-black uppercase ${isHighRisk ? 'text-red-500' : 'text-blue-500'}`}>{latest.analytics.risk_status} PHASE</span>
          </div>
        </div>
      </div>

      {/* TREND ANALYTICS & DISTRIBUTION SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 grow">
        
        {/* LINE CHART (2/3 Width) */}
        <div className="xl:col-span-2 bg-white border border-slate-200 p-8 rounded-4xl backdrop-blur-sm shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold flex items-center gap-3 text-slate-900 uppercase tracking-wider">
              <Activity size={20} className="text-blue-600" /> Real-Time Intelligence Stream
            </h3>
            <div className="flex gap-4 text-[9px] font-bold">
              <div className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> RISK</div>
              <div className="flex items-center gap-1 text-purple-600"><span className="w-2 h-2 rounded-full bg-purple-500"></span> GAS</div>
              <div className="flex items-center gap-1 text-cyan-600"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> HUM</div>
              <div className="flex items-center gap-1 text-orange-600"><span className="w-2 h-2 rounded-full bg-orange-400"></span> TEMP</div>
            </div>
          </div>
          
          <div className="h-112.5 min-h-100 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sensorData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={1} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }} itemStyle={{ fontSize: '11px', color: '#0f172a' }} />
                <Area type="monotone" dataKey="riskScore" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="temp" stroke="#fb923c" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="rawGas" stroke="#a855f7" strokeWidth={1} dot={false} strokeDasharray="1 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-1 bg-white border border-slate-200 p-8 rounded-4xl backdrop-blur-sm shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-8">Risk Stability Analysis</h3>
          <div className="grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Donut Legend */}
          <div className="mt-6 space-y-3">
             {pieData.map((item, i) => (
               <div key={i} className="flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} />
                    <span className="text-xs font-bold text-slate-700 uppercase">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{( (item.value / 30) * 100 ).toFixed(0)}%</span>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OdourDashboard;