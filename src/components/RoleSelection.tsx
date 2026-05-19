import { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { HardHat, Briefcase, Ruler, Construction, Check, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import { translations, Language } from '../lib/i18n';

const ROLES = [
  { id: 'Admin', label: 'Admin', icon: <Briefcase />, desc: 'Full system oversight' },
  { id: 'Owner', label: 'Owner', icon: <Construction />, desc: 'Primary property stakeholder' },
  { id: 'User', label: 'User', icon: <HardHat />, desc: 'Standard platform access' },
];

export default function RoleSelection({ onComplete }: { onComplete: () => void }) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [lang, setLang] = useState<Language>('en');
  const [phone, setPhone] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const t = translations[lang];

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0 || !auth.currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        roles: selectedRoles,
        language: lang,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        phoneNumber: phone || null,
        recoveryEmail: recoveryEmail || null,
        updatedAt: serverTimestamp()
      });
      onComplete();
    } catch (error) {
      console.error("Profile save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full bg-slate-800 border border-slate-700 p-10 shadow-2xl space-y-10 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-accent"></div>
        
        <div className="text-center space-y-4">
          <h1 className="font-serif italic text-5xl text-white">{t.onboarding}</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">{t.multiRoleNote}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-slate-300 border-b border-slate-700 pb-3">{t.selectRoles}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`p-6 border-2 flex flex-col items-center text-center gap-3 transition-all rounded-xl ${
                    selectedRoles.includes(role.id) 
                      ? 'border-brand-accent bg-brand-accent/10' 
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                  }`}
                >
                  <div className={`p-4 rounded-full transition-colors ${selectedRoles.includes(role.id) ? 'bg-brand-accent text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
                    {role.icon}
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest font-bold text-white">{role.label}</p>
                    <p className="text-[10px] text-slate-500 mt-2">{role.desc}</p>
                  </div>
                  {selectedRoles.includes(role.id) && <motion.div layoutId="check" className="text-brand-accent"><Check size={20} /></motion.div>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-slate-300 border-b border-slate-700 pb-3">{t.selectLang}</h3>
            <div className="flex flex-col gap-3">
              {(['en', 'ur', 'sd'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`p-4 border font-mono text-[11px] uppercase tracking-widest flex items-center justify-between rounded-lg transition-all ${
                    lang === l 
                      ? 'border-brand-accent bg-brand-accent text-white' 
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {l === 'en' ? 'English' : l === 'ur' ? 'اردو' : 'سنڌي'}
                  {lang === l && <Languages size={14} />}
                </button>
              ))}
            </div>

            <div className="pt-6 space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-slate-300 border-b border-slate-700 pb-3">Recovery Settings (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase text-slate-500 tracking-tighter">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 XXX XXXXXXX"
                    className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-mono text-sm focus:border-brand-accent outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase text-slate-500 tracking-tighter">Recovery Email</label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="backup@email.com"
                    className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-mono text-sm focus:border-brand-accent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-10">
              <button
                disabled={selectedRoles.length === 0 || saving}
                onClick={handleSave}
                className="w-full h-16 bg-brand-accent text-white font-mono text-sm uppercase tracking-[0.2em] font-bold rounded-xl shadow-lg hover:shadow-brand-accent/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-20 disabled:grayscale"
              >
                {saving ? 'Syncing...' : t.confirm}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
