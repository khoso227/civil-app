import { useState } from 'react';
import { Calculator, ArrowRightLeft, Ruler, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { translations, Language } from '../lib/i18n';

type UnitType = 'length' | 'volume';

const CONVERSIONS = {
  length: {
    mm: 1,
    cm: 10,
    m: 1000,
    inch: 25.4,
    foot: 304.8,
    sut: 3.175, // 1/8 inch
  },
  volume: {
    ml: 1,
    l: 1000,
    m3: 1000000,
    cft: 28316.8, // Cubic feet
  }
};

export default function UnitCalculator({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [type, setType] = useState<UnitType>('length');
  const [value, setValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('inch');

  const convert = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    
    // @ts-ignore
    const baseValue = num * CONVERSIONS[type][fromUnit];
    // @ts-ignore
    const result = baseValue / CONVERSIONS[type][toUnit];
    
    return result.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  return (
    <div className="space-y-12">
      <header className="border-b border-brand-border pb-8">
        <h2 className="font-serif italic text-6xl text-brand-primary tracking-tighter gradient-text leading-tight">{t.calculator}</h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">Precision Engineering Utility // Site Measurement Sync</p>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-12 rounded-[3rem] space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-[4] text-brand-accent pointer-events-none">
            <Calculator size={100} />
          </div>

          {/* Type Toggle */}
          <div className="flex p-2 bg-slate-950/50 rounded-2xl w-fit mx-auto border border-white/5">
            <button 
              onClick={() => setType('length')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl transition-all font-mono text-[10px] uppercase tracking-widest font-black ${type === 'length' ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Ruler size={16} />
              {t.length}
            </button>
            <button 
              onClick={() => setType('volume')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl transition-all font-mono text-[10px] uppercase tracking-widest font-black ${type === 'volume' ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Database size={16} />
              {t.volume}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Input */}
            <div className="space-y-4">
              <label className="font-mono text-[10px] uppercase tracking-widest opacity-40 font-black ml-2">Initial Value</label>
              <div className="relative">
                <input 
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full p-8 bg-slate-900 border-2 border-white/5 rounded-3xl font-mono text-3xl font-black text-brand-accent outline-none focus:border-brand-accent transition-all shadow-inner"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                   <select 
                     value={fromUnit}
                     onChange={(e) => setFromUnit(e.target.value)}
                     className="bg-slate-800 text-white font-mono text-xs p-3 rounded-xl border border-white/10 outline-none uppercase font-bold"
                   >
                     {Object.keys(CONVERSIONS[type]).map(u => (
                       <option key={u} value={u}>{u.toUpperCase()}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex justify-center text-brand-accent">
              <div className="p-4 bg-brand-accent/10 rounded-full">
                <ArrowRightLeft size={32} />
              </div>
            </div>

            {/* Result */}
            <div className="space-y-4">
              <label className="font-mono text-[10px] uppercase tracking-widest opacity-40 font-black ml-2">Converted Result</label>
              <div className="relative">
                <div className="w-full p-8 bg-slate-900 border-2 border-brand-accent/20 rounded-3xl font-mono text-3xl font-black text-white shadow-[0_0_30px_rgba(249,115,22,0.15)] flex items-center">
                  {convert()}
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                   <select 
                     value={toUnit}
                     onChange={(e) => setToUnit(e.target.value)}
                     className="bg-slate-800 text-white font-mono text-xs p-3 rounded-xl border border-white/10 outline-none uppercase font-bold"
                   >
                     {Object.keys(CONVERSIONS[type]).map(u => (
                       <option key={u} value={u}>{u.toUpperCase()}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8">
             <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl font-mono text-[9px] uppercase tracking-widest">
               <span className="text-brand-accent font-black">1 SUT =</span> 3.175 MM
             </div>
             <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl font-mono text-[9px] uppercase tracking-widest">
               <span className="text-brand-accent font-black">1 INCH =</span> 25.4 MM
             </div>
             <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl font-mono text-[9px] uppercase tracking-widest">
               <span className="text-brand-accent font-black">1 CFT =</span> 28.32 L
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
