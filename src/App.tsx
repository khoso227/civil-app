import { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db, logout } from './lib/firebase';
import { translations, Language } from './lib/i18n';
import { 
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { 
  BarChart3, 
  HardHat, 
  ClipboardList, 
  Package, 
  Camera, 
  MessageSquare, 
  LogOut,
  ChevronRight,
  PlusCircle,
  BrainCircuit,
  Warehouse,
  Menu,
  X,
  PencilRuler,
  TrendingUp,
  Zap,
  Sun,
  Moon,
  MessageCircle,
  Pipette,
  Eye,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Specialized Components
import DashboardView from './components/Dashboard';
import ProjectsView from './components/Projects';
import InventoryView from './components/Inventory';
import SiteVisionView from './components/SiteVision';
import BOQEstimatorView from './components/BOQEstimator';
import AIAssistantView from './components/AIAssistant';
import UnitCalculatorView from './components/UnitCalculator';
import DrawingCADView from './components/DrawingCAD';
import StructuralLabView from './components/StructuralLab';
import ProjectBoardView from './components/ProjectBoard';
import MaterialEstimatorView from './components/MaterialEstimator';
import TeamChatView from './components/TeamChat';
import RoleSelection from './components/RoleSelection';
import LoginView from './components/LoginView';
import EquipmentHubView from './components/EquipmentHub';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [lang, setLang] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const t = translations[lang];

  useEffect(() => {
    if (!darkMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firebase connection issue detected.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRoles(data.roles || []);
          setLang(data.language || 'en');
        }
      } else {
        setRoles([]);
        setLang('en');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#000814] hero-gradient relative overflow-hidden">
        <div className="scanline" />
        <div className="flex flex-col items-center gap-12 relative z-10">
           <div className="relative">
              <div className="w-32 h-32 border-4 border-brand-accent/10 rounded-full animate-spin border-t-brand-accent shadow-[0_0_50px_rgba(255,214,10,0.1)]"></div>
              <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-accent animate-pulse" size={48} />
           </div>
           <div className="space-y-4 text-center">
             <div className="font-mono text-[10px] animate-pulse uppercase tracking-[1em] text-brand-accent font-black">Establishing Industrial Link</div>
             <div className="font-mono text-[8px] uppercase tracking-[0.5em] text-white/20">Civil-OS Advanced v3.1 // System_Sync_Active</div>
           </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView lang={lang} />;
  }

  // Onboarding check
  if (roles.length === 0) {
    return <RoleSelection onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="h-screen flex bg-[#000814] overflow-hidden relative hero-gradient">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-[#001233]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-[60] shadow-2xl [.light-mode_&]:bg-white/80 [.light-mode_&]:border-blue-500/10 transition-colors">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-3.5 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl active:scale-90 transition-all shadow-lg"
        >
          {isSidebarOpen ? <X size={20} className="text-brand-accent" /> : <Menu size={20} className="text-brand-accent" />}
        </button>
        <h2 className="font-serif italic text-2xl tracking-tighter gradient-text">Civil-OS <span className="text-black bg-brand-accent px-1.5 rounded-[2px] text-[8px] not-italic font-mono animate-pulse align-top font-black ml-1">PRO</span></h2>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-500 w-full lg:w-80 border-r border-brand-accent/10 flex flex-col bg-[#000d23] shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : (lang === 'en' ? '-translate-x-full' : 'translate-x-full')}
        [.light-mode_&]:bg-white [.light-mode_&]:border-blue-500/10
      `}>
        <div className="p-10 border-b border-brand-accent/10 hidden lg:block relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-accent/10 transition-all" />
          <h2 className="font-serif italic text-4xl tracking-tighter text-white font-black border-l-4 border-brand-accent pl-4 relative z-10">{t.title}</h2>
          <div className="flex flex-wrap gap-2 mt-4 ml-4 relative z-10">
            {roles.map(r => (
              <span key={r} className="font-mono text-[8px] uppercase bg-black/40 text-brand-accent px-2.5 py-1 rounded border border-brand-accent/20 tracking-widest font-black shadow-lg">{r}</span>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-24 lg:pt-6 space-y-1">
          <NavItem 
            to="/dashboard"
            active={location.pathname === '/dashboard'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<BarChart3 size={20} />} 
            label={t.overview} 
          />
          <NavItem 
            to="/project-board"
            active={location.pathname === '/project-board'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<TrendingUp size={20} />} 
            label={t.projectBoard} 
          />
          <NavItem 
            to="/chat"
            active={location.pathname === '/chat'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<MessageCircle size={20} />} 
            label={t.teamChat} 
          />
          <NavItem 
            to="/equipment"
            active={location.pathname === '/equipment'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<Truck size={20} />} 
            label="Equipment Hub" 
          />
          <NavItem 
            to="/cad"
            active={location.pathname === '/cad'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<PencilRuler size={20} />} 
            label={t.cadDrawing} 
          />
          <NavItem 
            to="/structural-lab"
            active={location.pathname === '/structural-lab'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<Zap size={20} />} 
            label={t.structuralLab} 
          />
          <NavItem 
            to="/material-estimator"
            active={location.pathname === '/material-estimator'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<Pipette size={20} />} 
            label={t.materialEst} 
          />
          <NavItem 
            to="/boq"
            active={location.pathname === '/boq'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<ClipboardList size={20} />} 
            label="AI BOQ" 
          />
          <NavItem 
            to="/projects"
            active={location.pathname === '/projects'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<HardHat size={20} />} 
            label={t.projects} 
          />
          <NavItem 
            to="/inventory"
            active={location.pathname === '/inventory'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<Warehouse size={20} />} 
            label={t.inventory} 
          />
          <NavItem 
            to="/vision"
            active={location.pathname === '/vision'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<Eye size={20} />} 
            label={t.vision} 
          />
          <NavItem 
            to="/calculator"
            active={location.pathname === '/calculator'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<CalculatorIcon size={20} />} 
            label={t.calculator} 
          />
          <NavItem 
            to="/assistant"
            active={location.pathname === '/assistant'} 
            onClick={() => setIsSidebarOpen(false)} 
            icon={<MessageSquare size={20} />} 
            label={t.assistant} 
          />
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20 text-brand-secondary [.light-mode_&]:bg-sky-50 [.light-mode_&]:border-sky-500/10">
            <div className="flex flex-col gap-2 mb-4">
               <button 
                 onClick={() => setDarkMode(!darkMode)}
                 className={`flex-1 py-4 border rounded-2xl flex items-center justify-center gap-3 transition-all font-mono text-[10px] font-black tracking-widest shadow-lg ${
                   darkMode 
                   ? 'bg-brand-accent text-black border-brand-accent shadow-brand-accent/20' 
                   : 'bg-white text-slate-600 border-sky-500/20 shadow-sky-900/5'
                 }`}
               >
                 {darkMode ? <Sun size={14} className="animate-spin-slow" /> : <Moon size={14} />}
                 {darkMode ? 'SOLAR_LINK' : 'LUNAR_SYNC'}
               </button>
               <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                 <span className="font-mono text-[8px] uppercase tracking-widest opacity-40">Network_Load</span>
                 <div className="flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`w-1 h-3 rounded-full ${i < 3 ? 'bg-brand-accent animate-pulse' : 'bg-white/10'}`}></div>
                   ))}
                 </div>
               </div>
            </div>
          <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 [.light-mode_&]:bg-white [.light-mode_&]:border-sky-500/20">
            <img src={user.photoURL || undefined} className="w-12 h-12 rounded-full border-2 border-brand-accent shadow-[0_0_15px_rgba(249,115,22,0.3)]" alt="User" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs truncate uppercase tracking-widest font-bold text-white [.light-mode_&]:text-slate-900">{user.displayName}</p>
              <p className="font-mono text-[10px] opacity-40 uppercase truncate [.light-mode_&]:text-slate-500">{roles.join(' + ')}</p>
            </div>
            <button 
              onClick={() => {
                setRoles([]);
                navigate('/');
              }}
              className="p-2 hover:bg-white/10 rounded-lg text-brand-accent transition-colors"
              title="Switch Persona"
            >
              <PencilRuler size={14} />
            </button>
          </div>
          <button 
            onClick={logout}
            className="w-full h-14 flex items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-brand-accent hover:text-white transition-all rounded-xl border border-white/10 [.light-mode_&]:bg-white [.light-mode_&]:text-slate-600 [.light-mode_&]:border-sky-500/20 shadow-xl shadow-black/10 [.light-mode_&]:shadow-sky-900/5"
          >
            System Shutdown
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-16 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 md:p-12 lg:p-16 min-h-full"
          >
            <Routes>
              <Route path="/dashboard" element={<DashboardView lang={lang} />} />
              <Route path="/project-board" element={<ProjectBoardView lang={lang} />} />
              <Route path="/cad" element={<DrawingCADView lang={lang} />} />
              <Route path="/structural-lab" element={<StructuralLabView lang={lang} />} />
              <Route path="/material-estimator" element={<MaterialEstimatorView lang={lang} />} />
              <Route path="/chat" element={<TeamChatView lang={lang} />} />
              <Route path="/projects" element={<ProjectsView />} />
              <Route path="/inventory" element={<InventoryView />} />
              <Route path="/vision" element={<SiteVisionView />} />
              <Route path="/boq" element={<BOQEstimatorView lang={lang} />} />
              <Route path="/calculator" element={<UnitCalculatorView lang={lang} />} />
              <Route path="/assistant" element={<AIAssistantView />} />
              <Route path="/equipment" element={<EquipmentHubView />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// UI Parts
function NavItem({ to, active, onClick, icon, label }: { to: string, active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <Link 
      to={to}
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-8 py-5 font-mono text-[11px] uppercase tracking-[0.2em] transition-all group relative overflow-hidden ${
        active 
          ? 'text-white [.light-mode_&]:text-brand-accent' 
          : 'text-slate-300 hover:text-white [.light-mode_&]:text-slate-500 [.light-mode_&]:hover:text-brand-accent'
      }`}
    >
      {active && (
        <>
          <motion.div 
            layoutId="activeNav" 
            className="absolute left-0 w-1.5 h-6 bg-brand-accent shadow-[0_0_15px_rgba(0,180,216,1)]"
          />
          <motion.div 
            initial={{ y: '-100%' }}
            animate={{ y: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-accent/5 to-transparent pointer-events-none"
          />
        </>
      )}
      <span className={active ? 'text-brand-accent scale-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform'}>{icon}</span>
      <span className={active ? 'font-black tracking-[0.25em]' : 'font-medium'}>{label}</span>
    </Link>
  );
}

function CalculatorIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="16" y1="14" x2="16" y2="14.01" />
      <line x1="12" y1="14" x2="12" y2="14.01" />
      <line x1="8" y1="14" x2="8" y2="14.01" />
      <line x1="16" y1="18" x2="16" y2="18.01" />
      <line x1="12" y1="18" x2="12" y2="18.01" />
      <line x1="8" y1="18" x2="8" y2="18.01" />
    </svg>
  );
}

