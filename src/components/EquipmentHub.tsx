import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Truck, Settings, AlertOctagon, CheckCircle2, MapPin, User, Plus, Loader2, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Maintenance' | 'Idle' | 'Offline';
  operator: string;
  lastService: any;
  healthScore: number;
  location: string;
}

export default function EquipmentHub() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Heavy Machinery',
    operator: '',
    location: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'equipment'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEquipment(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Equipment)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'equipment'), {
        ...formData,
        status: 'Idle',
        healthScore: 100,
        lastService: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setShowAdd(false);
      setFormData({ name: '', type: 'Heavy Machinery', operator: '', location: '' });
    } catch (error) {
      console.error("Failed to add equipment:", error);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'equipment', id), { status: newStatus });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Maintenance': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Idle': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-6">
        <div className="space-y-4">
          <h2 className="font-serif italic text-7xl text-white gradient-text leading-tight">Asset Engine</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] opacity-30">Machinery Deployment // Telemetry Sync // Fleet Status</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-brand-accent text-white px-8 py-4 rounded-2xl font-mono text-xs uppercase tracking-widest font-black shadow-lg shadow-brand-accent/20 hover:-translate-y-1 transition-all flex items-center gap-3"
        >
          <Plus size={18} />
          Deploy_New_Asset
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel p-12 rounded-[3.5rem] border-brand-accent/20 border"
          >
            <form onSubmit={addEquipment} className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Asset Name</label>
                 <input 
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 font-mono text-xs text-white outline-none focus:border-brand-accent"
                   placeholder="e.g. Caterpillar 320D"
                 />
               </div>
               <div className="space-y-2">
                 <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Machine Category</label>
                 <select 
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value})}
                   className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 font-mono text-xs text-white outline-none focus:border-brand-accent"
                 >
                   <option>Heavy Machinery</option>
                   <option>Logistics</option>
                   <option>Survey Tools</option>
                   <option>Power Systems</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Designated Operator</label>
                 <input 
                   required
                   value={formData.operator}
                   onChange={e => setFormData({...formData, operator: e.target.value})}
                   className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 font-mono text-xs text-white outline-none focus:border-brand-accent"
                   placeholder="Operator ID / Name"
                 />
               </div>
               <div className="space-y-2">
                 <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Initial Site Location</label>
                 <input 
                   required
                   value={formData.location}
                   onChange={e => setFormData({...formData, location: e.target.value})}
                   className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 font-mono text-xs text-white outline-none focus:border-brand-accent"
                   placeholder="Sector-A, Main Yard, etc."
                 />
               </div>
               <div className="md:col-span-2 flex gap-4 pt-4">
                 <button type="submit" className="flex-1 bg-brand-accent text-white py-5 rounded-2xl font-mono text-xs uppercase tracking-[0.2em] font-black">Finalize_Deployment</button>
                 <button type="button" onClick={() => setShowAdd(false)} className="px-10 border border-white/10 rounded-2xl font-mono text-xs uppercase tracking-widest text-slate-500 hover:text-white">Abort</button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-brand-accent" size={40} />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-30 text-white">Linking Data Stream...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {equipment.map((asset) => (
            <motion.div 
              layout
              key={asset.id}
              className="glass-panel p-8 rounded-[2.5rem] border-white/5 hover:border-brand-accent/20 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <Truck size={120} />
              </div>

              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-brand-accent/10 rounded-2xl border border-brand-accent/20 text-brand-accent">
                  <Truck size={24} />
                </div>
                <div className={`px-4 py-2 rounded-full border font-mono text-[8px] uppercase tracking-widest font-black ${getStatusColor(asset.status)}`}>
                  {asset.status}
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <h4 className="text-2xl font-black text-white tracking-tight leading-tight">{asset.name}</h4>
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">{asset.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-2 mb-2">
                     <MapPin size={10} className="text-brand-accent" />
                     <span className="font-mono text-[8px] uppercase tracking-widest opacity-40">Station</span>
                   </div>
                   <p className="font-mono text-[10px] text-white truncate font-bold">{asset.location}</p>
                 </div>
                 <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={10} className="text-brand-accent" />
                      <span className="font-mono text-[8px] uppercase tracking-widest opacity-40">Operator</span>
                    </div>
                    <p className="font-mono text-[10px] text-white truncate font-bold">{asset.operator}</p>
                 </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                 <div className="flex justify-between items-center px-1">
                   <div className="flex items-center gap-2">
                     <Gauge size={12} className={asset.healthScore > 70 ? 'text-emerald-500' : 'text-amber-500'} />
                     <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">Health_Index</span>
                   </div>
                   <span className="font-mono text-[10px] font-black text-white">{asset.healthScore}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${asset.healthScore}%` }}
                      className={`h-full ${asset.healthScore > 70 ? 'bg-emerald-500' : asset.healthScore > 40 ? 'bg-amber-500' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}
                    />
                 </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => updateStatus(asset.id, 'Active')}
                  className="py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-mono text-[8px] uppercase font-black hover:bg-emerald-500 hover:text-white transition-all"
                >
                  ACTIVATE
                </button>
                <button 
                  onClick={() => updateStatus(asset.id, 'Maintenance')}
                  className="py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl font-mono text-[8px] uppercase font-black hover:bg-amber-500 hover:text-white transition-all"
                >
                  SERVICE
                </button>
                <button 
                  onClick={() => updateStatus(asset.id, 'Idle')}
                  className="py-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl font-mono text-[8px] uppercase font-black hover:bg-blue-500 hover:text-white transition-all"
                >
                  IDLE
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
