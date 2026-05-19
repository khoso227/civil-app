import { useState, ChangeEvent, ReactNode } from 'react';
import { Camera, Upload, Send, BrainCircuit, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, FileText, X, Sparkles } from 'lucide-react';
import { db, auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ai, MODELS } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

export default function SiteVision() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ type: 'image' | 'doc' | 'text', data: string, name: string }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      
      selectedFiles.forEach(file => {
        const reader = new FileReader();
        if (file.type.startsWith('image/')) {
          reader.onloadend = () => {
            setPreviews(prev => [...prev, { type: 'image', data: reader.result as string, name: file.name }]);
          };
          reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
          reader.onloadend = () => {
            setPreviews(prev => [...prev, { type: 'doc', data: reader.result as string, name: file.name }]);
          };
          reader.readAsDataURL(file);
        } else if (file.type === 'text/plain') {
          reader.onloadend = () => {
            setPreviews(prev => [...prev, { type: 'text', data: reader.result as string, name: file.name }]);
          };
          reader.readAsText(file);
        } else {
          // Fallback for other types
          setPreviews(prev => [...prev, { type: 'doc', data: 'N/A', name: file.name }]);
        }
      });

      setResult(null);
      setGeneratedImage(null);
      setStatus('idle');
    }
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImage = async () => {
    if (files.length === 0 || !auth.currentUser) return;
    
    setAnalyzing(true);
    setStatus('uploading');
    setGeneratedImage(null);
    
    try {
      // 1. Upload all to Firebase Storage for record keeping
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `site-audits/${auth.currentUser?.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        return getDownloadURL(uploadResult.ref);
      });

      const downloadURLs = await Promise.all(uploadPromises);

      setStatus('analyzing');
      
      // 2. Prepare multimodal parts for Gemini
      // We use the data already read into previews state
      const assetParts = previews.map((p, idx) => {
        if (p.type === 'text') {
          return { text: `--- DOCUMENT: ${p.name} ---\n${p.data}\n--- END DOCUMENT ---` };
        } else {
          return {
            inlineData: {
              data: p.data.split(',')[1],
              mimeType: files[idx].type
            }
          };
        }
      });

      const prompt = `Perform a comprehensive construction site audit and assessment.
      You are provided with a mix of site imagery and project documentation (PDFs/Text).
      
      MISSION OBJECTIVES:
      1. SIGHT-DOC ALIGNMENT: Cross-reference visual site progress with the provided project specifications, blueprints, or schedules found in the documents. Identify discrepancies.
      2. SAFETY PROTOCOL: Detect visible safety violations in imagery and correlate with safety guidelines or incident reports in documents.
      3. RESOURCE ANALYSIS: Identify materials/equipment in photos and compare with inventory lists or delivery manifests in documents.
      4. STRATEGIC RECOMMENDATIONS: Provide 3-5 prioritized action items based on the synthesis of BOTH visual and textual data.
      
      Format the report with bold headers, technical precision, and a "Site Status" executive summary.`;
      
      const aiResult = await ai.models.generateContent({
        model: MODELS.vision,
        contents: {
          parts: [
            { text: prompt },
            ...assetParts
          ]
        }
      });

      const analysisText = aiResult.text || "No analysis generated.";
      setResult(analysisText);

      // 3. Save Record to Firestore
      await addDoc(collection(db, 'siteAudits'), {
        urls: downloadURLs,
        analysis: analysisText,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        createdAt: serverTimestamp(),
        batchSize: files.length,
        fileTypes: files.map(f => f.type)
      });

      setStatus('done');
    } catch (error) {
      console.error("Multimodal batch analysis failed:", error);
      setResult("SYSTEM ERROR: Failed to analyze documentation and imagery. Ensure valid PDF/Image files.");
      setStatus('idle');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateInsightVisual = async () => {
    if (!result) return;
    
    setGeneratingInsight(true);
    try {
      const prompt = `Create a photorealistic construction site visualization based on this analysis finding: "${result.substring(0, 500)}". 
      The image should depict a professional, modern construction site showing technical progress or a safety-first environment as recommended. 
      Cinematic lighting, high detail, unreal engine 5 render style.`;

      const response = await ai.models.generateContent({
        model: MODELS.image,
        contents: {
          parts: [{ text: prompt }]
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Visual insight generation failed:", error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand-border pb-10 gap-6">
        <div className="space-y-4">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tight">Site Vision AI</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">Neural Site Intelligence // Real-time Safety Audit // Progress Recognition</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
          <BrainCircuit size={16} className="text-purple-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-purple-500 font-bold">AI Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-8">
          <div className="min-h-[300px] border-2 border-dashed border-blue-100 rounded-3xl p-6 bg-blue-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
            {previews.length > 0 ? (
              <div className="w-full grid grid-cols-2 gap-4">
                {previews.map((prev, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={idx} 
                    className="relative aspect-video rounded-2xl overflow-hidden group/item border border-blue-100"
                  >
                    {prev.type !== 'image' ? (
                      <div className="w-full h-full bg-blue-100 flex flex-col items-center justify-center p-4 text-center">
                        <FileText size={32} className="text-blue-500 mb-2" />
                        <span className="text-[8px] font-mono font-black uppercase text-blue-600 truncate w-full px-2">
                          {prev.name}
                        </span>
                        <span className="text-[6px] font-mono text-blue-400 uppercase">{prev.type === 'text' ? 'PLAINTEXT' : 'DOCUMENT'}</span>
                      </div>
                    ) : (
                      <img src={prev.data} className="w-full h-full object-cover" alt="Preview" />
                    )}
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-10 shadow-lg"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-mono uppercase font-black">{prev.type === 'image' ? 'IMAGE' : 'DOC'}_{idx + 1}</span>
                    </div>
                  </motion.div>
                ))}
                <label className="aspect-video border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-100/50 transition-all">
                  <Upload size={20} className="text-blue-500" />
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-600">Add More</span>
                  <input type="file" multiple className="hidden" accept="image/*,application/pdf,text/plain" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <Camera size={32} className="text-blue-600" />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-xs uppercase tracking-widest font-black text-blue-600">Multimodal Input</p>
                  <p className="text-[10px] text-slate-400">Select images, PDFs, and text files for comprehensive assessment</p>
                </div>
                <label className="cursor-pointer bg-blue-600 text-white px-8 py-4 rounded-2xl font-mono text-xs uppercase tracking-widest font-black shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all active:translate-y-0 flex items-center gap-3">
                  <Upload size={18} />
                  Choose Files
                  <input type="file" multiple className="hidden" accept="image/*,application/pdf,text/plain" onChange={handleFileChange} />
                </label>
              </div>
            )}
          </div>

          <button
            disabled={files.length === 0 || analyzing}
            onClick={analyzeImage}
            className="w-full h-20 bg-blue-600 text-white font-mono text-sm uppercase tracking-[0.3em] font-black hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale rounded-3xl shadow-xl shadow-blue-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin" />
                {status === 'uploading' ? 'Vaulting Data...' : 'Executing Batch Analysis...'}
              </>
            ) : (
              <>
                <BrainCircuit size={24} />
                Batch Site Audit
              </>
            )}
          </button>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <h3 className="font-mono text-xs uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full"></span>
              Neural Processing Output
            </h3>
            <span className="font-mono text-[9px] opacity-20">SYSTEM_LOG_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 min-h-[450px] relative overflow-hidden flex flex-col text-slate-300 font-mono text-xs leading-relaxed">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-accent to-purple-500"></div>
            
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold italic">
                    <CheckCircle2 size={16} />
                    VALIDATION_COMPLETE
                  </div>
                  <div className="whitespace-pre-wrap py-2 border-l-2 border-brand-accent/20 pl-6">
                    {result}
                  </div>
                  
                  {generatedImage ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-2xl overflow-hidden border border-brand-accent/30 shadow-2xl shadow-brand-accent/10"
                    >
                      <img src={generatedImage} alt="Visual Insight" className="w-full h-auto" referrerPolicy="no-referrer" />
                      <div className="absolute top-4 left-4 bg-brand-accent text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={10} />
                        AI visual insight
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={generateInsightVisual}
                      disabled={generatingInsight}
                      className="w-full py-4 bg-purple-600/10 border border-purple-500/30 rounded-2xl text-purple-500 font-mono text-[10px] uppercase tracking-[0.2em] font-black hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {generatingInsight ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Rendering Concept...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generate Visual Insight
                        </>
                      )}
                    </button>
                  )}

                  <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4">
                    <StatusBadge icon={<AlertTriangle size={12} className="text-amber-500" />} label="Hazard Potential" val="Calculated" />
                    <StatusBadge icon={<ImageIcon size={12} className="text-blue-500" />} label="Storage Sync" val="Archived" />
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className={`p-6 rounded-full bg-slate-800 ${analyzing ? 'animate-pulse' : ''}`}>
                    <BrainCircuit size={48} className={analyzing ? 'animate-spin' : ''} />
                  </div>
                  <p className="uppercase tracking-[0.3em] text-[10px]">
                    {analyzing ? 'Synthesizing image tokens...' : 'System Standby // Waiting for Input'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ icon, label, val }: { icon: ReactNode, label: string, val: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl text-[9px] uppercase tracking-tighter hover:bg-white/10 transition-colors">
      {icon}
      <span className="opacity-40">{label}</span>
      <span className="font-bold text-white tracking-widest">{val}</span>
    </div>
  );
}
