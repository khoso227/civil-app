import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, where, orderBy, collectionGroup } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, TrendingUp, DollarSign, Clock, CheckCircle2, AlertCircle, Filter, ArrowUpDown, ChevronDown, Search } from 'lucide-react';
import { translations, Language } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = ['#FFD60A', '#00b4d8', '#00f5d4', '#4361ee'];

export default function ProjectBoard({ lang = 'en' }: { lang?: Language }) {
  const t = translations[lang];
  const [data, setData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  // Filtering & Sorting State
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // 1. Fetch Projects
    const projectsQuery = query(
      collection(db, 'projects'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Transform for Recharts
      const chartData = projects.slice(0, 5).map((p: any) => ({
        name: p.name?.substring(0, 8) || 'Site',
        budget: p.budget || 0,
        progress: 0 
      }));
      setData(chartData);

      const statuses = projects.reduce((acc: any, p: any) => {
        const s = p.status || 'Active';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      setStatusData(Object.entries(statuses).map(([name, value]) => ({ name, value })));

      // 2. Fetch Tasks (using collectionGroup if possible, or per project)
      // For simplicity and security (owner check), we use collectionGroup and filter in memory if few, 
      // but usually we'd need to redundantize ownerId. 
      // Here we'll query collectionGroup('tasks') and rely on firestore rules or fetch per project.
      // Given the rules, global read is allowed if signed in.
    });

    // 3. Fetch all tasks for the board
    // Note: In production, you'd want to filter by projectIds the user has access to.
    const tasksQuery = query(collectionGroup(db, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Get project info from path if needed, but we have projectId in doc.data()
      }));
      setTasks(allTasks);
      setLoadingTasks(false);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
    };
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const matchesAssignee = !filterAssignee || task.assigneeName?.toLowerCase().includes(filterAssignee.toLowerCase());
        const matchesPriority = !filterPriority || task.priority === filterPriority;
        const matchesStatus = !filterStatus || task.status === filterStatus;
        const matchesSearch = !searchQuery || 
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const taskDate = task.dueDate ? new Date(task.dueDate) : null;
        const matchesDateStart = !filterDateStart || (taskDate && taskDate >= new Date(filterDateStart));
        const matchesDateEnd = !filterDateEnd || (taskDate && taskDate <= new Date(filterDateEnd));
        
        return matchesAssignee && matchesPriority && matchesStatus && matchesSearch && matchesDateStart && matchesDateEnd;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        // Handle priority weights for sorting
        if (sortBy === 'priority') {
          const weights: any = { 'High': 3, 'Medium': 2, 'Low': 1 };
          valA = weights[valA] || 0;
          valB = weights[valB] || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [tasks, filterAssignee, filterPriority, filterStatus, searchQuery, sortBy, sortOrder]);

  const clearFilters = () => {
    setFilterAssignee('');
    setFilterPriority('');
    setFilterStatus('');
    setFilterDateStart('');
    setFilterDateEnd('');
    setSearchQuery('');
  };

  const isFiltered = filterAssignee || filterPriority || filterStatus || filterDateStart || filterDateEnd || searchQuery;

  return (
    <div className="space-y-12 pb-20 relative industrial-grid min-h-screen px-2">
      <div className="scanline" />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-10 gap-6 relative">
        <div className="absolute top-0 left-0 w-32 h-1 caution-tape opacity-20" />
        <div className="space-y-4">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tight gradient-text leading-tight">{t.projectBoard}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">Global Progress Metrics // Budget Burn // Resource Allocation</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="glass-panel p-8 rounded-[3rem] border-white/5 space-y-8 relative overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,214,10,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,214,10,0.01)_1px,transparent_1px)] bg-[length:30px_30px]" />
           <div className="flex justify-between items-center px-4 relative z-10">
              <h3 className="font-mono text-xs uppercase tracking-widest font-black text-brand-accent flex items-center gap-2">
                 <DollarSign size={16} /> Budget vs Allocation
              </h3>
              <div className="flex items-center gap-4 text-[9px] font-mono opacity-40 uppercase font-black">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-accent"></span> Actual</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-info"></span> Forecast</span>
              </div>
           </div>
           
           <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 900, fontFamily: 'var(--font-mono)' }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 900, fontFamily: 'var(--font-mono)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0, 13, 35, 0.9)', border: '1px solid rgba(255, 214, 10, 0.2)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 900 }}
                    cursor={{ fill: 'rgba(255, 214, 10, 0.05)' }}
                  />
                  <Bar dataKey="budget" fill="#FFD60A" radius={[2, 2, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-panel p-8 rounded-[3rem] border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
           <div className="space-y-4 px-4">
              <h3 className="font-mono text-xs uppercase tracking-widest font-black text-brand-accent flex items-center gap-2">
                 <TrendingUp size={16} /> Status Distribution
              </h3>
              <div className="space-y-3">
                 {statusData.map((s, i) => (
                   <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                     <span className="font-mono text-[10px] uppercase text-white/60">{s.name}</span>
                     <span className="font-mono text-xs font-black text-brand-accent">{s.value} Docs</span>
                   </div>
                 ))}
                 {statusData.length === 0 && <p className="text-[10px] font-mono uppercase opacity-20 py-4 italic">Analysis pending sync</p>}
              </div>
           </div>

           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.length > 0 ? statusData : [{ name: 'Empty', value: 1 }]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(statusData.length > 0 ? statusData : [{ name: 'Empty', value: 1 }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Task Board Section */}
      <div className="glass-panel p-8 md:p-12 rounded-[3.5rem] border-white/5 space-y-10">
        <div className="flex flex-col border-b border-white/5 pb-8 gap-8">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
             <div className="space-y-4">
               <h3 className="text-5xl font-serif italic gradient-text leading-tight">Operational Audit</h3>
               <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-30">Field Dispatch // Task Routing // Priority Protocol</p>
             </div>
             
             <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-mono text-[10px] text-white outline-none focus:border-brand-accent transition-all uppercase"
                  />
                </div>

                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all font-mono text-[10px] uppercase tracking-widest font-black ${showFilters || isFiltered ? 'bg-brand-accent text-black border-brand-accent shadow-lg shadow-brand-accent/20' : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  <Filter size={14} />
                  {showFilters ? 'Hide_Filters' : 'Advanced_Filters'}
                  {isFiltered && <span className="ml-2 w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                </button>
             </div>
           </div>

           <AnimatePresence>
             {showFilters && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="overflow-hidden"
               >
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-950/50 p-8 rounded-3xl border border-white/5">
                    {/* Status Filter */}
                    <div className="space-y-3">
                      <label className="font-mono text-[8px] uppercase tracking-widest opacity-40 font-black flex items-center gap-2">
                        <CheckCircle2 size={10} /> Status_Gate
                      </label>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-white outline-none focus:border-brand-accent transition-all uppercase"
                      >
                        <option value="">All Streams</option>
                        <option value="Todo">Todo</option>
                        <option value="In Progress">Active</option>
                        <option value="Done">Resolved</option>
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-3">
                      <label className="font-mono text-[8px] uppercase tracking-widest opacity-40 font-black flex items-center gap-2">
                        <TrendingUp size={10} /> Urgency_Level
                      </label>
                      <select 
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-white outline-none focus:border-brand-accent transition-all uppercase"
                      >
                        <option value="">All Tiers</option>
                        <option value="High">P1: Critical</option>
                        <option value="Medium">P2: Moderate</option>
                        <option value="Low">P3: Advisory</option>
                      </select>
                    </div>

                    {/* Assignee Filter */}
                    <div className="space-y-3">
                      <label className="font-mono text-[8px] uppercase tracking-widest opacity-40 font-black flex items-center gap-2">
                        <Users size={10} /> Personnel_ID
                      </label>
                      <input 
                        type="text"
                        placeholder="Search assignee..."
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-white outline-none focus:border-brand-accent transition-all uppercase"
                      />
                    </div>

                    {/* Sorting Control */}
                    <div className="space-y-3">
                      <label className="font-mono text-[8px] uppercase tracking-widest opacity-40 font-black flex items-center gap-2">
                        <ArrowUpDown size={10} /> Order_Protocol
                      </label>
                      <div className="flex gap-2">
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-white outline-none focus:border-brand-accent transition-all uppercase"
                        >
                          <option value="dueDate">Due Date</option>
                          <option value="priority">Priority</option>
                          <option value="status">Status</option>
                          <option value="title">Alpha</option>
                        </select>
                        <button 
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-4 bg-slate-950 border border-white/10 rounded-xl text-brand-accent hover:border-brand-accent transition-all"
                        >
                          <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Date Range Fields */}
                    <div className="col-span-1 md:col-span-2 space-y-3">
                      <label className="font-mono text-[8px] uppercase tracking-widest opacity-40 font-black flex items-center gap-2">
                        <Calendar size={10} /> Temporal_Range
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="date"
                          value={filterDateStart}
                          onChange={(e) => setFilterDateStart(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-white outline-none focus:border-brand-accent transition-all uppercase"
                        />
                        <input 
                          type="date"
                          value={filterDateEnd}
                          onChange={(e) => setFilterDateEnd(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-white outline-none focus:border-brand-accent transition-all uppercase"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex items-end">
                      <button 
                        onClick={clearFilters}
                        disabled={!isFiltered}
                        className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-mono text-[9px] uppercase tracking-[0.3em] font-black hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        RESET_DISCOVERY_ENGINE
                      </button>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {loadingTasks ? (
          <div className="py-20 text-center font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse opacity-30">INITIALIZING_TASK_ENGINE...</div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={task.id}
                >
                  <TaskCard 
                    title={task.title} 
                    description={task.description}
                    site={task.projectId?.substring(task.projectId.length - 6).toUpperCase() || 'UNKNOWN'} 
                    status={task.status} 
                    deadline={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'NO_DATE'}
                    priority={task.priority}
                    assignee={task.assigneeName}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-20 italic">No tasks match current filter parameters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ title, description, site, status, deadline, priority, assignee }: any) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'High': return 'bg-red-500 shadow-red-500/20';
      case 'Medium': return 'bg-brand-accent shadow-brand-accent/20';
      case 'Low': return 'bg-blue-500 shadow-blue-500/20';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Done': return <CheckCircle2 className="text-brand-success" size={18} />;
      case 'In Progress': return <Clock className="text-brand-info" size={18} />;
      default: return <AlertCircle className="text-slate-500" size={18} />;
    }
  };

  return (
    <div className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-6 hover:border-brand-accent transition-all group shadow-xl relative overflow-hidden">
       <div className={`absolute top-0 right-0 w-16 h-1 ${getPriorityColor()}`}></div>
       
       <div className="flex justify-between items-start">
         <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform">
           {getStatusIcon()}
         </div>
         <div className="text-right">
           <span className="block font-mono text-[8px] uppercase tracking-[0.4em] opacity-30 group-hover:opacity-100 group-hover:text-brand-accent transition-all mb-1 font-black">{deadline}</span>
           <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase text-white ${getPriorityColor()}`}>
             {priority || 'Standard'}
           </span>
         </div>
       </div>

       <div className="space-y-2">
         <div className="flex items-center gap-2">
            <p className="font-mono text-[8px] uppercase tracking-widest opacity-40 font-black px-2 py-0.5 bg-white/5 rounded-md inline-block">{site}</p>
            {assignee && (
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Users size={10} /> {assignee}
              </span>
            )}
         </div>
         <h4 className="text-xl font-black text-white group-hover:translate-x-1 transition-transform leading-snug">{title}</h4>
         {description && <p className="text-[10px] text-slate-400 font-mono leading-relaxed line-clamp-2">{description}</p>}
       </div>

       <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <span className={`text-[10px] font-mono uppercase font-black ${status === 'Done' ? 'text-brand-success' : status === 'In Progress' ? 'text-brand-info' : 'text-slate-500'}`}>
            {status}
          </span>
          <div className="flex gap-1">
            <div className={`w-2 h-2 rounded-full ${status === 'Done' ? 'bg-brand-success' : 'bg-white/5'}`}></div>
            <div className={`w-2 h-2 rounded-full ${status === 'In Progress' ? 'bg-brand-info' : 'bg-white/5'}`}></div>
            <div className={`w-2 h-2 rounded-full ${status === 'Todo' ? 'bg-slate-500' : 'bg-white/5'}`}></div>
          </div>
       </div>
    </div>
  );
}
