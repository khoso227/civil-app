import { useState, useEffect, FormEvent } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { HardHat, Plus, BarChart3, MapPin, Calendar, Clock, ChevronRight, X, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  budget: number;
  startDate: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', location: '', status: 'Planning', budget: 0 });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'projects'), 
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(docs);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const createProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        startDate: new Date().toISOString()
      });
      setNewProject({ name: '', location: '', status: 'Planning', budget: 0 });
      setIsAdding(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const trackLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewProject({ ...newProject, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
      },
      (error) => {
        console.error("Error tracking location:", error);
        alert("Unable to retrieve location. Please check permissions.");
      }
    );
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand-border pb-8 gap-6">
        <div className="space-y-2">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tighter gradient-text">Project Hub</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">System Node Management // Global Deployment</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="h-16 px-10 bg-gradient-to-r from-brand-primary to-slate-800 text-white rounded-2xl shadow-xl hover:shadow-brand-accent/20 transition-all active:scale-95 flex items-center gap-4 font-mono text-xs uppercase tracking-widest font-bold group"
        >
          {isAdding ? <X size={20} className="text-brand-accent" /> : <PlusCircle size={20} className="text-brand-accent group-hover:rotate-90 transition-transform" />}
          {isAdding ? 'Exit Terminal' : 'Launch New Site'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={createProject} className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-12 bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group [.light-mode_&]:bg-white [.light-mode_&]:border-sky-500/10">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-brand-accent to-purple-600"></div>
          
          <div className="space-y-10">
             <div className="space-y-4">
               <label className="font-mono text-xs uppercase tracking-widest font-black text-brand-accent flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping"></div>
                 Project Designation
               </label>
               <input 
                 required
                 value={newProject.name}
                 onChange={e => setNewProject({...newProject, name: e.target.value})}
                 className="w-full p-6 bg-slate-950 border border-white/5 rounded-2xl font-mono text-sm outline-none focus:border-brand-accent focus:bg-slate-900 transition-all shadow-inner text-white [.light-mode_&]:bg-sky-50 [.light-mode_&]:text-slate-900 [.light-mode_&]:border-sky-500/10"
                 placeholder="e.g. SKYLINE_TOWERS_KHI"
               />
             </div>

             <div className="space-y-4">
               <label className="font-mono text-xs uppercase tracking-widest font-black text-slate-400 [.light-mode_&]:text-slate-900">Geographic Location</label>
               <div className="flex gap-4">
                 <div className="relative flex-1">
                   <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-accent" size={20} />
                   <input 
                     value={newProject.location}
                     onChange={e => setNewProject({...newProject, location: e.target.value})}
                     className="w-full p-6 pl-14 bg-slate-950 border border-white/5 rounded-2xl font-mono text-sm outline-none focus:border-brand-accent focus:bg-slate-900 transition-all shadow-inner text-white [.light-mode_&]:bg-sky-50 [.light-mode_&]:text-slate-900 [.light-mode_&]:border-sky-500/10"
                     placeholder="Coordinates or Address"
                   />
                 </div>
                 <button 
                  type="button"
                  onClick={trackLocation}
                  className="p-6 bg-brand-primary text-white rounded-2xl hover:bg-brand-accent transition-all shadow-lg active:scale-95 group/loc"
                  title="Use Live Location"
                 >
                   <MapPin size={24} className="group-hover/loc:animate-bounce" />
                 </button>
               </div>
             </div>
          </div>

          <div className="space-y-10">
             <div className="space-y-4">
               <label className="font-mono text-xs uppercase tracking-widest font-black text-brand-primary">Financial Liability [PKR]</label>
               <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-brand-accent font-black">Rs.</span>
                 <input 
                   type="number"
                   value={newProject.budget}
                   onChange={e => setNewProject({...newProject, budget: Number(e.target.value)})}
                   className="w-full p-6 pl-16 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-lg outline-none focus:border-brand-accent focus:bg-white transition-all shadow-inner font-bold"
                 />
               </div>
             </div>

             <div className="space-y-4">
                <label className="font-mono text-xs uppercase tracking-widest font-black text-brand-primary">Lifecycle Stage</label>
                <div className="relative">
                  <select 
                    value={newProject.status}
                    onChange={e => setNewProject({...newProject, status: e.target.value})}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-sm outline-none focus:border-brand-accent focus:bg-white transition-all appearance-none cursor-pointer font-bold shadow-inner"
                  >
                    <option value="Planning">PLANNING_CORE</option>
                    <option value="In Progress">ACTIVE_EXECUTION</option>
                    <option value="Delayed">MAINTENANCE_HOLD</option>
                  </select>
                  <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                </div>
             </div>

             <button type="submit" className="w-full h-16 bg-gradient-to-r from-brand-primary to-slate-800 text-white font-mono text-sm uppercase tracking-[0.3em] font-black rounded-2xl hover:bg-brand-accent hover:from-brand-accent hover:to-orange-700 transition-all shadow-2xl active:translate-y-1">
               DEPLOY TO PROJECT LEDGER
             </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-12">
        {loading ? (
          <div className="py-20 text-center font-mono text-xs uppercase tracking-[0.4em] animate-pulse text-brand-accent">SCANNING_SATELLITE_NODES...</div>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <motion.div 
              whileHover={{ x: 10 }}
              key={project.id} 
              className="group bg-slate-900 rounded-3xl border border-white/5 hover:border-brand-accent transition-all p-10 flex flex-col md:flex-row gap-12 items-center cursor-pointer relative overflow-hidden shadow-sm hover:shadow-2xl [.light-mode_&]:bg-white [.light-mode_&]:border-sky-500/10"
            >
              <div className="w-full md:w-40 h-40 bg-slate-950 flex items-center justify-center shrink-0 border border-white/5 rounded-[2rem] group-hover:bg-brand-accent/10 transition-all duration-500 shadow-inner [.light-mode_&]:bg-sky-50">
                <HardHat size={64} className="opacity-10 group-hover:opacity-100 group-hover:text-brand-accent group-hover:scale-110 transition-all duration-700" />
              </div>
              
              <div className="flex-1 space-y-8 w-full">
                <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
                  <div className="space-y-4">
                    <span className={`font-mono text-[10px] uppercase tracking-[0.3em] px-4 py-1 rounded-full font-black shadow-lg text-white ${project.status === 'Delayed' ? 'bg-red-500' : project.status === 'In Progress' ? 'bg-brand-accent' : 'bg-brand-info'}`}>
                      {project.status.toUpperCase()}
                    </span>
                    <h3 className="font-serif italic text-5xl tracking-tight text-white [.light-mode_&]:text-slate-900 underline decoration-brand-accent/20 decoration-8 underline-offset-[12px] group-hover:decoration-brand-accent transition-all">{project.name}</h3>
                  </div>
                  <div className="text-left xl:text-right p-6 bg-slate-950 border border-white/5 rounded-3xl group-hover:bg-brand-accent transition-all [.light-mode_&]:bg-sky-50">
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-40 group-hover:text-white group-hover:opacity-100 font-bold mb-2">ALLOCATED_BUDGET</p>
                    <p className="font-mono text-4xl tracking-tighter font-black text-white group-hover:text-white transition-colors [.light-mode_&]:text-slate-900">
                      <span className="text-xl mr-2 text-brand-accent group-hover:text-white/60">Rs.</span>
                      {project.budget?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-10 pt-8 border-t border-white/5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                   <div className="flex items-center gap-3 px-4 py-2 bg-slate-950 rounded-xl group-hover:bg-slate-900 transition-colors [.light-mode_&]:bg-sky-50">
                     <MapPin size={16} className="text-brand-accent" />
                     <span className="opacity-40 mr-2">COORD:</span> <span className="text-slate-300 [.light-mode_&]:text-slate-700">{project.location || 'NONE_STATED'}</span>
                   </div>
                   <div className="flex items-center gap-3 px-4 py-2 bg-slate-950 rounded-xl group-hover:bg-slate-900 transition-colors [.light-mode_&]:bg-sky-50">
                     <Calendar size={16} className="text-brand-accent" />
                     <span className="opacity-40 mr-2">START:</span> <span className="text-slate-300 [.light-mode_&]:text-slate-700">{new Date(project.startDate).toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center gap-3 px-4 py-2 bg-slate-950 rounded-xl group-hover:bg-slate-900 transition-colors [.light-mode_&]:bg-sky-50">
                     <Clock size={16} className="text-brand-accent" />
                     <span className="opacity-40 mr-2">AGE:</span> <span className="text-slate-300 [.light-mode_&]:text-slate-700">142D</span>
                   </div>
                </div>
              </div>

              <div className="hidden lg:flex h-20 w-20 bg-slate-950 text-slate-600 rounded-full items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all shadow-inner group-hover:shadow-brand-accent/40 group-hover:-rotate-45 [.light-mode_&]:bg-sky-50">
                <ChevronRight size={40} />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-40 text-center space-y-8 opacity-20 border-4 border-dashed border-brand-border rounded-[3rem] bg-slate-50/50">
            <BarChart3 size={100} className="mx-auto text-brand-primary" />
            <p className="font-serif italic text-4xl uppercase tracking-[0.2em] font-black">NO_SITE_RECORDS_AVAILABLE</p>
          </div>
        )}
      </div>
    </div>
  );
}
