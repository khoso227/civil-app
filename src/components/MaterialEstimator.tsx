import { useState } from 'react';
import { Box, Calculator, Download, Layers, Pipette, Ruler } from 'lucide-react';
import { motion } from 'motion/react';
import { translations, Language } from '../lib/i18n';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function MaterialEstimator({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [volume, setVolume] = useState<number>(10);
  const [ratio, setRatio] = useState<string>('1:2:4');
  const [isSlab, setIsSlab] = useState(true);

  const calculateConcrete = () => {
    // Standard Ratios: 1:2:4 (M15), 1:1.5:3 (M20)
    const parts = ratio.split(':').map(Number);
    const sum = parts.reduce((a, b) => a + b, 0);
    
    const dryVolume = volume * 1.54; // Dry volume factor
    
    const cementVol = (parts[0] / sum) * dryVolume;
    const cementBags = Math.ceil(cementVol / 0.035); // 0.035 m3 per bag
    
    const sandVol = (parts[1] / sum) * dryVolume;
    const crushVol = (parts[2] / sum) * dryVolume;
    
    // steel estimate (rough 80kg/m3 for slab)
    const steelWeight = volume * 80;

    return { cementBags, sandVol, crushVol, steelWeight };
  };

  const calculateBricks = () => {
    // Standard brick size 9"x4.5"x3" -> ~500 bricks per 100 cft
    const bricksPerM3 = 500;
    return Math.ceil(volume * bricksPerM3);
  };

  const results = calculateConcrete();
  const brickCount = calculateBricks();

  const generateReport = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(22);
    doc.text('Civil-OS Material Estimate', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableData = [
      ['Material', 'Quantity', 'Unit'],
      [t.cement, results.cementBags, 'Bags (50kg)'],
      [t.sand, results.sandVol.toFixed(2), 'm³'],
      [t.crush, results.crushVol.toFixed(2), 'm³'],
      [t.steel, results.steelWeight.toFixed(2), 'kg'],
      [t.bricks, brickCount, 'Nos']
    ];

    doc.autoTable({
      startY: 40,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }
    });

    doc.save('material-estimate.pdf');
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-6">
        <div className="space-y-4">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tight gradient-text leading-tight">{t.materialEst}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">Precision Quantities // Site Logistics // BOQ Sync</p>
        </div>
        <button 
          onClick={generateReport}
          className="flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-xl font-mono text-[10px] uppercase tracking-widest font-black shadow-lg shadow-brand-accent/20"
        >
          <Download size={16} />
          {t.downloadPDF}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Input */}
        <div className="lg:col-span-1 space-y-8">
           <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-6">
              <div className="flex items-center gap-3 text-brand-accent">
                <Box size={24} />
                <h3 className="font-mono text-xs uppercase tracking-widest font-black">Dimensions</h3>
              </div>
              
              <div className="space-y-4">
                <label className="block font-mono text-[10px] uppercase tracking-widest opacity-40">Concrete Volume (m³)</label>
                <input 
                  type="number"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 p-5 rounded-2xl font-mono text-2xl text-white outline-none focus:border-brand-accent transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="block font-mono text-[10px] uppercase tracking-widest opacity-40">Mix Ratio (C:S:A)</label>
                <select 
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 p-5 rounded-2xl font-mono text-sm text-white"
                >
                  <option value="1:2:4">1:2:4 (M15)</option>
                  <option value="1:1.5:3">1:1.5:3 (M20)</option>
                  <option value="1:1:2">1:1:2 (M25)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                 <button onClick={() => setIsSlab(true)} className={`flex-1 p-4 rounded-xl border font-mono text-[9px] uppercase tracking-widest font-black transition-all ${isSlab ? 'bg-brand-accent text-white border-transparent' : 'bg-white/5 border-white/10 text-slate-400'}`}>Slab/RC</button>
                 <button onClick={() => setIsSlab(false)} className={`flex-1 p-4 rounded-xl border font-mono text-[9px] uppercase tracking-widest font-black transition-all ${!isSlab ? 'bg-brand-accent text-white border-transparent' : 'bg-white/5 border-white/10 text-slate-400'}`}>Brick Wall</button>
              </div>
           </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
           <ResultCard icon={<Pipette />} label={t.cement} value={results.cementBags} unit="Bags" color="bg-orange-500" />
           <ResultCard icon={<Layers />} label={isSlab ? t.crush : t.bricks} value={isSlab ? results.crushVol.toFixed(1) : brickCount} unit={isSlab ? "m³" : "Nos"} color="bg-blue-500" />
           <ResultCard icon={<Calculator />} label={t.sand} value={results.sandVol.toFixed(1)} unit="m³" color="bg-amber-500" />
           <ResultCard icon={<Ruler />} label={t.steel} value={results.steelWeight.toFixed(0)} unit="kg" color="bg-slate-500" />
        </div>
      </div>
    </div>
  );
}

function ResultCard({ icon, label, value, unit, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-6 relative overflow-hidden group transition-all"
    >
      <div className={`absolute -top-4 -right-4 p-8 opacity-5 scale-[3] group-hover:opacity-10 group-hover:text-brand-accent transition-all`}>
        {icon}
      </div>
      <div className={`w-12 h-1 ${color} rounded-full`}></div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40 font-black">{label}</p>
      <div className="flex items-baseline gap-3">
        <h4 className="text-6xl font-mono font-black text-white tabular-nums group-hover:text-brand-accent transition-colors">{value}</h4>
        <span className="font-serif italic text-brand-accent text-lg opacity-60">{unit}</span>
      </div>
    </motion.div>
  );
}
