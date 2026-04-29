import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import StatCard from '../components/StatCard';
import TransactionModal from '../components/TransactionModal';
import AddCardModal from '../components/AddCardModal';
import EditCardModal from '../components/EditCardModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import IncomeDetailsModal from '../components/IncomeDetailsModal';

// KART RESİMLERİ
import axessImg from '../assets/axess.png';
import wingsImg from '../assets/wings.png';
import bonusImg from '../assets/Denizemekli.png';
import troyImg from '../assets/Deniztroy.png';
import worldImg from '../assets/world.jfif';
import maximumImg from '../assets/maximum.jfif';
import fenerImg from '../assets/Fener.png';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Wallet, CreditCard, Clock, BarChart3, PlusCircle, MinusCircle, AlertCircle, 
  Bell, TrendingUp, Settings2, LogOut, Target, Zap, ThumbsUp, AlertTriangle, X, CheckCircle2, PieChart as PieChartIcon, Receipt 
} from 'lucide-react';

// KANKA BAKIYORUZ: Daha canlı ve geniş bir renk paleti
const CHART_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#fbbf24'  // Yellow
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore(); 
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); 
  const notificationRef = useRef<HTMLDivElement>(null);

  // Modallar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  // Listeler ve Detaylar
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllIncomes, setShowAllIncomes] = useState(false);
  const [isIncomeDetailsOpen, setIsIncomeDetailsOpen] = useState(false);
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyType, setHistoryType] = useState<'income' | 'expense'>('income');

  // DÜZENLEME STATE'İ
  const [editingItem, setEditingItem] = useState<any>(null);

  // Stat Detay Modalı State'leri
  const [statModalOpen, setStatModalOpen] = useState(false);
  const [statModalType, setStatModalType] = useState<'balance' | 'debt' | 'pending' | 'monthly' | null>(null);

  // Kart Ödeme Modalı State'leri
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCard, setPaymentCard] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isPayingFull, setIsPayingFull] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/Dashboard/summary');
      setSummaryData(response.data);
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchData]);

  // KART RESİMLERİ FONKSİYONU
  const getCardImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('axess')) return axessImg;
    if (n.includes('wings')) return wingsImg;
    if (n.includes('bonus') || n.includes('emekli')) return bonusImg;
    if (n.includes('troy') || n.includes('deniz')) return troyImg;
    if (n.includes('world')) return worldImg;
    if (n.includes('maximum')) return maximumImg;
    if (n.includes('fener') || n.includes('fb')) return fenerImg;
    return wingsImg; 
  };

  // KART SIRALAMA FONKSİYONU (İstediğin VIP Liste)
  const getCardPriority = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('axess')) return 1;
    if (n.includes('fener') || n.includes('fb')) return 2;
    if (n.includes('wings')) return 3;
    if (n.includes('world')) return 4;
    if (n.includes('bonus') || n.includes('emekli')) return 5;
    if (n.includes('troy') || n.includes('deniz')) return 6;
    if (n.includes('maximum')) return 7;
    return 99; // Diğerleri en sona atılır
  };

  // Kartları önceden sıralıyoruz
  const sortedCards = summaryData?.cards 
    ? [...summaryData.cards].sort((a, b) => getCardPriority(a.cardName) - getCardPriority(b.cardName)) 
    : [];

  const handleTransactionSuccess = () => {
    fetchData(); 
  };

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return alert("Geçerli bir tutar girin.");
    
    try {
      await axiosInstance.post('/api/CreditCard/pay', {
        cardId: paymentCard.id,
        amount: parseFloat(paymentAmount)
      });
      setPaymentModalOpen(false);
      setPaymentAmount('');
      fetchData(); 
    } catch (error) {
      alert("Ödeme alınamadı.");
    }
  };

  const isGoodState = (summaryData?.stats?.monthlyIncome ?? 0) >= (summaryData?.stats?.monthlyTotal ?? 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Veriler Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 relative pt-6 px-4">
      
      {/* 1. ÜST BÖLÜM: Header */}
      <div className="flex items-center justify-between bg-white/50 p-6 rounded-[2.5rem] backdrop-blur-sm border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Merhaba 👋
          </h1>
          <p className="text-slate-500 font-bold text-sm md:text-base italic">Bütçen kontrol altında.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-3 bg-white text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all relative shadow-sm"
            >
              <Bell size={22} />
              {summaryData?.notifications?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {summaryData.notifications.length}
                </span>
              )}
            </button>
            
            {isNotificationOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-5">
                <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Bildirimler</h4>
                  <span className="text-[10px] font-bold text-slate-400">{summaryData?.notifications?.length || 0} Yeni</span>
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {summaryData?.notifications?.length > 0 ? (
                    summaryData.notifications.map((note: string, index: number) => (
                      <div key={index} className="p-4 border-b border-slate-50 last:border-0 flex gap-3 hover:bg-blue-50/30 transition-colors">
                        <div className="p-2 bg-amber-100 rounded-xl h-fit">
                          <AlertCircle className="text-amber-600" size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{note}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-xs font-bold text-slate-400 italic">Her şey yolunda, yeni bildirim yok. ✨</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2 font-black text-sm group"
          >
            <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
            <span className="hidden md:inline">Çıkış</span>
          </button>
        </div>
      </div>

      {/* 2. STAT KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => { setStatModalType('balance'); setStatModalOpen(true); }} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <StatCard title="Nakit Bakiye" amount={summaryData?.stats?.currentBalance ?? 0} icon={<Wallet size={24}/>} color="blue" />
        </div>
        <div onClick={() => { setStatModalType('debt'); setStatModalOpen(true); }} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <StatCard title="Toplam Kart Borcu" amount={summaryData?.stats?.totalDebt ?? 0} icon={<CreditCard size={24}/>} color="red" />
        </div>
        <div onClick={() => { setStatModalType('pending'); setStatModalOpen(true); }} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <StatCard title="Bekleyen Ödemeler" amount={summaryData?.stats?.pendingExpenses ?? 0} icon={<Clock size={24}/>} color="purple" />
        </div>
        <div onClick={() => { setStatModalType('monthly'); setStatModalOpen(true); }} className="cursor-pointer hover:scale-[1.02] transition-transform">
          <StatCard title="Aylık Harcama" amount={summaryData?.stats?.monthlyTotal ?? 0} icon={<BarChart3 size={24}/>} color="green" />
        </div>
      </div>

      {/* AKSİYON BUTONLARI (GELİR VE ANALİZ) */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button 
          onClick={() => navigate('/analysis')}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          <PieChartIcon size={16} /> Detaylı Analiz
        </button>
        <button 
          onClick={() => setIsIncomeDetailsOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95"
        >
          <TrendingUp size={16} /> Gelirleri İncele
        </button>
      </div>

      {/* 3. ANA GRİD: ANALİZ VE KARTLAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL: KÜÇÜK ANALİZ KUTUSU */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col gap-6">
            
            {/* KANKA: İŞTE RENKLİ HARCAMA DAĞILIMI GRAFİĞİ */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 ml-2">Harcama Dağılımı</h3>
              <div className="w-full h-[220px]">
                {summaryData?.chartData && summaryData.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {summaryData.chartData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            // Backendden gelen rengi iptal ettik, tamamen gökkuşağı olacak!
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                        itemStyle={{ color: '#1e293b' }}
                        formatter={(val: any) => `₺${val.toLocaleString('tr-TR')}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 p-8">
                    <PieChartIcon size={40} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Analiz için harcama verisi bekleniyor...</p>
                  </div>
                )}
              </div>
            </div>

            {/* GELİR & GİDER LİSTELERİ */}
            <div className="space-y-5 px-2">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} className="text-emerald-500" /> En Büyük Gelirler
                </p>
                <div className="space-y-2">
                  {summaryData?.incomeChartData?.slice(0, showAllIncomes ? undefined : 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs font-bold border-b border-slate-50 pb-1">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="text-emerald-600">₺{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <button onClick={() => setShowAllIncomes(!showAllIncomes)} className="text-[9px] font-black text-blue-500 hover:underline">
                    {showAllIncomes ? 'KÜÇÜLT' : 'DEVAMINI GÖR...'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={12} className="text-rose-500" /> En Büyük Giderler
                </p>
                <div className="space-y-2">
                  {summaryData?.chartData?.slice(0, showAllExpenses ? undefined : 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs font-bold border-b border-slate-50 pb-1">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="text-rose-600">₺{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <button onClick={() => setShowAllExpenses(!showAllExpenses)} className="text-[9px] font-black text-blue-500 hover:underline">
                    {showAllExpenses ? 'KÜÇÜLT' : 'DEVAMINI GÖR...'}
                  </button>
                </div>
              </div>
            </div>

            {/* DİNAMİK FİNANSAL DURUM KUTUSU */}
            <div className={`p-5 rounded-[2rem] shadow-lg border-2 transition-all ${
              isGoodState ? 'bg-emerald-500 border-emerald-200' : 'bg-rose-500 border-rose-200'
            }`}>
              <div className="flex items-center gap-2 mb-1 text-white/90">
                {isGoodState ? <ThumbsUp size={16} /> : <AlertTriangle size={16} />}
                <span className="text-[9px] font-black uppercase tracking-widest">Finansal Durum</span>
              </div>
              <p className="text-xs font-black text-white leading-snug">
                {isGoodState 
                  ? "Harika! Gelirin harcamandan fazla, bütçen çiçek gibi. 🌸" 
                  : "Dikkat! Harcamalar geliri aşmış, biraz frene basalım. 🛑"}
              </p>
            </div>

          </div>
        </div>

        {/* SAĞ: KAYDIRMALI KREDİ KARTLARI PANELİ */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 h-full">
            
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <CreditCard size={32} className="text-blue-600" /> Kayıtlı Kartlarım
                </h3>
                <p className="text-slate-400 text-sm font-bold ml-11 italic tracking-tight">Kartlarını kaydırarak kontrol et.</p>
              </div>
              <button 
                onClick={() => setIsAddCardOpen(true)} 
                className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] hover:bg-blue-100 transition-all shadow-sm group active:scale-95"
              >
                <PlusCircle size={28} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
            
            {/* CAROUSEL KONTEYNERI */}
            <div className="flex gap-8 overflow-x-auto pb-10 pt-4 px-2 no-scrollbar snap-x snap-mandatory">
              {sortedCards.length > 0 ? sortedCards.map((card: any) => {
                const cardPic = getCardImage(card.cardName);
                const isFener = card.cardName.toLowerCase().includes('fener') || card.cardName.toLowerCase().includes('fb');

                return (
                  <div 
                    key={card.id} 
                    className="group bg-white rounded-[3.5rem] border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col relative shrink-0 snap-center w-[90%] md:w-[calc(50%-1rem)] min-w-[320px]"
                  >
                    {/* ÜST KISIM (MODERN STAGE) */}
                    <div className="h-32 bg-slate-50/80 relative overflow-hidden rounded-t-[3.5rem]">
                      <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl"></div>
                      <button 
                        onClick={() => { setSelectedCard(card); setIsEditCardOpen(true); }}
                        className="absolute top-6 right-8 p-3 bg-white text-slate-400 hover:text-blue-600 rounded-2xl shadow-sm border border-slate-100 transition-all z-20 active:scale-90"
                      >
                        <Settings2 size={18} />
                      </button>
                    </div>

                    {/* BİRLEŞİK KART RESMİ (HİBRİT) */}
                    <div className={`absolute top-12 left-10 z-10 pointer-events-none transition-all duration-500 ${isFener ? 'w-[52%] mt-2' : 'w-[60%]'}`}> 
                      <img 
                        src={cardPic} 
                        alt="card-visual" 
                        className="w-full h-auto object-contain rounded-xl drop-shadow-[0_25px_35px_rgba(0,0,0,0.25)] transition-transform duration-700 group-hover:scale-105 group-hover:-translate-y-2 group-hover:-rotate-1" 
                      />
                    </div>

                    {/* ALT KISIM (BİLGİ ALANI) */}
                    <div className="p-10 pt-20 space-y-8 bg-white rounded-b-[3.5rem]">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em]">Cüzdan Özetim</span>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight">{card.cardName}</h4>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-center">
                           <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest text-center">Kesim</span>
                           <p className="text-xs font-black text-slate-700">{card.closingDay}. Gün</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="flex justify-between items-center px-2">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Güncel Borç</span>
                           <span className="text-2xl font-black text-slate-900 tracking-tighter">
                             ₺{card.currentDebt.toLocaleString('tr-TR')}
                           </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 bg-rose-50/30 rounded-[2rem] border border-rose-100/50">
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.15em] mb-2 text-center">Ekstre</p>
                            <p className="text-xl font-black text-rose-600 tracking-tight text-center">
                              ₺{(card.statementDebt ?? card.currentDebt ?? 0).toLocaleString('tr-TR')}
                            </p>
                          </div>
                          <div className="p-5 bg-amber-50/30 rounded-[2rem] border border-amber-100/50">
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.15em] mb-2 text-center">Yeni Dönem</p>
                            <p className="text-xl font-black text-amber-600 tracking-tight text-center">
                              ₺{(card.newPeriodDebt || 0).toLocaleString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button 
                          onClick={() => navigate(`/card-details/${card.id}`)} 
                          className="flex-1 bg-slate-50 text-slate-500 py-4.5 rounded-2xl text-[10px] font-black hover:bg-slate-100 transition-all active:scale-95 uppercase tracking-widest border border-slate-100"
                        >
                          Hareketler
                        </button>
                        <button 
                          onClick={() => { setPaymentCard(card); setPaymentModalOpen(true); }} 
                          className="flex-[1.5] bg-blue-600 text-white py-4.5 rounded-2xl text-[10px] font-black shadow-[0_15px_30px_rgba(37,99,235,0.25)] hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                          <CheckCircle2 size={16}/> Öde
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="w-full py-24 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 shrink-0">
                   <CreditCard size={50} className="mx-auto text-slate-300 mb-4 opacity-40" />
                   <p className="text-slate-400 font-bold italic tracking-tight text-center">Henüz bir kart tanımlanmadı.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. SABİT AKSİYON MENÜSÜ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-white flex gap-4">
          <button 
            onClick={() => { setModalType('income'); setIsModalOpen(true); }}
            className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-emerald-200"
          >
            <PlusCircle size={24} /> Gelir Ekle
          </button>
          <button 
            onClick={() => { setModalType('expense'); setIsModalOpen(true); }}
            className="flex-1 py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-lg shadow-rose-200"
          >
            <MinusCircle size={24} /> Gider Ekle
          </button>
        </div>
      </div>

      {/* --- STAT DETAY MODALI --- */}
      {statModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative border-4 border-slate-50 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">
                {statModalType === 'balance' && 'Nakit Bakiye Detayı'}
                {statModalType === 'debt' && 'Kart Borçları Özeti'}
                {statModalType === 'pending' && 'Bekleyen Ödemeler'}
                {statModalType === 'monthly' && 'Aylık Harcama Özeti'}
              </h3>
              <button onClick={() => setStatModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24}/>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* --- GENEL BAKİYE & ANALİZ SEKMESİ --- */}
{statModalType === 'balance' && (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="text-center mb-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Genel Finansal Özet</p>
    </div>

    <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner relative overflow-hidden">
      <div className="space-y-5 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Toplam Giderler (Nakit + Kart)</span>
          </div>
          <span className="font-black text-rose-600 text-lg">
            ₺{(summaryData?.stats?.totalExpenseAllTime || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Toplam Gelirler</span>
          </div>
          <span className="font-black text-emerald-600 text-lg">
            ₺{(summaryData?.stats?.totalIncomeAllTime || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="h-px bg-slate-200 w-full opacity-60"></div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Finansal Akış</p>
            {/* KANKA: netFlow >= 0 ise YEŞİL (Birikim), eksi ise KIRMIZI (Açık) */}
            <p className={`text-3xl font-black tracking-tight ${summaryData?.stats?.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₺{Math.abs(summaryData?.stats?.netFlow || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {/* KANKA: Badge rengi ve metni de aynı mantıkla güncellendi */}
          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${summaryData?.stats?.netFlow >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {summaryData?.stats?.netFlow >= 0 ? 'Toplam Birikim' : 'Toplam Açık'}
          </div>
        </div>
      </div>
    </div>

                  <button 
                    onClick={() => {
                      setStatModalOpen(false);
                      navigate('/cash-expenses');
                    }}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 group active:scale-95"
                  >
                    <Wallet size={20} className="group-hover:-rotate-12 transition-transform" />
                    NAKİT HARCAMALARIMI LİSTELE
                  </button>

                  <div className="p-5 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-100">
                    <div className="flex gap-3">
                      <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-amber-700 leading-relaxed italic">
                        * "Net Durum" hesaplanırken, nakit harcamalarına ek olarak kartla yaptığın tüm harcamalar dahil edilir. Bu tablo senin genel finansal sağlığını gösterir.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* --- KART BORÇLARI LİSTESİ --- */}
              {statModalType === 'debt' && (
                <div className="space-y-4 animate-in fade-in">
                  {summaryData?.cards?.length > 0 ? (
                    summaryData.cards.map((c: any) => (
                      <div key={c.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <CreditCard size={18} className="text-slate-400" />
                          <span className="font-black text-slate-700">{c.cardName}</span>
                        </div>
                        <span className="font-black text-rose-600 text-lg">₺{c.currentDebt.toLocaleString('tr-TR')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 italic py-10">Kayıtlı borç bulunamadı.</p>
                  )}
                </div>
              )}

              {/* --- BEKLEYEN ÖDEMELER (GELECEK TAKSİTLER) DETAYI --- */}
              {statModalType === 'pending' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="text-center mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gelecek Tüm Harcama Yükü</p>
                  </div>
                  
                  {summaryData?.stats?.pendingDetails?.length > 0 ? (
                    <div className="space-y-3">
                      {summaryData.stats.pendingDetails.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-100/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-purple-500">
                              <CreditCard size={18} />
                            </div>
                            <span className="font-black text-slate-700">{p.cardName}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Taksit Toplamı</p>
                            <p className="font-black text-purple-700 text-lg">₺{p.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* TOPLAM ÖZET KUTUSU */}
                      <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-purple-100">
                         <div>
                           <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Tüm Bekleyenler Toplamı</p>
                           <p className="text-xs font-bold text-purple-200 italic">Gelecek Ayların Özet Yükü</p>
                         </div>
                         <p className="text-2xl font-black text-white">₺{summaryData?.stats?.pendingExpenses?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                        <Clock size={30} className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold italic text-sm">Gelecek aylara ait bekleyen bir harcama yok.</p>
                    </div>
                  )}
                </div>
              )}

              {/* --- AYLIK HARCAMA (GÜNCEL EKSTRE BORÇLARI) DETAYI --- */}
              {statModalType === 'monthly' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="text-center mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ödenmesi Gereken Güncel Ekstreler</p>
                  </div>

                  <div className="space-y-3">
                    {summaryData?.cards?.filter((c: any) => c.statementDebt > 0).length > 0 ? (
                      summaryData.cards.filter((c: any) => c.statementDebt > 0).map((c: any) => (
                        <div key={c.id} className="flex justify-between items-center p-5 bg-emerald-50 rounded-2xl border border-emerald-100 hover:bg-emerald-100/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500">
                              <Receipt size={18} />
                            </div>
                            <div>
                              <span className="font-black text-slate-700 block">{c.cardName}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Son Ödeme Günü: {c.dueDay}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Borç</p>
                            <p className="font-black text-emerald-700 text-lg">₺{c.statementDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-emerald-100">
                          <CheckCircle2 size={30} className="text-emerald-400" />
                        </div>
                        <p className="text-emerald-600 font-black text-sm uppercase tracking-widest">Tüm Ekstreler Ödenmiş! ✨</p>
                        <p className="text-slate-400 text-xs font-bold italic">Borcunuz yok.</p>
                      </div>
                    )}

                    {/* TOPLAM ÖZET KUTUSU */}
                    <div className="mt-6 p-6 bg-emerald-600 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-emerald-100">
                       <div>
                         <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">Toplam Ekstre Yükü</p>
                         <p className="text-xs font-bold text-emerald-200 italic">Bu Ay Ödenecek</p>
                       </div>
                       <p className="text-2xl font-black text-white">₺{summaryData?.stats?.monthlyTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- KART ÖDEME MODALI --- */}
      {paymentModalOpen && paymentCard && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden p-8 border-4 border-slate-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Kart Ödemesi</h3>
                <p className="text-xs font-bold text-slate-400 uppercase">{paymentCard.cardName}</p>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleCardPayment} className="space-y-6">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Ödenmesi Gereken (Ekstre)</span>
                <p className="text-3xl font-black text-rose-600">₺{(paymentCard.statementDebt ?? paymentCard.currentDebt ?? 0).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ödenecek Tutar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-400">₺</span>
                  <input 
                    type="number" step="0.01" required
                    value={paymentAmount}
                    onChange={(e) => { setPaymentAmount(e.target.value); setIsPayingFull(false); }}
                    className="w-full p-4 pl-10 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl font-black text-xl outline-none text-slate-800"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setPaymentAmount((paymentCard.statementDebt ?? paymentCard.currentDebt ?? 0).toString());
                      setIsPayingFull(true);
                    }}
                    className={`text-[10px] font-black px-3 py-1 rounded-lg transition-colors ${isPayingFull ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    EKSTREYİ ÖDE
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all">
                ÖDEMEYİ ONAYLA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DİĞER MODALLAR */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null); 
        }} 
        type={modalType} 
        editItem={editingItem} 
        onSuccess={handleTransactionSuccess} 
        onOpenHistory={(type) => { setHistoryType(type); setIsHistoryOpen(true); }} 
      />
      <AddCardModal isOpen={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} onSuccess={fetchData} />
      <EditCardModal isOpen={isEditCardOpen} onClose={() => setIsEditCardOpen(false)} card={selectedCard} onSuccess={fetchData} />
      <TransactionHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} type={historyType} onSuccess={fetchData} />
      <IncomeDetailsModal isOpen={isIncomeDetailsOpen} onClose={() => setIsIncomeDetailsOpen(false)} />
      <IncomeDetailsModal isOpen={isIncomeDetailsOpen} onClose={() => setIsIncomeDetailsOpen(false)} onRefresh={fetchData}/>

    </div>
  );
};

export default DashboardPage;