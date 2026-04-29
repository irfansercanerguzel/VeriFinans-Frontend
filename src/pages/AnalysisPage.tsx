import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronDown, ChevronRight, Zap, Target, Layers, CreditCard, TrendingDown } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import FloatingAiBot from '../components/FloatingAiBot';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [accountId, setAccountId] = useState<number | null>(null); 
  
  // İlk açılışta "none" ile başlatıyoruz (Yani Aktif Ekstre)
  const [filterMode, setFilterMode] = useState<'none' | 'month' | 'period'>('none');
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [period, setPeriod] = useState<number>(3); 

  const [cards, setCards] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [expandedTags, setExpandedTags] = useState<string[]>([]);

  useEffect(() => {
    axiosInstance.get('/CreditCard').then(res => setCards(res.data)).catch(err => console.log(err));
  }, []);

  const fetchDeepAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/Analysis/detailed?accountId=${accountId === null ? '' : accountId}`;
      
      // SADECE kullanıcı özel bir filtreye tıkladıysa parametre yolla
      if (filterMode === 'month') {
        url += `&month=${selectedMonth}&year=${selectedYear}`;
      } else if (filterMode === 'period') {
        url += `&periodType=${period}`;
      }

      const res = await axiosInstance.get(url);
      setAnalysisData(res.data);
    } catch (error) {
      console.error("Analiz verisi çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedMonth, selectedYear, period, accountId]);

  useEffect(() => {
    fetchDeepAnalysis();
  }, [fetchDeepAnalysis]);

  const toggleCategory = (catName: string) => {
    setExpandedCats(prev => prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]);
  };
  const toggleTag = (tagName: string) => {
    setExpandedTags(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
  };

  if (loading && !analysisData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">CFO Paneli Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-24 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. ÜST HEADER VE FİLTRELER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm backdrop-blur-md">
        
        <div className="flex items-center gap-4 w-full xl:w-auto shrink-0">
          <button onClick={() => navigate(-1)} className="p-3 bg-white text-slate-600 rounded-2xl border border-slate-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">CFO Paneli</h1>
            <p className="text-indigo-500 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg inline-block mt-1">
              {analysisData?.periodText || 'Hesaplanıyor...'}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4 items-stretch lg:items-center justify-end">
          
          <div className="relative w-full lg:w-80 shrink-0">
            <select 
              value={accountId === null ? '' : accountId} 
              onChange={(e) => setAccountId(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full p-4 pl-14 bg-white border-2 border-slate-200 rounded-[1.5rem] font-black text-slate-800 text-lg outline-none hover:border-indigo-300 focus:border-indigo-500 transition-colors cursor-pointer appearance-none shadow-sm"
            >
              <option value="">Tüm Hesaplar & Kartlar</option>
              <option value="0">💰 Sadece Nakit Cüzdan</option>
              {cards.map(c => <option key={c.id} value={c.id}>💳 {c.cardName}</option>)}
            </select>
            <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={24} />
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              {/* KANKA BAKIYORUZ: "Aktif Ekstre" tam olarak ComboBox'ın içine alındı! */}
              <div className="relative flex-1 sm:w-44">
                <select 
                  value={filterMode === 'none' ? 0 : (filterMode === 'month' ? selectedMonth : '')}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val === 0) {
                      setFilterMode('none');
                    } else {
                      setFilterMode('month');
                      setSelectedMonth(val);
                    }
                  }}
                  className={`w-full p-3.5 pl-4 bg-white border-2 rounded-[1.2rem] font-black outline-none transition-colors cursor-pointer appearance-none shadow-sm ${filterMode === 'month' || filterMode === 'none' ? 'border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                >
                  <option value={0}>🌟 Aktif Ekstre</option>
                  <option value="" disabled>--- Geçmiş Aylar ---</option>
                  {MONTHS.map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>

              <div className="relative w-28 shrink-0">
                <select 
                  value={selectedYear}
                  onChange={(e) => { 
                    setFilterMode('month'); 
                    setSelectedYear(Number(e.target.value)); 
                    // Yıl değişirse ve eğer Aktif Ekstre seçiliyse, otomatik olarak 1. aya (Ocak) geçirelim ki mantık hatası olmasın
                    if(filterMode === 'none') setSelectedMonth(1);
                  }}
                  className={`w-full p-3.5 pl-4 bg-white border-2 rounded-[1.2rem] font-bold outline-none cursor-pointer appearance-none shadow-sm transition-colors ${filterMode === 'none' ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-slate-200 text-slate-600'}`}
                  disabled={filterMode === 'none'} // Aktif Ekstre seçiliyken yılı kilitleyelim daha şık olur
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-[1.2rem] w-full sm:w-auto shrink-0 overflow-x-auto custom-scrollbar">
              {/* KANKA: Butonlardan "Güncel" kısmını kaldırdık, sadece periyotlar var. */}
              {[ { val: 3, label: "3 Ay" }, { val: 6, label: "6 Ay" }, { val: 12, label: "1 Yıl" }, { val: 999, label: "Tümü" } ].map(btn => {
                const isActive = filterMode === 'period' && period === btn.val;
                return (
                  <button
                    key={btn.val} 
                    onClick={() => { setFilterMode('period'); setPeriod(btn.val); }}
                    className={`flex-1 min-w-[60px] sm:w-16 py-2 px-1 text-[11px] font-black rounded-xl transition-all ${
                      isActive 
                      ? 'bg-white text-indigo-600 shadow-sm scale-105' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    {btn.label}
                  </button>
                )
              })}
            </div>

          </div>
        </div>
      </div>

      {/* 2. ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
          <Layers className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Seçili Dönem Toplamı</p>
          <h3 className="text-4xl font-black">₺{(analysisData?.totalExpense || 0).toLocaleString('tr-TR')}</h3>
        </div>
        
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Günlük Ortalama</p>
          <h3 className="text-3xl font-black text-slate-800">
            {analysisData?.dailyAverage > 0 ? `₺${analysisData.dailyAverage.toLocaleString('tr-TR')}` : 'Hesaplanmıyor'}
          </h3>
        </div>
        
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Target size={14} className="text-rose-500"/> En Çok Harcanan</p>
          <h3 className="text-2xl font-black text-rose-600 truncate">{analysisData?.topCategoryName || 'Veri Yok'}</h3>
        </div>
      </div>

      {/* 3. ANA İÇERİK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 ml-2"><Layers className="text-indigo-600" /> Detaylı Gider Hiyerarşisi</h3>
          
          <div className="space-y-4">
            {analysisData?.categoryBreakdown?.length > 0 ? (
              analysisData.categoryBreakdown.map((cat: any, idx: number) => {
                const isCatExpanded = expandedCats.includes(cat.categoryName);
                return (
                  <div key={idx} className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden transition-all">
                    
                    {/* LEVEL 1 */}
                    <button onClick={() => toggleCategory(cat.categoryName)} className="w-full flex justify-between items-center p-5 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex justify-center items-center text-white shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                          {isCatExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                        </div>
                        <div className="text-left">
                          <h4 className="font-black text-slate-800 text-lg">{cat.categoryName}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">% {cat.percentage}</p>
                        </div>
                      </div>
                      <p className="font-black text-xl text-slate-800">₺{cat.totalAmount.toLocaleString('tr-TR')}</p>
                    </button>

                    {/* LEVEL 2 */}
                    {isCatExpanded && (
                      <div className="bg-white p-4 border-t border-slate-100 space-y-3">
                        {cat.subGroups.map((sub: any, sIdx: number) => {
                          const tagId = `${cat.categoryName}-${sub.subCategoryName}`;
                          const isTagExpanded = expandedTags.includes(tagId);
                          return (
                            <div key={sIdx} className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
                              <button onClick={() => toggleTag(tagId)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-indigo-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  {isTagExpanded ? <ChevronDown size={16} className="text-indigo-500"/> : <ChevronRight size={16} className="text-slate-400"/>}
                                  <span className="font-black text-indigo-700">{sub.subCategoryName}</span>
                                </div>
                                <span className="font-black text-slate-700">₺{sub.totalAmount.toLocaleString('tr-TR')}</span>
                              </button>

                              {/* LEVEL 3 */}
                              {isTagExpanded && (
                                <div className="bg-white p-3 space-y-1">
                                  {sub.items.map((item: any, iIdx: number) => (
                                    <div key={iIdx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                      <div className="flex items-center gap-3 pl-6">
                                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        <span className="font-bold text-xs text-slate-600">{item.detail}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-black text-sm text-slate-800 block">₺{item.amount.toLocaleString('tr-TR')}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <TrendingDown className="mx-auto text-slate-300 mb-4 opacity-50" size={48} />
                <p className="text-slate-400 font-bold italic tracking-tight">Seçili filtreye uygun kayıt bulunamadı.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 h-full">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6">Dağılım Özeti</h3>
            <div className="flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysisData?.categoryBreakdown || []}
                    innerRadius={90}
                    outerRadius={130}
                    paddingAngle={6}
                    dataKey="totalAmount"
                    nameKey="categoryName"
                    stroke="none"
                  >
                    {(analysisData?.categoryBreakdown || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => `₺${val.toLocaleString()}`} 
                    contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 text-center bg-slate-50 p-4 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 italic">Veriler veritabanı hiyerarşisine göre oluşturulmuştur.</p>
            </div>
          </div>
        </div>

      </div>
      
      {/* YAPAY ZEKA ASİSTANI */}
      <FloatingAiBot pageContext="analysis" pageData={analysisData} />

    </div>
  );
};

export default AnalysisPage;