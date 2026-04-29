import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Loader2, RefreshCw, AlertCircle, Trash2 } from 'lucide-react'; // Trash2 eklendi
import axiosInstance from '../api/axiosInstance';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense'; 
  onSuccess: () => void;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ amount: 0, description: '' });
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'income' ? '/api/Transaction/recurring-incomes' : '/api/Transaction/recurring-expenses';
      const response = await axiosInstance.get(endpoint);
      setOrders(response.data);
    } catch (error) {
      console.error("Talimatlar çekilemedi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      setEditingId(null);
    }
  }, [isOpen, type]);

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setEditForm({
      amount: item.amount,
      description: item.description || ''
    });
  };

  // --- YENİ: SİLME FONKSİYONU ---
  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("Bu otomatik talimatı iptal edip silmek istediğinize emin misiniz?")) return;
    
    try {
      await axiosInstance.delete(`/api/Transaction/${type}/${id}`);
      fetchOrders(); // Listeyi yenile
      onSuccess(); // Dashboard'u yenile
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Silinirken bir hata oluştu.");
    }
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    try {
      const endpoint = type === 'income' ? `/api/Transaction/income/${id}` : `/api/Transaction/expense/${id}`;
      
      await axiosInstance.put(endpoint, {
        amount: parseFloat(editForm.amount.toString()),
        description: editForm.description,
        isRecurring: true 
      });

      setEditingId(null); 
      fetchOrders(); 
      onSuccess(); 
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative border-4 border-slate-50 flex flex-col max-h-[85vh]">
        
        <div className={`p-8 border-b border-slate-100 flex justify-between items-center ${type === 'income' ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
              Otomatik {type === 'income' ? 'Gelir' : 'Gider'} Talimatları
            </h2>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
              Her Ay Tekrarlanan İşlemler
            </p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
          ) : orders.length > 0 ? (
            orders.map((item) => (
              <div key={item.id} className="p-5 border-2 border-slate-100 rounded-[2rem] hover:border-blue-200 transition-all bg-white group">
                
                {/* DÜZENLEME MODU */}
                {editingId === item.id ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tutar (₺)</label>
                        <input 
                          type="number" 
                          value={editForm.amount} 
                          onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                          className="w-full p-3 bg-slate-50 border-2 border-blue-100 focus:border-blue-500 rounded-xl font-black text-lg outline-none"
                        />
                      </div>
                      <div className="flex-[2] space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Açıklama / Not</label>
                        <input 
                          type="text" 
                          value={editForm.description} 
                          onChange={e => setEditForm({...editForm, description: e.target.value})}
                          className="w-full p-3 bg-slate-50 border-2 border-blue-100 focus:border-blue-500 rounded-xl font-bold text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-100 gap-2">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all">
                        İptal
                      </button>
                      <button 
                        onClick={() => handleSave(item.id)} 
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} GÜNCELLE
                      </button>
                    </div>
                  </div>
                ) : (
                  /* NORMAL LİSTELEME GÖRÜNÜMÜ */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800">{item.description || 'İsimsiz Talimat'}</h4>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md mt-1 ${type === 'income' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                          Her Ay Otomatik
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className={`text-xl font-black ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₺{item.amount.toLocaleString()}
                      </span>
                      
                      {/* BUTONLAR (DÜZENLE VE SİL YANYANA) */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="text-[10px] font-black text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-blue-100 px-2 py-1 rounded-md"
                        >
                          <Edit2 size={12} /> DÜZENLE
                        </button>

                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-[10px] font-black text-rose-500 hover:text-white flex items-center gap-1 transition-colors bg-rose-50 hover:bg-rose-500 px-2 py-1 rounded-md"
                        >
                          <Trash2 size={12} /> SİL
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            ))
          ) : (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="text-slate-300" size={24} />
              </div>
              <p className="text-slate-400 font-bold">Burada henüz otomatik talimatın yok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;