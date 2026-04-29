import React, { useState } from 'react';
import { X, CreditCard, Save, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [cardName, setCardName] = useState('');
  const [closingDay, setClosingDay] = useState('1');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/CreditCard', {
        cardName,
        closingDay: parseInt(closingDay)
      });
      onSuccess();
      onClose();
      setCardName('');
    } catch (error) {
      console.error("Kart ekleme hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-black flex items-center gap-2">
            <CreditCard size={24} /> Yeni Kart Tanımla
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kart Adı</label>
            <input 
              type="text" 
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all"
              placeholder="Örn: Bonus Kart"
              required
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ekstre Kesim Günü</label>
            <select 
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-600 transition-all"
            >
              {[...Array(31)].map((_, i) => (
                <option key={i+1} value={i+1}>{i+1}. Gün</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Kartı Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCardModal;