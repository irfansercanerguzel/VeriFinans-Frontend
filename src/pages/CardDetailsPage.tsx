import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, ChevronDown, CreditCard, Receipt, 
  Loader2, Edit3, Trash2, Save, X, Lock 
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import FloatingAiBot from '../components/FloatingAiBot';

// KANKA RESİMLERİ BURAYA IMPORT EDİYORUZ
import axessImg from '../assets/axess.png';
import wingsImg from '../assets/wings.png';
import bonusImg from '../assets/Denizemekli.png';
import troyImg from '../assets/Deniztroy.png';
import worldImg from '../assets/world.jfif';
import maximumImg from '../assets/maximum.jfif';
import fenerImg from '../assets/Fener.png';

const CardDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState<number | string>('');
  const [selectedYear, setSelectedYear] = useState<number | string>('');

  const [editId, setEditId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');

  const getCardImage = (name: string) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('axess')) return axessImg;
    if (n.includes('wings')) return wingsImg;
    if (n.includes('bonus') || n.includes('emekli')) return bonusImg;
    if (n.includes('troy') || n.includes('deniz')) return troyImg;
    if (n.includes('world')) return worldImg;
    if (n.includes('maximum')) return maximumImg;
    if (n.includes('fener') || n.includes('fb')) return fenerImg;
    return wingsImg; 
  };

  const fetchStatement = async () => {
    setLoading(true);
    try {
      let url = `/Transaction/card-statement/${id}`;
      if (selectedMonth !== '' && selectedYear !== '') {
        url += `?month=${selectedMonth}&year=${selectedYear}`;
      }
      const res = await axiosInstance.get(url);
      setData(res.data);
      setEditId(null);
    } catch (err) {
      console.error("Ekstre yüklenemedi", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
    axiosInstance.get('/Category/main?type=1')
      .then(res => setExpenseCategories(res.data))
      .catch(err => console.error("Kategoriler çekilemedi", err));
  }, [id, selectedMonth, selectedYear]);

  const handleDelete = async (expenseId: number) => {
    if (!window.confirm("Bu işlemi silmek istediğine emin misin?")) return;
    try {
      await axiosInstance.delete(`/Transaction/expense/${expenseId}`);
      fetchStatement();
    } catch (error) {
      alert("Silme işlemi başarısız.");
    }
  };

  const startEdit = (item: any) => {
    setEditId(item.id);
    setEditAmount(item.amount.toString());
    setEditDesc(item.description || '');
    setEditCategoryId(item.categoryId?.toString() || '');
  };

  const saveEdit = async (item: any) => {
    try {
      await axiosInstance.put(`/Transaction/expense/${item.id}`, {
        amount: parseFloat(editAmount),
        description: editDesc,
        categoryId: parseInt(editCategoryId),
        creditCardId: parseInt(id!),
        date: item.rawDate,
        installmentCount: item.installmentCount || 1,
        isRecurring: item.isRecurring || false
      });
      setEditId(null);
      fetchStatement();
    } catch (error) {
      alert("Güncelleme sırasında hata oluştu.");
    }
  };

  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const years = [2024, 2025, 2026, 2027];
  const cardVisual = getCardImage(data?.cardName);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 pb-20 relative">
      
      {/* ÜST NAVİGASYON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-black hover:text-blue-600 transition-colors uppercase text-xs tracking-widest group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Dashboard'a Dön
        </button>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100">
          <div className="relative">
            <select 
              value={selectedMonth} 
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value !== '' && selectedYear === '') {
                  setSelectedYear(new Date().getFullYear());
                }
              }} 
              className="pl-4 pr-10 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-700 appearance-none outline-none cursor-pointer"
            >
              <option value="">🔥 Aktif Dönem</option>
              {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="pl-4 pr-10 py-2 bg-blue-50 border-none rounded-xl font-bold text-blue-600 appearance-none outline-none cursor-pointer"
            >
              <option value="">Oto</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300" />
          </div>
        </div>
      </div>

      {/* KART ÖZETİ (MOBİL İÇİN TAMAMEN YENİLENDİ) */}
      <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden h-auto md:h-64 flex flex-col md:flex-row items-center min-h-[auto]">
        <img src={cardVisual} alt="card-bg" className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" />
        
        {/* Mobilde karartmayı aşağıdan yukarıya, PC'de soldan sağa yapıyoruz ki yazılar okunsun */}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/70 md:via-black/40 to-transparent"></div>
        
        <div className="relative z-10 w-full space-y-6 md:space-y-8 py-4 md:py-0">
            <div className="flex items-center gap-4 md:gap-5">
                <div className="p-3 md:p-4 bg-white/10 rounded-[1.2rem] md:rounded-[1.8rem] backdrop-blur-xl border border-white/10 shrink-0">
                    <CreditCard size={28} className="text-white md:w-8 md:h-8" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tighter drop-shadow-lg truncate">{data?.cardName || 'Yükleniyor...'}</h1>
                    <p className="text-white/60 font-bold text-[9px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 italic truncate">Detaylı Ekstre Görüntüleme</p>
                </div>
            </div>

            {/* KANKA BAKIYORUZ: Mobilde 2 sütun (grid-cols-2), PC'de 3 sütun (md:grid-cols-3) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-white/10 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[9px] md:text-[10px] font-black text-white/50 uppercase mb-1 tracking-widest">Aralık</p>
                    <p className="text-xs md:text-base font-black truncate">{data?.periodStart} - {data?.periodEnd}</p>
                </div>
                <div className="bg-white/10 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <p className="text-[9px] md:text-[10px] font-black text-white/50 uppercase mb-1 tracking-widest">Kesim</p>
                    <p className="text-xs md:text-base font-black truncate">{data?.closingDay}. Gün</p>
                </div>
                {/* Mobilde iki sütunu birden kaplasın (col-span-2), PC'de tek sütun (md:col-span-1) */}
                <div className="col-span-2 md:col-span-1 bg-blue-600/90 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-blue-400/30 backdrop-blur-md flex flex-col justify-center">
                    <p className="text-[9px] md:text-[10px] font-black text-blue-100 uppercase mb-1 tracking-widest">Dönem Toplamı</p>
                    <p className="text-xl md:text-2xl font-black text-white truncate">₺{data?.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
      </div>

      {/* İŞLEM TABLOSU */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h2 className="text-xl font-black text-slate-800">Hareket Detayları</h2>
          <button className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
            <Download size={20}/>
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={45} className="animate-spin text-blue-500" />
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">Veriler Hazırlanıyor...</p>
            </div>
          ) : data?.items?.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih / Kategori</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Açıklama</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.items.map((item: any) => {
                  
                  const isPayment = item.categoryName?.toLowerCase().includes('ödeme') || item.amount < 0;
                  const isPaid = item.isPaid === true;

                  return editId === item.id ? (
                    <tr key={item.id} className="bg-blue-50/30 animate-in fade-in duration-200">
                      <td className="p-4">
                        <select 
                          value={editCategoryId} 
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="w-full p-3 rounded-xl border-2 border-blue-100 font-bold text-xs outline-none focus:border-blue-400 bg-white"
                        >
                          <option value="">Kategori</option>
                          {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={editDesc} 
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full p-3 rounded-xl border-2 border-blue-100 font-bold text-xs outline-none focus:border-blue-400 bg-white"
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          value={editAmount} 
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full p-3 rounded-xl border-2 border-blue-100 font-black text-xs text-right outline-none focus:border-blue-400 bg-white"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => saveEdit(item)} className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-100"><Save size={16}/></button>
                          <button onClick={() => setEditId(null)} className="p-2.5 bg-slate-200 text-slate-500 rounded-xl hover:bg-slate-300"><X size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} className={`transition-all group ${isPayment ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : isPaid ? 'bg-emerald-50/30 opacity-75 hover:opacity-100 hover:bg-emerald-50/60' : 'hover:bg-slate-50/80'}`}>
                      <td className="p-6 min-w-[140px]">
                        <div className="flex flex-col">
                            <span className={`font-black text-sm tracking-tight ${isPayment || isPaid ? 'text-emerald-700' : 'text-slate-700'}`}>{item.date}</span>
                            <div className="flex items-center gap-2 mt-1.5">
                                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: isPayment || isPaid ? '#10b981' : item.categoryColor }}></div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isPayment || isPaid ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {isPayment ? 'Kart Ödemesi' : item.categoryName}
                                </span>
                            </div>
                        </div>
                      </td>
                      <td className={`p-6 font-bold text-sm min-w-[180px] ${isPayment ? 'text-emerald-800' : isPaid ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                        {isPayment ? '✅ Dönem Borcu Ödemesi' : item.description}
                      </td>
                      <td className={`p-6 text-right font-black text-lg tracking-tight min-w-[120px] ${isPayment || isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <div className="flex items-center justify-end gap-2">
                          {isPaid && !isPayment && <span className="px-2 py-1 text-[9px] font-black text-white bg-emerald-500 rounded-full shadow-sm shadow-emerald-200 uppercase tracking-wider">ÖDENDİ</span>}
                          <span>{isPayment ? '-' : ''}₺{Math.abs(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        {!(isPayment || isPaid) ? (
                          <div className="flex justify-center gap-1 md:opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                              <button onClick={() => startEdit(item)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Düzenle"><Edit3 size={18}/></button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Sil"><Trash2 size={18}/></button>
                          </div>
                        ) : (
                           <div className="flex justify-center">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/60 text-emerald-600 rounded-lg" title={isPayment ? "Sistem ödemesi silinemez." : "Ödenmiş harcama silinemez veya düzenlenemez."}>
                                 <Lock size={12} className="opacity-70" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">{isPayment ? 'Sistem' : 'Kilitli'}</span>
                              </div>
                           </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-32 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-100">
                    <Receipt size={35} className="text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold italic">Bu dönemde bir işlem bulunamadı kanka.</p>
            </div>
          )}
        </div>
      </div>

      <FloatingAiBot pageContext="cardDetails" pageData={data} />

    </div>
  );
};

export default CardDetailsPage;