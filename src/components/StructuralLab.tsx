import { useState } from 'react';
import { PencilRuler, Info, Download, Trash2, Plus, Box, Zap, Scale } from 'lucide-react';
import { motion } from 'motion/react';
import { translations, Language } from '../lib/i18n';

interface Load {
  id: string;
  type: 'point' | 'distributed';
  value: number;
  position: number;
}

export default function StructuralLab({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [span, setSpan] = useState<number>(5);
  const [loads, setLoads] = useState<Load[]>([]);
  const [newLoad, setNewLoad] = useState<Omit<Load, 'id'>>({ type: 'point', value: 10, position: 2.5 });

  const addLoad = () => {
    setLoads([...loads, { ...newLoad, id: Date.now().toString() }]);
  };

  const removeLoad = (id: string) => {
    setLoads(loads.filter(l => l.id !== id));
  };

  // Simplified Calculation (Maximum Moment for Point Load at Center)
  const maxBendingMoment = () => {
    if (loads.length === 0) return 0;
    // For demo, we just sum up some simplified logic
    return loads.reduce((acc, l) => {
      if (l.type === 'point') {
        const a = l.position;
        const b = span - a;
        return acc + (l.value * a * b) / span;
      } else {
        return acc + (l.value * Math.pow(span, 2)) / 8;
      }
    }, 0);
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-6">
        <div className="space-y-4">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tight gradient-text leading-tight">{t.structuralLab}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">Load Analysis // Beam Mechanics // Structural Analysis v1.0</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-8 rounded-[2rem] space-y-6 border-white/5">
            <h3 className="font-mono text-xs uppercase tracking-widest font-black text-brand-accent flex items-center gap-2">
               <Box size={16} /> {t.beamDesign}
            </h3>
            
            <div className="space-y-4">
              <label className="block font-mono text-[10px] uppercase tracking-widest opacity-40">Beam Span (meters)</label>
              <input 
                type="number" 
                value={span}
                onChange={(e) => setSpan(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl font-mono text-xl text-white focus:border-brand-accent outline-none"
              />
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
               <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-60">Add Loading</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono uppercase opacity-30">Type</label>
                    <select 
                      value={newLoad.type}
                      onChange={(e) => setNewLoad({...newLoad, type: e.target.value as any})}
                      className="w-full bg-slate-900 p-3 rounded-lg border border-white/5 text-xs text-white"
                    >
                      <option value="point">Point Load (kN)</option>
                      <option value="distributed">UDL (kN/m)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono uppercase opacity-30">Value</label>
                    <input 
                      type="number"
                      value={newLoad.value}
                      onChange={(e) => setNewLoad({...newLoad, value: parseFloat(e.target.value)})}
                      className="w-full bg-slate-900 p-3 rounded-lg border border-white/5 text-xs text-white"
                    />
                  </div>
               </div>
               <button 
                 onClick={addLoad}
                 className="w-full py-4 bg-white/5 hover:bg-brand-accent transition-all rounded-xl font-mono text-[10px] uppercase tracking-widest font-black border border-white/10 hover:text-white"
               >
                 Add Load Case
               </button>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2rem] space-y-4 border-white/5">
             <h3 className="font-mono text-xs uppercase tracking-widest font-black text-brand-accent flex items-center gap-2">
               <Scale size={16} /> Current Loads
             </h3>
             <div className="space-y-3">
               {loads.map(load => (
                 <div key={load.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5">
                    <div>
                      <div className="text-[10px] font-mono uppercase font-black">{load.type}</div>
                      <div className="text-xs text-brand-accent opacity-80">{load.value} kN @ {load.position}m</div>
                    </div>
                    <button onClick={() => removeLoad(load.id)} className="text-red-500/40 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                 </div>
               ))}
               {loads.length === 0 && <p className="text-[10px] font-mono uppercase opacity-20 text-center py-4 italic">No loads applied</p>}
             </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-panel p-12 rounded-[3rem] relative overflow-hidden h-full flex flex-col justify-between border-white/5">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-[5] text-brand-accent pointer-events-none">
                <PencilRuler size={100} />
              </div>

              <div className="space-y-12">
                 <div className="flex justify-between items-start">
                   <div className="space-y-2">
                      <h3 className="text-4xl font-serif italic gradient-text">Analysis Report</h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-brand-accent animate-pulse">
                        <Zap size={12} /> Live Matrix Calculation
                      </div>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-brand-accent">
                     <Info size={24} />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-slate-950 border border-white/10 rounded-[2.5rem] space-y-2">
                       <p className="font-mono text-[9px] uppercase tracking-widest opacity-40">Max Bending Moment</p>
                       <p className="text-5xl font-mono font-black text-white">{maxBendingMoment().toFixed(2)}</p>
                       <p className="font-serif italic text-brand-accent">kNm (kN-meters)</p>
                    </div>
                    <div className="p-8 bg-slate-950 border border-white/10 rounded-[2.5rem] space-y-2">
                       <p className="font-mono text-[9px] uppercase tracking-widest opacity-40">Suggested Area of Steel</p>
                       <p className="text-5xl font-mono font-black text-white">{(maxBendingMoment() * 12.5).toFixed(0)}</p>
                       <p className="font-serif italic text-brand-accent">mm² (Estimated)</p>
                    </div>
                 </div>

                 {/* Visualization Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-2">
                         <Zap size={14} className="text-brand-accent" /> {t.sfd}
                       </h4>
                       <div className="h-40 bg-slate-950/80 rounded-[2rem] border border-white/5 relative overflow-hidden p-6 flex flex-col justify-center">
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10"></div>
                          {/* Mock SFD Path */}
                          <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                            <path 
                              d={`M 0 50 L ${loads.length > 0 ? (loads[0].position/span)*400 : 200} 20 L ${loads.length > 0 ? (loads[0].position/span)*400 : 200} 80 L 400 50`} 
                              fill="none" 
                              stroke="#38bdf8" 
                              strokeWidth="2" 
                              className="opacity-60"
                            />
                            <path 
                              d={`M 0 50 L ${loads.length > 0 ? (loads[0].position/span)*400 : 200} 20 L ${loads.length > 0 ? (loads[0].position/span)*400 : 200} 50 Z`} 
                              fill="#38bdf8" 
                              className="opacity-10"
                            />
                            <path 
                              d={`M ${loads.length > 0 ? (loads[0].position/span)*400 : 200} 50 L ${loads.length > 0 ? (loads[0].position/span)*400 : 200} 80 L 400 80 Z`} 
                              fill="#38bdf8" 
                              className="opacity-10"
                            />
                          </svg>
                          <div className="absolute bottom-4 left-6 font-mono text-[8px] opacity-30">V_MAX: {(maxBendingMoment() / 2).toFixed(1)} kN</div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-2">
                         <Box size={14} className="text-brand-accent" /> {t.bmd}
                       </h4>
                       <div className="h-40 bg-slate-950/80 rounded-[2rem] border border-white/5 relative overflow-hidden p-6 flex flex-col justify-center">
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10"></div>
                          {/* Mock BMD Path (Parabolic or Triangular) */}
                          <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                            <path 
                              d={`M 0 50 Q ${loads.length > 0 ? (loads[0].position/span)*400 : 200} ${50 + (maxBendingMoment() > 0 ? 40 : 0)} 400 50`} 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="3"
                              className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            />
                            <path 
                              d={`M 0 50 Q ${loads.length > 0 ? (loads[0].position/span)*400 : 200} ${50 + (maxBendingMoment() > 0 ? 40 : 0)} 400 50 Z`} 
                              fill="#10b981" 
                              className="opacity-10"
                            />
                          </svg>
                          <div className="absolute bottom-4 left-6 font-mono text-[8px] opacity-30">M_MAX: {maxBendingMoment().toFixed(1)} kNm</div>
                       </div>
                    </div>
                 </div>

                 {/* Visualization Mockup */}
                 <div className="relative h-32 bg-slate-950/50 rounded-2xl border border-white/5 flex items-center justify-center p-8">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-0 h-4 w-1 bg-brand-accent -translate-y-1/2"></div>
                    <div className="absolute top-1/2 right-0 h-4 w-1 bg-brand-accent -translate-y-1/2"></div>
                    <div className="w-full h-full flex justify-around items-start">
                      {loads.map(load => (
                        <div key={load.id} className="relative flex flex-col items-center">
                          <div className="h-12 w-px bg-brand-accent"></div>
                          <div className="text-[8px] font-mono text-brand-accent mt-1">{load.value}kN</div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[8px] opacity-20 uppercase tracking-[0.5em]">Span: {span}m</div>
                 </div>
              </div>

              <div className="flex gap-4 pt-12">
                 <button className="flex-1 py-5 bg-slate-900 border border-white/10 rounded-2xl font-mono text-[10px] uppercase tracking-widest font-black hover:bg-white/5 transition-all flex items-center justify-center gap-3">
                    <Download size={16} /> Download CSV
                 </button>
                 <button className="flex-1 py-5 bg-brand-accent text-white rounded-2xl font-mono text-[10px] uppercase tracking-widest font-black shadow-xl shadow-brand-accent/20 flex items-center justify-center gap-3">
                    Generate FEA Mesh
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
