import React, { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, Loader2, Wallet, ChevronDown, Trash2, Edit3, Save } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface IncomeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const IncomeDetailsModal: React.FC<IncomeDetailsModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // KATEGORİ LİSTESİ STATE'İ (YENİ EKLENDİ)
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);

  // SATIRIÇI DÜZENLEME STATELERİ
  const [editId, setEditId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>(''); // <--- Kategori ID'si için

  const fetchIncomeReport = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/Transaction/income-report?month=${selectedMonth}&year=${selectedYear}`
      );
      setIncomes(response.data);
      setEditId(null);
    } catch (error) {
      console.error("Rapor verileri yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIncomeReport();
      // Modal açıldığında ana gelir kategorilerini de çekiyoruz ki dropdown dolsun
      axiosInstance.get('/api/Category/main?type=0')
        .then(res => setIncomeCategories(res.data))
        .catch(err => console.error("Kategoriler çekilemedi:", err));
    }
  }, [isOpen, selectedMonth, selectedYear]);

  
const handleDelete = async (id: number) => {
  if (!window.confirm("Bu gelir kaydını silmek istediğine emin misin?")) return;
  try {
    await axiosInstance.delete(`/api/Transaction/income/${id}`); 
    
    setIncomes(prev => prev.filter(item => item.id !== id));
    
    if (onRefresh) onRefresh(); 
  } catch (error) {
    console.error("Silme hatası:", error);
    alert("Silme işlemi başarısız. Route hatası olabilir.");
  }
};

  // DÜZENLEME FORMUNU AÇ
  const startEdit = (item: any) => {
    setEditId(item.id);
    setEditAmount(item.amount.toString());
    setEditDesc(item.description || '');
    setEditCategoryId(item.categoryId?.toString() || ''); // <--- Mevcut kategoriyi seçili yap
  };

  // YAPILAN DÜZENLEMEYİ KAYDET
  const saveEdit = async (item: any) => {
    if (!editCategoryId) {
      alert("Lütfen bir kategori seçin.");
      return;
    }

    try {
      await axiosInstance.put(`/api/Transaction/income/${item.id}`, {
        amount: parseFloat(editAmount),
        description: editDesc,
        categoryId: parseInt(editCategoryId),
        isRecurring: item.isRecurring,
        date: item.rawDate
      });
      setEditId(null);
      fetchIncomeReport(); // Modal içindeki listeyi yenile
      
      if (onRefresh) onRefresh(); 
    } catch (error) {
      alert("Güncelleme sırasında hata oluştu.");
    }
  };

  if (!isOpen) return null;

  const totalAmount = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border-4 border-slate-50 flex flex-col max-h-[90vh]">
        
        {/* HEADER & DÖNEM SEÇİCİ */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gelir Yönetimi</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Kayıtları Düzenle veya Sil</p>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:text-rose-500 transition-all">
              <X size={24}/>
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border-2 border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 flex-1 relative">
              <Calendar className="text-blue-500 ml-2" size={20} />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full bg-transparent font-black text-slate-700 outline-none cursor-pointer appearance-none"
              >
                {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2 text-slate-300 pointer-events-none" size={16} />
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-3 w-32 relative">
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-transparent font-black text-blue-600 outline-none cursor-pointer appearance-none"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2 text-blue-200 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* LİSTE ALANI */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar bg-slate-50/30">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
          ) : incomes.length > 0 ? (
            incomes.map((item) => (
              
              // HIZLI DÜZENLEME FORMU
              editId === item.id ? (
                <div key={item.id} className="p-5 bg-blue-50 border-2 border-blue-200 rounded-[2rem] flex flex-col gap-4 animate-in fade-in">
                  <div className="flex flex-col md:flex-row gap-3">
                    
                    {/* 1. Tutar */}
                    <div className="relative flex-[1]">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-400">₺</span>
                      <input 
                        type="number" 
                        className="w-full p-3 pl-8 rounded-2xl border-2 border-blue-100 font-black text-blue-700 outline-none focus:border-blue-400 bg-white" 
                        value={editAmount} 
                        onChange={(e) => setEditAmount(e.target.value)} 
                      />
                    </div>

                    {/* 2. Kategori Seçici (YENİ EKLENDİ) */}
                    <div className="relative flex-[1.5]">
                      <select 
                        className="w-full p-3 rounded-2xl border-2 border-blue-100 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 bg-white appearance-none cursor-pointer"
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                      >
                        <option value="">Kategori Seç</option>
                        {incomeCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" size={16} />
                    </div>

                    {/* 3. Açıklama */}
                    <input 
                      type="text" 
                      className="w-full md:flex-[1.5] p-3 rounded-2xl border-2 border-blue-100 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 bg-white" 
                      value={editDesc} 
                      onChange={(e) => setEditDesc(e.target.value)} 
                      placeholder="Açıklama"
                    />

                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditId(null)} className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors">
                      İptal
                    </button>
                    <button onClick={() => saveEdit(item)} className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-200">
                      <Save size={14} /> Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                
                // NORMAL GÖRÜNÜM
                <div key={item.id} className="p-5 bg-white border-2 border-slate-100 rounded-[2rem] flex items-center justify-between hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                      style={{ backgroundColor: item.categoryColor || '#10b981' }}
                    >
                      <TrendingUp size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-black text-slate-800 text-sm truncate">{item.categoryName}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.date} {item.time && `• ${item.time}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-lg font-black text-emerald-600">+ ₺{item.amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 italic truncate max-w-[120px]">
                        {item.description || 'Gelir Kaydı'}
                      </p>
                    </div>
                    
                    {/* MOBİL İÇİN KÜÇÜK TUTAR GÖSTERİMİ */}
                    <div className="text-right sm:hidden">
                       <p className="text-md font-black text-emerald-600">₺{item.amount}</p>
                    </div>

                    <div className="flex gap-2 border-l pl-4 border-slate-100 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Kalemi Düzenle"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="text-center py-20 flex flex-col items-center">
              <Wallet className="mb-4 text-slate-200" size={64} />
              <p className="text-slate-400 font-bold italic">Bu dönemde kayıt yok.</p>
            </div>
          )}
        </div>

        {/* TOPLAM BAR */}
        <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
          <span className="text-sm font-bold opacity-80">{incomes.length} Kayıt</span>
          <span className="text-3xl font-black">₺{totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeDetailsModal;