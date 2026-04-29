import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  onSuccess: () => void;
}

const EditCardModal: React.FC<EditCardModalProps> = ({ isOpen, onClose, card, onSuccess }) => {
  const [cardName, setCardName] = useState('');
  const [closingDay, setClosingDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (card) {
      setCardName(card.cardName);
      setClosingDay(card.closingDay);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  // GÜNCELLEME İŞLEMİ
  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axiosInstance.put(`/CreditCard/${card.id}`, {
        cardName,
        closingDay: parseInt(closingDay.toString())
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Güncelleme hatası");
    } finally {
      setLoading(false);
    }
  };

  // SİLME İŞLEMİ
  const handleDelete = async () => {
    if (!window.confirm(`"${cardName}" kartını silmek istediğine emin misin? Bu işlem karta bağlı tüm harcamaları da etkileyebilir.`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/CreditCard/${card.id}`);
      onSuccess(); // Dashboard'u yenile
      onClose();   // Modalı kapat
    } catch (error) {
      console.error("Silme hatası");
      alert("Kart silinirken bir hata oluştu.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-xl tracking-tight">Kart Ayarları</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* INPUTLAR */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kart Adı</label>
            <input 
              type="text" 
              value={cardName} 
              onChange={(e) => setCardName(e.target.value)} 
              className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hesap Kesim Günü</label>
            <select 
              value={closingDay} 
              onChange={(e) => setClosingDay(parseInt(e.target.value))} 
              className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {[...Array(31)].map((_, i) => (
                <option key={i+1} value={i+1}>Her Ayın {i+1}. Günü</option>
              ))}
            </select>
          </div>
        </div>

        {/* AKSİYON BUTONLARI */}
        <div className="space-y-3 pt-2">
          <button 
            onClick={handleUpdate} 
            disabled={loading || deleteLoading} 
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            DEĞİŞİKLİKLERİ KAYDET
          </button>

          <button 
            onClick={handleDelete} 
            disabled={loading || deleteLoading} 
            className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {deleteLoading ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
            KARTI SİSTEMDEN SİL
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditCardModal;