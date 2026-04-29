import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Wallet, 
  Receipt, 
  Loader2, 
  Calendar, 
  Trash2, 
  Search,
  TrendingDown,
  RefreshCw,
  Filter
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const CashExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // FİLTRE STATE'İ - Default: 1 Ay
  const [filterRange, setFilterRange] = useState<'1w' | '1m' | '3m' | '6m' | '12m' | 'all'>('1m');

  const fetchCashExpenses = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/Transaction/cash-expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error("Nakit harcamalar yüklenemedi", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashExpenses();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bu harcamayı silmek istediğine emin misin?")) return;
    try {
      await axiosInstance.delete(`/api/Transaction/expense/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      alert("Silme işlemi başarısız.");
    }
  };

  // TARİH FİLTRELEME MANTIĞI
  const getFilteredData = () => {
    const now = new Date();
    
    // Önce tarih aralığına göre filtrele
    let filtered = expenses.filter(item => {
      const itemDate = new Date(item.date);
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filterRange === '1w') return diffDays <= 7;
      if (filterRange === '1m') return diffDays <= 30;
      if (filterRange === '3m') return diffDays <= 90;
      if (filterRange === '6m') return diffDays <= 180;
      if (filterRange === '12m') return diffDays <= 365;
      return true; // 'all' durumu
    });

    // Sonra arama terimine göre filtrele
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const currentDisplayData = getFilteredData();
  const totalDisplayAmount = currentDisplayData.reduce((sum, item) => sum + item.amount, 0);

  const filterOptions = [
    { id: '1w', label: '1 Hafta' },
    { id: '1m', label: '1 Ay' },
    { id: '3m', label: '3 Ay' },
    { id: '6m', label: '6 Ay' },
    { id: '12m', label: '1 Yıl' },
    { id: 'all', label: 'Hepsi' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 pb-32">
      
      {/* ÜST GEZİNTİ VE ARAMA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 font-black hover:text-blue-600 transition-all uppercase text-xs tracking-widest group w-fit"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-50 transition-colors border border-slate-100">
            <ArrowLeft size={18} />
          </div>
          Dashboard'a Dön
        </button>

        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm focus-within:border-blue-400 transition-all w-full md:w-80">
           <Search size={18} className="text-slate-300" />
           <input 
             type="text" 
             placeholder="Listede ara..." 
             className="outline-none text-sm font-bold text-slate-600 w-full"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* BAŞLIK VE ÖZET KARTI */}
      <div className="bg-white rounded-[3.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-6 bg-emerald-500 text-white rounded-[2.2rem] shadow-xl shadow-emerald-100">
            <Wallet size={35} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Nakit Harcamalar</h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-tighter flex items-center gap-2">
               <Calendar size={14} /> Seçili Dönem Dökümü
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-10 py-6 rounded-[2.5rem] border-2 border-slate-100 text-center md:text-right min-w-[240px]">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Dönem Toplamı</p>
           <p className="text-4xl font-black text-rose-600 tracking-tight">
             ₺{totalDisplayAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
           </p>
        </div>
      </div>

      {/* FİLTRE BUTONLARI (Pill Style) */}
      <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-2">
        <div className="flex items-center gap-2 px-4 border-r border-slate-100 mr-2 text-slate-400">
           <Filter size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">Dönem:</span>
        </div>
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilterRange(opt.id as any)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 ${
              filterRange === opt.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* HARCAMA LİSTESİ */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 size={50} className="animate-spin text-blue-500" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">Veriler Hazırlanıyor...</p>
          </div>
        ) : currentDisplayData.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {currentDisplayData.map((item: any) => (
              <div key={item.id} className="p-7 flex items-center justify-between hover:bg-blue-50/20 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.8rem] flex flex-col items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white transition-all shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-300">
                      {new Date(item.date).toLocaleDateString('tr-TR', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black text-slate-600">
                      {new Date(item.date).getDate()}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-slate-800 text-lg">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.categoryColor || '#3b82f6' }}></div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          {item.categoryName}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-2xl font-black text-rose-600 tracking-tight">
                      ₺{item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                        <TrendingDown size={12} /> Nakit Çıkışı
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all md:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center space-y-6">
            <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                <Receipt size={48} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold italic">Bu dönemde nakit harcaman yok kanka.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashExpensesPage;