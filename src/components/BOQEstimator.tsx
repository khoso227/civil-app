import { useState, ChangeEvent } from 'react';
import { Calculator, BrainCircuit, Loader2, FileText, Download, FileText as FileIcon, Upload } from 'lucide-react';
import { ai, MODELS } from '../lib/gemini';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { translations, Language } from '../lib/i18n';

interface EstimateProps {
  item: string;
  quantity: string;
  unit: string;
  reasoning: string;
}

export default function BOQEstimator({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [desc, setDesc] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [estimates, setEstimates] = useState<EstimateProps[]>([]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const prompt = "Extract and summarize the construction project specifications from this document. Focus on dimensions, materials, structural requirements, and any specific details that would be needed for a Bill of Quantities (BOQ). Provide a detailed, cohesive project description based on the document.";
      
      const result = await ai.models.generateContent({
        model: MODELS.text,
        contents: {
          parts: [
            { text: prompt },
            { 
              inlineData: {
                data: base64Data,
                mimeType: file.type
              }
            }
          ]
        }
      });

      const extractedText = result.text || "";
      setDesc(extractedText);
    } catch (error) {
      console.error("Document extraction failed:", error);
    } finally {
      setExtracting(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(22);
    doc.text('Civil-OS Preliminary BOQ', 14, 20);
    doc.setFontSize(10);
    doc.text(`Project: ${desc.substring(0, 50)}...`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 35);
    
    const tableData = estimates.map(est => [est.item, est.quantity, est.unit, est.reasoning]);

    doc.autoTable({
      startY: 45,
      head: [['Material Item', 'Quantity', 'Unit', 'Reasoning']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }
    });

    doc.save('boq-estimate.pdf');
  };

  const runCalculation = async () => {
    if (!desc) return;
    setCalculating(true);
    setEstimates([]);

    try {
      const prompt = `Based on this construction project description: "${desc}", generate a preliminary Bill of Quantities (BOQ). 
      Provide a list of materials with estimated quantities and units. For each item, briefly explain the reasoning for the quantity.
      Return the result as a JSON array of objects with keys: "item", "quantity", "unit", "reasoning". 
      Be realistic and professional as a civil engineer.`;

      const response = await ai.models.generateContent({
        model: MODELS.text,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text);
      setEstimates(data);
    } catch (error) {
      console.error("Calculation failed:", error);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <header className="space-y-2 border-b border-brand-primary pb-6">
        <h2 className="font-serif italic text-4xl">Intelligent BOQ Estimator</h2>
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">AI Calculations // Material Forecasting // Engineering Logic</p>
      </header>

      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-1 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="font-mono text-[10px] uppercase tracking-widest opacity-60">Project Specification</label>
              <label className="flex items-center gap-2 cursor-pointer text-brand-accent hover:text-brand-accent/80 transition-colors">
                <Upload size={12} />
                <span className="font-mono text-[9px] uppercase tracking-widest font-black">Upload Specs</span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="relative">
              {extracting && (
                <div className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-accent mb-4" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-accent font-black">Decoding Document...</p>
                </div>
              )}
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g. 2000 sqft residential villa, 2 floors, brick masonry, reinforced concrete slabs..."
                className="w-full h-48 p-4 bg-transparent border border-brand-primary font-mono text-xs focus:bg-brand-primary/5 transition-colors resize-none outline-none"
              />
            </div>
          </div>

          <button 
            disabled={!desc || calculating || extracting}
            onClick={runCalculation}
            className="w-full py-4 bg-brand-primary text-brand-secondary font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 group hover:opacity-90 transition-all"
          >
            {calculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            )}
            {calculating ? 'Syncing Logic...' : 'Calculate BOQ'}
          </button>
        </div>

        <div className="col-span-2 space-y-6">
           <div className="flex justify-between items-center border-b border-white/5 pb-2">
             <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Estimated Quantities</h3>
             {estimates.length > 0 && (
               <button 
                 onClick={exportPDF}
                 className="font-mono text-[9px] uppercase tracking-widest text-brand-accent hover:opacity-100 flex items-center gap-2 group"
               >
                 <FileIcon size={12} className="group-hover:scale-110 transition-transform" />
                 {t.downloadPDF}
               </button>
             )}
           </div>

           <div className="min-h-[400px]">
              {estimates.length > 0 ? (
                <div className="space-y-0">
                  <div className="grid grid-cols-12 gap-4 py-3 border-b border-brand-primary/20 col-header">
                    <span className="col-span-4">Material Item</span>
                    <span className="col-span-2">Quantity</span>
                    <span className="col-span-1 text-center">Unit</span>
                    <span className="col-span-5">AI Reasoning</span>
                  </div>
                  {estimates.map((est, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 py-4 data-row border-b border-brand-primary/10 items-center">
                      <span className="col-span-4 font-bold">{est.item}</span>
                      <span className="col-span-2 data-value">{est.quantity}</span>
                      <span className="col-span-1 text-center font-mono opacity-60">{est.unit}</span>
                      <span className="col-span-5 text-[11px] opacity-70 leading-tight italic">{est.reasoning}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10 py-20 text-center">
                  <FileText size={64} />
                  <p className="font-mono text-xs uppercase tracking-[0.2em]">Awaiting specification input for generation</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
