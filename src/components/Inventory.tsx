import { useState, useEffect, FormEvent } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Warehouse, Plus, Trash2, Package, TrendingDown, TrendingUp, Search, X } from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'kg', unitCost: '' });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'projects', 'DEFAULT', 'inventory'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setItems(docs);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) return;

    try {
      await addDoc(collection(db, 'projects', 'DEFAULT', 'inventory'), {
        ...newItem,
        quantity: Number(newItem.quantity),
        unitCost: Number(newItem.unitCost) || 0,
        projectId: 'DEFAULT',
        createdAt: serverTimestamp()
      });
      setNewItem({ name: '', quantity: '', unit: 'kg', unitCost: '' });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', 'DEFAULT', 'inventory', id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

  return (
    <div className="space-y-12 pb-20 relative industrial-grid min-h-screen px-2">
      <div className="scanline" />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-10 gap-6 relative">
        <div className="absolute top-0 left-0 w-32 h-1 caution-tape opacity-20" />
        <div className="space-y-4">
          <h2 className="font-serif italic text-6xl text-brand-primary tracking-tighter gradient-text">Stock Control</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40">Digital Supply Ledger // Neural Resource Audit</p>
        </div>
        
        <div className="flex gap-12 items-center w-full md:w-auto">
          <div className="space-y-2 p-6 bg-slate-900 rounded-2xl shadow-xl border border-white/5 group [.light-mode_&]:bg-white [.light-mode_&]:border-sky-500/10">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-40 group-hover:text-brand-accent transition-colors font-bold">Total Ledger Value</p>
            <div className="font-mono text-4xl tracking-tighter text-white font-black [.light-mode_&]:text-slate-900">
              <span className="text-xl mr-2 text-brand-accent font-serif italic">Rs.</span>
              {totalValue.toLocaleString()}
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="h-16 w-16 bg-gradient-to-br from-brand-primary to-slate-800 text-brand-secondary flex items-center justify-center hover:from-brand-accent hover:to-orange-600 transition-all shadow-2xl rounded-2xl group active:scale-90"
          >
            {isAdding ? <X size={28} className="group-hover:rotate-90 transition-transform" /> : <Plus size={28} className="group-hover:rotate-90 transition-transform" />}
          </button>
        </div>
      </header>

      {isAdding && (
        <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-8 p-12 bg-[#001233]/80 backdrop-blur-3xl rounded-[2rem] border border-brand-accent/20 shadow-2xl relative overflow-hidden [.light-mode_&]:bg-white [.light-mode_&]:border-sky-500/10">
          <div className="absolute top-0 left-0 w-full h-1 caution-tape opacity-30"></div>
          <div className="space-y-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-brand-accent font-black">Material Designation</label>
            <input 
              required
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
              className="w-full p-5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs outline-none focus:border-brand-accent focus:bg-black/60 transition-all shadow-inner text-white [.light-mode_&]:bg-sky-50 [.light-mode_&]:text-slate-900 [.light-mode_&]:border-sky-500/10"
              placeholder="e.g. PORTLAND_CEMENT_P1"
            />
          </div>
          <div className="space-y-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-brand-accent font-black">Quantity_Metric</label>
            <input 
              required
              type="number"
              value={newItem.quantity}
              onChange={e => setNewItem({...newItem, quantity: e.target.value})}
              className="w-full p-5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs outline-none focus:border-brand-accent focus:bg-black/60 transition-all shadow-inner text-white font-bold"
            />
          </div>
          <div className="space-y-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-brand-accent font-black">Standard_Unit</label>
            <select 
              value={newItem.unit}
              onChange={e => setNewItem({...newItem, unit: e.target.value})}
              className="w-full p-5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs outline-none focus:border-brand-accent focus:bg-black/60 transition-all shadow-inner text-white font-bold appearance-none cursor-pointer"
            >
              <option value="kg">KILOGRAMS [kg]</option>
              <option value="ton">TONS [t]</option>
              <option value="bags">BAGS [pcs]</option>
              <option value="ft">FEET [ft]</option>
              <option value="sqft">SQ FT [sqft]</option>
            </select>
          </div>
          <button type="submit" className="h-[68px] mt-auto bg-brand-accent text-black font-mono text-[10px] uppercase tracking-widest font-black rounded-xl hover:brightness-110 transition-all shadow-xl active:translate-y-1 self-end">
            COMMIT_TO_LEDGER
          </button>
        </form>
      )}

      <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
        <div className="min-w-[800px] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden bg-slate-900/30 backdrop-blur-xl">
          <div className="grid grid-cols-12 gap-4 px-10 py-8 bg-black/60 border-b border-brand-accent/20 text-white uppercase font-mono text-[10px] tracking-[0.3em] font-black">
            <span className="col-span-1 text-center opacity-30 italic">NODE</span>
            <span className="col-span-4 flex items-center gap-3 text-brand-accent">Material_Spec <Search size={14} className="opacity-40"/></span>
            <span className="col-span-2 text-right opacity-60">Inventory_Lvl</span>
            <span className="col-span-1 text-center opacity-60">Unit</span>
            <span className="col-span-2 text-right opacity-60">Current_Val</span>
            <span className="col-span-2 text-center opacity-60">Protocol</span>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="py-24 text-center font-mono text-xs uppercase tracking-[0.5em] animate-pulse text-brand-accent">FETCHING_DATABASE_STREAM...</div>
            ) : items.length > 0 ? (
              items.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id} 
                  className="grid grid-cols-12 gap-4 px-10 py-8 data-row items-center group hover:bg-slate-50 transition-all"
                >
                  <span className="col-span-1 text-center font-mono text-[10px] opacity-40 tabular-nums font-bold"># {String(idx + 1).padStart(3, '0')}</span>
                  <div className="col-span-4 flex items-center gap-6">
                    <div className="p-4 bg-slate-950 text-white group-hover:bg-brand-accent group-hover:text-white transition-all rounded-2xl shadow-inner group-hover:shadow-brand-accent/30 group-hover:scale-110 [.light-mode_&]:bg-sky-50 [.light-mode_&]:text-slate-500">
                      <Package size={22} />
                    </div>
                    <span className="font-black tracking-tight text-base uppercase text-white group-hover:text-brand-accent transition-colors [.light-mode_&]:text-slate-900">{item.name}</span>
                  </div>
                  <span className="col-span-2 text-right font-mono text-3xl tracking-tighter tabular-nums font-black text-white [.light-mode_&]:text-slate-900">{item.quantity}</span>
                  <span className="col-span-1 text-center font-mono opacity-40 uppercase text-[10px] tracking-[0.3em] font-black group-hover:opacity-100 transition-opacity">{item.unit}</span>
                  <span className="col-span-2 text-right font-mono tabular-nums text-brand-accent font-black text-xl">
                    <span className="text-xs mr-1 opacity-40">Rs.</span>
                    {item.unitCost?.toLocaleString()}
                  </span>
                  <div className="col-span-2 flex justify-center">
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="p-5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-2xl group/btn opacity-0 group-hover:opacity-100 shadow-xl active:scale-90"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-40 text-center space-y-8 opacity-20 bg-slate-50">
                <Warehouse size={100} className="mx-auto text-brand-primary" />
                <p className="font-serif italic text-4xl font-black uppercase tracking-widest">SYSTEM_CACHE_EMPTY</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 pt-12 border-t border-brand-primary/10">
        <div className="p-4 border border-brand-primary/20 space-y-2 flex flex-col justify-between">
           <div className="flex justify-between">
             <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">Procurement Velocity</span>
             <TrendingUp size={14} className="text-slate-600" />
           </div>
           <p className="font-mono text-xl tabular-nums">--%</p>
        </div>
        <div className="p-4 border border-brand-primary/20 space-y-2 flex flex-col justify-between">
           <div className="flex justify-between">
             <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">Stock Loss Margin</span>
             <TrendingDown size={14} className="text-slate-600" />
           </div>
           <p className="font-mono text-xl tabular-nums">--%</p>
        </div>
        <div className="p-4 border border-brand-primary/20 space-y-2 flex flex-col justify-between">
           <div className="flex justify-between">
             <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">Supply Reliability</span>
             <TrendingUp size={14} className="text-slate-600" />
           </div>
           <p className="font-mono text-xl tabular-nums">--%</p>
        </div>
      </div>
    </div>
  );
}
