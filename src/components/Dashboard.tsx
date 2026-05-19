import { BarChart3, TrendingUp, Users, Zap, Bell, CheckCircle2, AlertTriangle, Clock, Cloud, Truck, Droplets, Wind, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { translations, Language } from '../lib/i18n';
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function Dashboard({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({
    projects: 0,
    inventory: 0,
    labor: 0,
    efficiency: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Sync Projects count for current user
    const qProjects = query(
      collection(db, 'projects'),
      where('ownerId', '==', auth.currentUser.uid)
    );
    
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      setStats(prev => ({ ...prev, projects: snap.size }));
    }, (error) => {
      console.error("Projects snapshot error:", error);
    });

    // For inventory, since it's nested under projects, we listen to the 'DEFAULT' node if it exists
    // In a real app, this would be a collectionGroup query or aggregated on the project doc
    const unsubInventory = onSnapshot(collection(db, 'projects', 'DEFAULT', 'inventory'), (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (Number(doc.data().quantity) || 0), 0);
      setStats(prev => ({ ...prev, inventory: total }));
    }, (error) => {
      // Silently fail if DEFAULT doesn't exist yet
      console.warn("Inventory snapshot error (likely DEFAULT project missing):", error);
    });

    return () => {
      unsubProjects();
      unsubInventory();
    };
  }, []);

  return (
    <div className="space-y-12 pb-20 relative">
      <div className="scanline" />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-10 gap-6 relative px-2">
        <div className="absolute top-0 left-0 w-24 h-1 caution-tape opacity-30" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-serif italic text-5xl sm:text-6xl md:text-8xl tracking-tight gradient-text leading-[0.9]">{t.overview}</h2>
            <div className="hidden sm:block h-12 w-12 border-2 border-brand-accent/20 rounded-full flex items-center justify-center font-black text-brand-accent text-[8px] animate-pulse">
              SAFE_OP
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.5em] opacity-40 font-black">System Core // Active Sync // SECURE_NODE_0x12</p>
            <div className="h-px flex-1 bg-white/5 hidden md:block"></div>
            <div className="font-mono text-xs text-brand-accent font-black tracking-widest tabular-nums bg-brand-accent/5 px-4 py-1 rounded-full border border-brand-accent/10">
              {time.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 p-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl [.light-mode_&]:bg-blue-50 [.light-mode_&]:border-blue-100">
          <div className="flex items-center gap-3 px-6 py-3 bg-brand-accent rounded-xl shadow-lg group">
            <Zap size={14} className="text-black animate-pulse group-hover:scale-125 transition-transform" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-black font-black">INDUSTRIAL_NETWORK_ONLINE</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 transition-all">
        <MetricCard label="Site Temperature" value="00.0" unit="°C" icon={<Cloud />} color="bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
        <MetricCard label="Site Inventory" value={stats.inventory > 0 ? String(stats.inventory) : "0000"} unit="Units" icon={<Truck />} color="bg-brand-accent shadow-[0_0_20px_rgba(255,214,10,0.2)]" />
        <MetricCard label="Total Staffing" value={stats.labor > 0 ? String(stats.labor) : "00"} unit="Active" icon={<Users />} color="bg-brand-success shadow-[0_0_20px_rgba(0,245,212,0.2)]" />
        <MetricCard label="System Integrity" value="100" unit="%" icon={<Zap />} color="bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-[3rem] border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,214,10,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,214,10,0.01)_1px,transparent_1px)] bg-[length:20px_20px]" />
          <div className="flex justify-between items-center relative z-10">
            <h4 className="font-serif italic text-3xl text-white">Project Telemetry</h4>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-mono text-[10px] text-white transition-colors border border-white/5">Daily</button>
              <button className="px-4 py-2 bg-brand-accent text-black rounded-xl font-mono text-[10px] shadow-lg shadow-brand-accent/20 transition-all font-black">Weekly</button>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2 relative z-10">
            {[0, 0, 0, 0, 0, 0, 0].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full relative h-full flex items-end">
                   <motion.div 
                     initial={{ height: 0 }}
                     animate={{ height: `${h || 10}%` }}
                     className="w-full bg-gradient-to-t from-brand-accent/5 to-brand-accent/40 rounded-t-xl group-hover:from-brand-accent group-hover:to-brand-accent transition-all relative overflow-hidden border-t-2 border-brand-accent"
                   >
                     <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,214,10,0.2)_50%,transparent_75%)] bg-[length:250%_100%] animate-scan" style={{ animationDuration: '2s' }} />
                   </motion.div>
                </div>
                <span className="font-mono text-[8px] opacity-30 uppercase font-black group-hover:opacity-100 transition-opacity">CH_{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel p-8 rounded-[3rem] border-white/5 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-info/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            <h5 className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2 relative z-10">
               <span className="w-1.5 h-1.5 bg-brand-info rounded-full animate-pulse"></span> Environment_Sensors
            </h5>
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 transition-all hover:border-brand-info/40">
                <div className="flex gap-3 items-center text-white/60">
                   <Droplets size={16} className="text-brand-info" />
                   <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">Humidity</span>
                </div>
                <span className="font-mono text-sm text-white font-bold tracking-widest">--%</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 transition-all hover:border-emerald-500/40">
                <div className="flex gap-3 items-center text-white/60">
                   <Wind size={16} className="text-emerald-500" />
                   <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">Air Quality</span>
                </div>
                <span className="font-mono text-sm text-emerald-500 font-bold tracking-widest">--</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[3rem] border-brand-accent/20 border bg-brand-accent/[0.03] group hover:bg-brand-accent/[0.05] transition-all">
            <h5 className="font-mono text-[10px] uppercase tracking-widest text-brand-accent mb-4 flex items-center gap-2">
               <TrendingUp size={12} /> Active_Deployment
            </h5>
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="font-serif italic text-2xl text-white">Central Station Hub</p>
                    <p className="font-mono text-[9px] opacity-40 uppercase tracking-widest">Phase_01 // SECURE_COMM</p>
                  </div>
                  <Link to="/project-board" className="p-3 bg-brand-accent text-black rounded-xl hover:scale-110 transition-all shadow-lg shadow-brand-accent/20">
                    <ChevronRight size={18} />
                  </Link>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className="h-full bg-brand-accent"
                  />
               </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[3rem] border-brand-accent/20 border bg-brand-accent/[0.01]">
            <h5 className="font-mono text-[10px] uppercase tracking-widest text-brand-accent mb-4 flex items-center gap-2">
               <AlertTriangle size={12} /> Priority_Alerts
            </h5>
            <div className="space-y-4">
              <p className="font-mono text-[9px] opacity-20 uppercase tracking-widest px-4">System Nominal. Watchdog Active.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <h3 className="font-mono text-xs uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping"></span>
              {t.priorityAlerts}
            </h3>
            <Bell size={16} className="opacity-20 translate-y-[-2px]" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <p className="font-mono text-[10px] opacity-20 text-center py-10 uppercase tracking-widest">No priority notifications</p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <h3 className="font-mono text-xs uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full"></span>
              {t.recentProgress}
            </h3>
            <BarChart3 size={16} className="opacity-20 translate-y-[-2px]" />
          </div>
          <div className="space-y-2 rounded-2xl overflow-hidden">
            <p className="font-mono text-[10px] opacity-20 text-center py-10 uppercase tracking-widest">Data stream idle</p>
          </div>
        </section>
      </div>

      <section className="pt-16 pb-20 relative">
         <div className="absolute top-0 right-0 w-48 h-px bg-gradient-to-l from-brand-accent/40 to-transparent" />
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative">
            <div className="space-y-4">
               <h3 className="font-serif italic text-6xl tracking-tight gradient-text">{t.inspection}</h3>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-accent rounded-full animate-ping"></div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40 font-black">Live Verification Ledger: SITE_AUDIT_X09</p>
               </div>
            </div>
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-8 shadow-2xl backdrop-blur-md transition-all hover:border-brand-accent/20">
               <div className="px-6 py-4 text-right">
                  <p className="font-mono text-[8px] uppercase opacity-40 font-black mb-1 tracking-widest text-brand-accent">Safety_Score</p>
                  <p className="font-mono text-2xl font-black text-white tracking-tighter">--%</p>
               </div>
               <div className="w-px h-12 bg-white/10"></div>
               <div className="pr-6">
                 <div className="h-12 w-12 rounded-xl border-2 border-white/5 flex items-center justify-center font-mono text-[10px] font-black text-white/20 bg-black/40">
                   N/A
                 </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <p className="col-span-full font-mono text-[10px] opacity-10 text-center py-20 uppercase tracking-[1em] font-black italic">No operational data streams</p>
         </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, unit, icon, color }: { label: string, value: string, unit: string, icon: ReactNode, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="p-8 bg-slate-900/50 backdrop-blur-xl border border-white/5 flex flex-col justify-between h-56 group hover:border-brand-accent transition-all relative overflow-hidden shadow-2xl rounded-[2.5rem]
        [.light-mode_&]:bg-white [.light-mode_&]:border-blue-100 [.light-mode_&]:shadow-blue-900/5"
    >
      <div className={`absolute -top-4 -right-4 p-8 opacity-5 scale-[2.5] group-hover:opacity-10 transition-all duration-700 text-brand-accent`}>
        {icon}
      </div>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent group-hover:via-brand-accent transition-all`}></div>
      <div className="absolute bottom-0 right-0 w-12 h-1 caution-tape opacity-0 group-hover:opacity-10 transition-all" />
      <div className={`${color} w-3 h-16 absolute left-0 top-1/2 -translate-y-1/2 group-hover:h-full group-hover:top-0 group-hover:translate-y-0 transition-all duration-500 rounded-r-2xl`}></div>
      
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 group-hover:text-brand-accent font-black ml-4 transition-all [.light-mode_&]:text-blue-600/60">{label}</p>
      
      <div className="space-y-1 ml-4">
        <div className="font-mono text-5xl sm:text-6xl md:text-7xl tracking-tighter group-hover:text-brand-accent font-black flex flex-wrap items-baseline gap-2 tabular-nums transition-all text-white led-glow [.light-mode_&]:text-blue-600">
          {value}
          <span className="text-brand-accent text-sm sm:text-base font-serif italic [.light-mode_&]:text-blue-400">{unit}</span>
        </div>
      </div>
      
      <div className="ml-4 pt-4 flex items-center gap-2">
        <div className="h-1 w-12 bg-white/5 group-hover:bg-brand-accent/20 transition-colors rounded-full overflow-hidden">
          <div className={`h-full ${color} w-2/3`}></div>
        </div>
        <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest font-black [.light-mode_&]:text-blue-400">DATA_READY</span>
      </div>
    </motion.div>
  );
}

function AlertItem({ type, message, time, icon }: { type: 'critical' | 'warning' | 'info', message: string, time: string, icon: ReactNode }) {
  const styles = {
    critical: 'border-red-500/20 bg-red-500/5 text-red-400 hover:border-red-500 hover:bg-red-500/10',
    warning: 'border-brand-accent/20 bg-brand-accent/5 text-brand-accent hover:border-brand-accent hover:bg-brand-accent/10',
    info: 'border-brand-info/20 bg-brand-info/5 text-brand-info hover:border-brand-info hover:bg-brand-info/10'
  };
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className={`flex gap-5 items-center cursor-pointer p-6 border transition-all shadow-xl rounded-2xl ${styles[type]}`}
    >
      <div className="shrink-0 p-3 bg-slate-900 rounded-xl shadow-inner border border-white/5">{icon}</div>
      <div className="flex-1 font-mono text-xs uppercase tracking-wide font-black">{message}</div>
      <div className="font-mono text-[10px] opacity-40 font-bold">{time}</div>
    </motion.div>
  );
}

function CheckItem({ label, checked = false, date }: { label: string; checked?: boolean; date: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl group transition-all hover:border-brand-accent/30 shadow-2xl backdrop-blur-md [.light-mode_&]:bg-white [.light-mode_&]:border-sky-500/10"
    >
       <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${checked ? 'bg-brand-accent text-white' : 'bg-white/5 text-slate-500'} transition-colors duration-500`}>
             {checked ? <CheckCircle2 size={24} /> : <Clock size={24} />}
          </div>
          <span className="font-mono text-[9px] opacity-30 group-hover:opacity-100 group-hover:text-brand-accent font-black transition-all">{date}</span>
       </div>
       <p className="font-mono text-xs uppercase tracking-widest font-black text-slate-400 group-hover:text-brand-accent transition-colors [.light-mode_&]:text-slate-900">{label}</p>
       <div className="mt-6 flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-all">
          {[...Array(5)].map((_, i) => (
             <div key={i} className={`h-1 w-full rounded-full ${i < (checked ? 5 : 2) ? 'bg-brand-accent' : 'bg-white/10'}`}></div>
          ))}
       </div>
    </motion.div>
  );
}

function ProgressItem({ site, text, val, type }: { site: string, text: string, val: string, type: 'success' | 'accent' }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="data-row p-6 flex justify-between items-center group shadow-2xl mb-3 rounded-2xl border border-white/5 bg-slate-900/30 hover:border-brand-accent/50 transition-all [.light-mode_&]:bg-white/40 [.light-mode_&]:border-sky-500/10"
    >
      <div className="flex flex-col">
        <span className="font-mono text-[9px] opacity-40 uppercase group-hover:text-brand-accent font-black tracking-widest transition-colors">{site}</span>
        <span className="text-sm font-black group-hover:translate-x-1 transition-transform text-slate-200 [.light-mode_&]:text-slate-900">{text}</span>
      </div>
      <span className={`font-mono text-xs font-black px-4 py-2 rounded-xl bg-slate-950 text-white group-hover:bg-brand-accent group-hover:text-black transition-all shadow-lg [.light-mode_&]:bg-blue-500 ${type === 'success' ? 'text-brand-success' : 'text-brand-accent [.light-mode_&]:text-white'}`}>
        {val}
      </span>
    </motion.div>
  );
}
