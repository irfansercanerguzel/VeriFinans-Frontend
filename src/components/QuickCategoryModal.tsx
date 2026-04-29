import React, { useState } from 'react';
import { X, Plus, Save, Loader2, MinusCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface QuickCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  onSuccess: () => void;
}

const QuickCategoryModal: React.FC<QuickCategoryModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  // Annenin girdiği kategorileri bir dizi olarak tutuyoruz
  const [categories, setCategories] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const isIncome = type === 'income';

  // Yeni alt kategori kutusu ekle
  const handleAddSub = () => {
    setCategories([...categories, '']);
  };

  // İlgili kutudaki yazıyı güncelle
  const handleChange = (index: number, value: string) => {
    const newCats = [...categories];
    newCats[index] = value;
    setCategories(newCats);
  };

  // İstenilen kutuyu sil (En baştaki silinemez)
  const handleRemove = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Boş kutuları filtrele
    const validNames = categories.filter(c => c.trim() !== '');
    if (validNames.length === 0) return;

    setLoading(true);
    try {
      await axiosInstance.post('/Category/chain', {
        names: validNames,
        type: isIncome ? 0 : 1
      });
      
      setCategories(['']); // Formu sıfırla
      onSuccess(); // Ana modalı güncelle
      onClose();   // Bu modalı kapat
    } catch (error) {
      console.error("Kategori eklenirken hata oluştu.", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden relative border-4 border-slate-50 animate-in zoom-in-95">
        
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className={`text-xl font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
              Yeni {isIncome ? 'Gelir' : 'Gider'} Yeri Ekle
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hiyerarşik Kategori Oluşturucu</p>
          </div>

          <div className="space-y-3 relative">
            {/* Sol taraftaki bağlantı çizgisi (Görsel şölen) */}
            {categories.length > 1 && (
              <div className="absolute left-[1.1rem] top-8 bottom-8 w-1 bg-slate-100 rounded-full z-0"></div>
            )}

            {categories.map((cat, index) => (
              <div key={index} className="flex items-center gap-2 relative z-10">
                {/* Ağaç yapısını gösteren ikon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {index + 1}
                </div>
                
                <input
                  type="text"
                  value={cat}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder={index === 0 ? "Ana Kategori (Örn: Araba)" : `Alt Kategori ${index}`}
                  className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl font-bold text-sm outline-none transition-all"
                  autoFocus={index === categories.length - 1}
                  required
                />

                {index > 0 && (
                  <button type="button" onClick={() => handleRemove(index)} className="text-rose-300 hover:text-rose-500 shrink-0">
                    <MinusCircle size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddSub}
            className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-bold rounded-2xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} /> Alt Kategori Ekle
          </button>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            } disabled:opacity-50`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            KATEGORİYİ OLUŞTUR
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickCategoryModal;