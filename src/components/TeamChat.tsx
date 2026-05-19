import { useState, useEffect, useRef, useMemo } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Send, User, MessageCircle, Clock, ShieldCheck, Download, Calendar, FileText, File as FileIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../lib/i18n';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userRole: string;
  createdAt: any;
}

export default function TeamChat({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'team_messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs.reverse());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!startDate && !endDate) return messages;
    
    return messages.filter(msg => {
      if (!msg.createdAt) return true;
      const msgDate = msg.createdAt.toDate();
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && msgDate < start) return false;
      if (end) {
        const endDay = new Date(end);
        endDay.setHours(23, 59, 59, 999);
        if (msgDate > endDay) return false;
      }
      return true;
    });
  }, [messages, startDate, endDate]);

  const exportAsText = () => {
    const content = filteredMessages.map(m => 
      `[${m.createdAt?.toDate().toLocaleString() || 'PENDING'}] ${m.userName} (${m.userRole}): ${m.text}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    setShowExport(false);
  };

  const exportAsPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text("Civil-OS Chat History", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    if (startDate || endDate) {
      doc.text(`Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 36);
    }

    const tableData = filteredMessages.map(m => [
      m.createdAt?.toDate().toLocaleString() || 'PENDING',
      m.userName,
      m.userRole,
      m.text
    ]);

    doc.autoTable({
      startY: 42,
      head: [['Timestamp', 'User', 'Role', 'Message']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: '#f97316' }
    });

    doc.save(`chat_export_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExport(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'team_messages'), {
        text: newMessage,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
        userRole: 'Staff', 
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 gap-4">
        <div className="space-y-4">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tight gradient-text leading-tight">{t.teamChat}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">Direct Site Comms // Real-time Sync // Secure Channel</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowExport(true)}
            className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all font-mono text-[10px] uppercase tracking-widest text-slate-300"
          >
            <Download size={14} className="text-brand-accent" />
            Archive_Data
          </button>
          <div className="flex items-center gap-3 bg-brand-accent/10 px-6 py-3 rounded-2xl border border-brand-accent/20">
             <ShieldCheck size={16} className="text-brand-accent" />
             <span className="font-mono text-[10px] uppercase tracking-widest text-brand-accent font-black">Encrypted_Sync</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showExport && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 border border-brand-accent/20 rounded-[2rem] p-8 space-y-6 overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-xs uppercase tracking-widest font-black text-brand-accent flex items-center gap-3">
                <Calendar size={16} />
                Export Configuration
              </h3>
              <button onClick={() => setShowExport(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="font-mono text-[9px] uppercase tracking-widest opacity-40">Start Date</label>
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={e => setStartDate(e.target.value)}
                   className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-xs text-white outline-none focus:border-brand-accent"
                 />
               </div>
               <div className="space-y-2">
                 <label className="font-mono text-[9px] uppercase tracking-widest opacity-40">End Date</label>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                   className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-xs text-white outline-none focus:border-brand-accent"
                 />
               </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <button 
                onClick={exportAsText}
                className="flex-1 h-14 bg-white/5 border border-white/10 rounded-xl font-mono text-[10px] uppercase tracking-widest font-black text-slate-300 hover:bg-brand-accent hover:text-white transition-all flex items-center justify-center gap-3"
              >
                <FileText size={16} />
                Plain Text (.txt)
              </button>
              <button 
                onClick={exportAsPDF}
                className="flex-1 h-14 bg-brand-accent text-white rounded-xl font-mono text-[10px] uppercase tracking-widest font-black shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-3"
              >
                <FileIcon size={16} />
                Neural PDF (.pdf)
              </button>
            </div>
            <p className="text-center font-mono text-[8px] opacity-20 uppercase tracking-[0.3em]">Filtered Transmission Record // Total: {filteredMessages.length} nodes</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 glass-panel rounded-[3rem] border-white/5 overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
           <MessageCircle size={400} className="text-brand-accent" />
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${msg.userId === auth.currentUser?.uid ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="w-12 h-12 bg-slate-900 rounded-2xl border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                  <User size={20} className={msg.userId === auth.currentUser?.uid ? 'text-brand-accent' : 'text-slate-400'} />
                </div>
                
                <div className={`space-y-2 max-w-[80%] ${msg.userId === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-3 px-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest font-black text-brand-accent">{msg.userName}</span>
                    <span className="font-mono text-[8px] opacity-30 uppercase">{msg.userRole}</span>
                  </div>
                  
                  <div className={`p-6 rounded-[2rem] shadow-xl ${msg.userId === auth.currentUser?.uid ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/10' : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none [.light-mode_&]:bg-blue-50 [.light-mode_&]:text-blue-900 [.light-mode_&]:border-blue-100'}`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 px-4 opacity-20">
                    <Clock size={10} />
                    <span className="font-mono text-[8px] uppercase">{msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef}></div>
        </div>

        <form onSubmit={sendMessage} className="p-8 bg-slate-950/50 border-t border-white/5 flex gap-4">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your transmission..."
            className="flex-1 bg-slate-900 border border-white/10 p-6 rounded-[2rem] text-sm text-white focus:border-brand-accent outline-none transition-all"
          />
          <button 
            type="submit"
            className="w-20 h-20 bg-brand-accent text-white rounded-[2rem] shadow-xl shadow-brand-accent/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
