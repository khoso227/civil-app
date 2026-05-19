import { useState, FormEvent, ReactNode } from 'react';
import { 
  auth, 
  loginWithGoogle, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from '../lib/firebase';
import { translations, Language } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Mail, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  BrainCircuit, 
  ClipboardList, 
  Package, 
  MessageSquare,
  Eye,
  EyeOff,
  Fingerprint
} from 'lucide-react';

export default function LoginView({ lang = 'en' }: { lang?: Language }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // Manual Validation
    if (mode === 'signup' && !name.trim()) {
      setError('Pehle apna Poora Naam likhen.');
      return;
    }
    if (!email.trim()) {
      setError('Pehle apna Email Address likhen.');
      return;
    }
    if (mode !== 'forgot' && !password) {
      setError('Pehle apna Password likhen.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password kam se kam 6 characters ka hona chahiye.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage(t.resetSent);
      }
    } catch (err: any) {
      let friendlyError = err.message;
      if (err.code === 'auth/invalid-credential') {
        friendlyError = 'Email ya Password galat hai. Agar account nahi bana hua to "Create Account" par click karen.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'Ye Email pehle se register hai. Login karen.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'Password kam se kam 6 characters ka hona chahiye.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = 'Internet check karen aur dobara koshish karen.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'Email ka format sahi nahi hai.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Check if biometric is available
      if (window.PublicKeyCredential) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          // Simulated biometric success - In a real production app, 
          // this would involve WebAuthn challenge/response with a backend
          await new Promise(resolve => setTimeout(resolve, 1500));
          // If we had a saved biometric token/credentialId, we would login here
          // For this app, we show the mechanism
          if (email) {
            await signInWithEmailAndPassword(auth, email, 'biometric_simulated_success');
          } else {
            throw new Error('Pehle Email likhen, phir fingerprint use karen (First attempt login to link device).');
          }
        } else {
          throw new Error('Aapke device par Biometric authentication available nahi hai.');
        }
      } else {
        throw new Error('Aapka browser biometric support nahi karta.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#000814] p-8 overflow-y-auto hero-gradient">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <h1 className="font-serif italic text-6xl md:text-8xl tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,214,10,0.3)]">
            {t.title}
          </h1>
          <p className="font-mono text-[10px] md:text-xs uppercase text-brand-accent font-black tracking-[0.4em] leading-relaxed max-w-xs mx-auto">
            {t.subtitle}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'forgot' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'forgot' ? 20 : -20 }}
            className="bg-[#001d3d]/80 backdrop-blur-3xl border border-brand-accent/20 p-8 shadow-2xl rounded-3xl space-y-6"
          >
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] font-black text-brand-accent">
              {mode === 'login' ? t.login : mode === 'signup' ? t.signup : t.forgotPassword}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4 text-left" noValidate>
              {mode === 'signup' && (
                <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-brand-accent font-black ml-2">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full h-14 bg-black/40 border border-white/10 px-12 rounded-xl font-mono text-sm focus:border-brand-accent text-white outline-none transition-all"
                      placeholder="Ali Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <ArrowLeft size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent scale-x-[-1]" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-brand-accent font-black ml-2">{t.email}</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 bg-black/40 border border-white/10 px-12 rounded-xl font-mono text-sm focus:border-brand-accent text-white outline-none transition-all"
                    placeholder="ali@gmail.com"
                  />
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase text-brand-accent font-black ml-2">{t.password}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 bg-black/40 border border-white/10 px-12 rounded-xl font-mono text-sm focus:border-brand-accent text-white outline-none transition-all pr-12"
                      placeholder="••••••••"
                    />
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-brand-accent transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col gap-2 p-4 bg-red-950/40 text-red-400 rounded-xl text-[10px] font-sans border border-red-500/20 shadow-sm animate-shake">
                  <div className="flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[11px]">
                    <AlertCircle size={14} />
                    Auth Warning
                  </div>
                  <p className="font-medium leading-relaxed">{error}</p>
                </div>
              )}

              {message && (
                <div className="flex items-center gap-2 p-3 bg-brand-success/10 text-brand-success rounded-lg text-xs font-mono">
                  <CheckCircle2 size={14} />
                  {message}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full h-16 bg-brand-accent text-black font-mono text-sm uppercase tracking-[0.2em] font-black rounded-2xl shadow-xl shadow-brand-accent/20 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : mode === 'forgot' ? t.sendReset : mode === 'login' ? t.login : t.signup}
              </button>
            </form>

            <div className="space-y-4">
              {mode === 'login' && (
                <>
                  <button 
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-mono uppercase tracking-widest text-brand-accent font-black hover:underline transition-colors"
                  >
                    {t.forgotPassword}?
                  </button>
                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="font-mono text-[10px] uppercase text-white/20">or sync</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  <button 
                    onClick={loginWithGoogle}
                    className="w-full h-14 bg-white/5 border-2 border-white/5 font-mono text-[10px] uppercase tracking-[0.2em] text-white font-black hover:bg-white/10 transition-all flex items-center justify-center gap-4 rounded-xl shadow-sm"
                  >
                    Google Sync
                    <ChevronRight size={14} className="text-brand-accent" />
                  </button>

                  <button 
                    type="button"
                    onClick={handleBiometricLogin}
                    className="w-full h-14 bg-brand-accent shadow-[0_0_30px_rgba(255,214,10,0.2)] border-2 border-brand-accent/20 font-mono text-[10px] uppercase tracking-[0.2em] text-black font-black hover:brightness-110 transition-all flex items-center justify-center gap-4 rounded-xl shadow-xl"
                  >
                    <Fingerprint size={18} className="text-white animate-pulse" />
                    Biometric Login
                  </button>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                    {t.noAccount} {' '}
                    <button 
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); }} 
                      className="text-brand-accent font-black hover:underline px-2 py-1 bg-brand-accent/10 rounded-lg transition-all"
                    >
                      {t.signup}
                    </button>
                  </p>
                </>
              )}

              {mode === 'signup' && (
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  {t.hasAccount} {' '}
                  <button onClick={() => setMode('login')} className="text-brand-accent font-black hover:underline">{t.login}</button>
                </p>
              )}

              {mode === 'forgot' && (
                <button 
                  onClick={() => setMode('login')}
                  className="flex items-center justify-center gap-2 w-full text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity text-white"
                >
                  <ArrowLeft size={12} />
                  {t.backToLogin}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="pt-10 grid grid-cols-2 gap-4 text-left">
          <FeatureSnippet icon={<BrainCircuit size={18} className="text-brand-accent"/>} title={t.vision} text="Safety analysis" />
          <FeatureSnippet icon={<ClipboardList size={18} className="text-brand-accent"/>} title={t.projects} text="Site progress" />
          <FeatureSnippet icon={<Package size={18} className="text-brand-accent"/>} title={t.inventory} text="Material logs" />
          <FeatureSnippet icon={<MessageSquare size={18} className="text-brand-accent"/>} title={t.assistant} text="Chat support" />
        </div>
      </motion.div>
    </div>
  );
}

function FeatureSnippet({ icon, title, text }: { icon: ReactNode, title: string, text: string }) {
  return (
    <div className="p-4 border border-white/5 bg-white/5 backdrop-blur-md shadow-sm space-y-1 rounded-2xl">
      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest font-black text-brand-accent">
        {icon}
        {title}
      </div>
      <p className="text-[10px] text-white/40 leading-tight">{text}</p>
    </div>
  );
}
