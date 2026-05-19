import { useState, useRef, useEffect } from 'react';
import { Send, User, BrainCircuit, Loader2, Sparkles, Terminal } from 'lucide-react';
import { ai, MODELS } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Civil-OS Intelligence Terminal Active. How can I assist you with site management or engineering calculations today?' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSending(true);

    try {
      const response = await ai.models.generateContent({
        model: MODELS.text,
        contents: userMsg,
        config: {
          systemInstruction: "You are Civil-OS Assistant, an expert civil engineer and site project manager. Provide highly technical, efficient, and professional advice. Focus on construction industry best practices, safety, and material efficiency. You are also an expert in unit conversions (1 SUT = 3.175mm), CAD drafting (AutoCAD style), and structural analysis (Beam design, Load calc). Suggest design improvements when asked about drawings. Keep responses concise unless asked for details."
        }
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Terminal Error: Data link interrupted. Please retry signal transmission." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col space-y-6">
      <header className="space-y-2 border-b border-brand-primary pb-6 flex justify-between items-end">
        <div>
          <h2 className="font-serif italic text-4xl">AI Assistant</h2>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">Neural Network Site Support // Real-time Consultation</p>
        </div>
        <div className="flex gap-2 items-center px-3 py-1 bg-brand-primary text-brand-secondary font-mono text-[9px] uppercase tracking-widest">
          <Terminal size={12} />
          Encrypted Sync
        </div>
      </header>

      <div className="flex-1 overflow-y-auto border border-brand-primary/20 bg-brand-primary/5 p-8 space-y-8" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 bg-brand-primary text-brand-secondary flex items-center justify-center shrink-0">
                  <BrainCircuit size={16} />
                </div>
              )}
              <div className={`max-w-[80%] p-4 font-mono text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-brand-primary text-brand-secondary' 
                  : 'bg-transparent border border-brand-primary rounded-tr-xl'
              }`}>
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 border border-brand-primary flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <div className="flex gap-4 items-center opacity-40">
            <div className="w-8 h-8 bg-brand-primary text-brand-secondary flex items-center justify-center animate-pulse">
              <BrainCircuit size={16} />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest animate-pulse">Calculating response...</div>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Query the system (e.g. 'How to cure concrete in high heat?')"
          className="w-full p-6 pr-20 bg-transparent border-2 border-brand-primary font-mono text-xs focus:bg-brand-primary/5 transition-all outline-none"
        />
        <button 
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:translate-x-1 transition-transform disabled:opacity-20"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
}
