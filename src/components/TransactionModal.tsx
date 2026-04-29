import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, CheckCircle2, ChevronDown, AlertCircle, Plus, Settings2, Sparkles, Wand2, FileText, UploadCloud, Image as ImageIcon, XCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import QuickCategoryModal from './QuickCategoryModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  onSuccess: () => void;
  onOpenHistory: (type: 'income' | 'expense') => void;
  editItem?: any;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, onClose, type, onSuccess, onOpenHistory, editItem 
}) => {
  // --- SEKME (TAB) YÖNETİMİ ---
  const [entryMode, setEntryMode] = useState<'manual' | 'ai'>('manual');

  // --- MANUEL GİRİŞ STATE'LERİ ---
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string>('cash');
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const [lvl1Id, setLvl1Id] = useState<string>(''); 
  const [lvl2Id, setLvl2Id] = useState<string>(''); 
  const [lvl3Id, setLvl3Id] = useState<string>(''); 

  const [lvl1List, setLvl1List] = useState<any[]>([]);
  const [lvl2List, setLvl2List] = useState<any[]>([]);
  const [lvl3List, setLvl3List] = useState<any[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  
  // --- YAPAY ZEKA GİRİŞ STATE'LERİ ---
  const [aiText, setAiText] = useState<string>('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const isIncome = type === 'income';

  const getTodayFormatted = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setEntryMode('manual');
      setAiText('');
      setAiFile(null);
      
      if (editItem) {
        setAmount(editItem.amount?.toString() || '');
        setDescription(editItem.description || '');
        setIsRecurring(editItem.isRecurring || false);
        if (editItem.creditCardId) setSelectedCardId(editItem.creditCardId.toString());
        else setSelectedCardId('cash');
        setInstallmentCount(editItem.installmentCount || 1);
        
        if (editItem.date) {
          try {
            if (editItem.date.includes('.')) {
              const parts = editItem.date.split('.');
              setTransactionDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              const dateObj = new Date(editItem.date);
              const yyyy = dateObj.getFullYear();
              const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
              const dd = String(dateObj.getDate()).padStart(2, '0');
              setTransactionDate(`${yyyy}-${mm}-${dd}`);
            }
          } catch (e) {
            setTransactionDate(getTodayFormatted());
          }
        }
        if (editItem.categoryId) setLvl1Id(editItem.categoryId.toString());
      } else {
        // YENİ EKLEME MODU (Seri Giriş ve Hafıza Özelliği)
        setAmount('');
        setDescription('');
        setIsRecurring(false);
        setLvl1Id('');
        setInstallmentCount(1);
        
        // KANKA BAKIYORUZ: Son kullanılan tarihi ve kartı hafızadan çekiyoruz.
        const savedDate = localStorage.getItem('veriFinans_lastDate');
        setTransactionDate(savedDate || getTodayFormatted());
        
        const savedCard = localStorage.getItem('veriFinans_lastCard');
        setSelectedCardId(savedCard || 'cash');
      }
      
      const typeParam = isIncome ? 0 : 1;
      setLvl2Id(''); setLvl3Id('');
      setLvl2List([]); setLvl3List([]);

      Promise.all([
        axiosInstance.get(`/Category/main?type=${typeParam}`),
        axiosInstance.get('/CreditCard')
      ]).then(([catRes, cardRes]) => {
        setLvl1List(catRes.data);
        setUserCards(cardRes.data);
      }).catch(err => setErrorMessage("Veriler yüklenirken sorun oluştu."));
    }
  }, [isOpen, isIncome, editItem]);

  useEffect(() => {
    if (lvl1Id) axiosInstance.get(`/Category/sub/${lvl1Id}`).then(res => { setLvl2List(res.data); setLvl2Id(''); setLvl3List([]); setLvl3Id(''); });
  }, [lvl1Id]);

  useEffect(() => {
    if (lvl2Id) axiosInstance.get(`/Category/sub/${lvl2Id}`).then(res => { setLvl3List(res.data); setLvl3Id(''); });
  }, [lvl2Id]);

  // --- MANUEL KAYIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!amount || parseFloat(amount) <= 0) return setErrorMessage("Geçerli bir tutar giriniz.");
    if (!lvl1Id) return setErrorMessage("En az bir kategori seçiniz.");
    if (!transactionDate) return setErrorMessage("Lütfen geçerli bir tarih seçiniz.");
    
    setLoading(true);
    try {
      const finalCategoryId = lvl3Id || lvl2Id || lvl1Id;
      const constructedDate = new Date(`${transactionDate}T12:00:00Z`).toISOString();

      const payload = {
        amount: parseFloat(amount),
        categoryId: parseInt(finalCategoryId),
        description: description || (isIncome ? "Gelir Kaydı" : "Gider Kaydı"),
        creditCardId: selectedCardId !== 'cash' ? parseInt(selectedCardId) : null,
        installmentCount: selectedCardId !== 'cash' ? installmentCount : 1,
        date: constructedDate,
        isRecurring: isRecurring
      };

      if (editItem) await axiosInstance.put(`/Transaction/${type}/${editItem.id}`, payload);
      else await axiosInstance.post(isIncome ? '/Transaction/income' : '/Transaction/expense', payload);
      
      // KANKA BAKIYORUZ: Başarılı olunca kartı ve tarihi hafızaya kazı!
      if (!editItem) {
        localStorage.setItem('veriFinans_lastDate', transactionDate);
        if (!isIncome) localStorage.setItem('veriFinans_lastCard', selectedCardId);
      }

      setShowToast(true);
      setTimeout(() => { 
        setShowToast(false); 
        onSuccess(); 

        if (editItem) {
          // Eğer düzenleme modundaysa iş bitti, ekranı kapat.
          onClose(); 
        } else {
          // Eğer yeni ekleme modundaysa EKRANI KAPATMA! Sadece Tutar ve Açıklamayı sıfırla ki seri girebilsin.
          setAmount('');
          setDescription('');
          amountRef.current?.focus(); // Pratiklik: Kaydettikten sonra imleci direkt tutar kısmına oturtur.
        }
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // --- DOSYA SEÇİMİ ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAiFile(e.target.files[0]);
    }
  };

  // --- YAPAY ZEKA KAYIT (DOSYA + METİN) ---
  const handleAiSubmit = async () => {
    if (!aiText.trim() && !aiFile) return setErrorMessage("Lütfen ekstrenizi yükleyin veya metin girin.");
    
    setIsAiProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (aiText) formData.append('text', aiText);
      if (aiFile) formData.append('file', aiFile);
      formData.append('type', isIncome ? '0' : '1');
      if (selectedCardId !== 'cash') formData.append('creditCardId', selectedCardId);

      await axiosInstance.post('/Transaction/ai-parse-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowToast(true);
      setTimeout(() => { setShowToast(false); onSuccess(); onClose(); }, 2000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Yapay Zeka dosyayı çözerken bir hata oluştu.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = editItem 
    ? (isIncome ? 'Geliri Düzenle' : 'Gideri Düzenle') 
    : (isIncome ? 'Gelir Ekle' : 'Gider Ekle');

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
        {showToast && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-bounce border-2 border-white">
            <CheckCircle2 size={24} />
            <span className="font-black text-sm uppercase tracking-wide">
              {entryMode === 'ai' ? 'Yapay Zeka İşlemleri Ekledi!' : (editItem ? 'Güncellendi' : 'Kaydedildi')}
            </span>
          </div>
        )}

        <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden relative border-4 border-white max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-300">
          <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-rose-500 transition-colors z-20"><X size={28} /></button>

          <div className="p-8 pb-4 border-b border-slate-50">
            <div className="flex justify-between items-center pr-12">
              <div className="space-y-1">
                <h2 className={`text-2xl font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{modalTitle}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{editItem ? 'Kaydı Güncelle' : 'Harcama Detayları'}</p>
              </div>
              {!editItem && entryMode === 'manual' && (
                <button type="button" onClick={() => { onClose(); onOpenHistory(type); }} className="text-[10px] font-black text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 py-2 px-4 rounded-xl transition-all flex items-center gap-2">
                  <Settings2 size={14} /> LİSTE
                </button>
              )}
            </div>

            {/* TAB MENÜSÜ (KANKA BAKIYORUZ: GELİR EKRANINDA AI SEKMESİ KALKTI!) */}
            {!editItem && !isIncome && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mt-6">
                <button 
                  onClick={() => setEntryMode('manual')}
                  className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${entryMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Elle Gir
                </button>
                <button 
                  onClick={() => setEntryMode('ai')}
                  className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 ${entryMode === 'ai' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Sparkles size={14} /> Yapay Zeka
                </button>
              </div>
            )}
          </div>

          <div className="p-8 pt-4 overflow-y-auto custom-scrollbar">
            {errorMessage && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-2xl flex items-center gap-3 mb-6">
                <AlertCircle className="text-rose-500 shrink-0" size={20} />
                <p className="text-sm font-bold text-rose-800">{errorMessage}</p>
              </div>
            )}

            {/* === YAPAY ZEKA MODU (AI TAB) === */}
            {entryMode === 'ai' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="bg-violet-50 p-4 rounded-3xl border border-violet-100 flex gap-3">
                  <div className="bg-violet-200 text-violet-700 p-2 rounded-xl h-fit"><Wand2 size={20} /></div>
                  <p className="text-xs font-bold text-violet-800 leading-relaxed">
                    Ekstrenizin <b>PDF</b> dosyasını veya <b>Ekran Görüntüsünü</b> yükleyin. Yapay Zeka sizin için çözer ve eski kayıtlarla karşılaştırarak ekler.
                  </p>
                </div>

                {!isIncome && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bu Ekstre Hangi Karta Ait?</label>
                    <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-violet-500 rounded-2xl font-bold appearance-none outline-none">
                      <option value="cash">💵 Nakit / Cüzdan (Sadece Fiş/Fatura is)</option>
                      {userCards.map((card: any) => <option key={card.id} value={card.id}>💳 {card.cardName}</option>)}
                    </select>
                  </div>
                )}

                {/* DOSYA YÜKLEME ALANI */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ekstre Dosyası (PDF/PNG/JPG)</label>
                  
                  {aiFile ? (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-200 rounded-3xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {aiFile.type.includes('pdf') ? <FileText className="text-emerald-500 shrink-0" /> : <ImageIcon className="text-emerald-500 shrink-0" />}
                        <span className="text-sm font-bold text-emerald-800 truncate">{aiFile.name}</span>
                      </div>
                      <button onClick={() => setAiFile(null)} className="text-emerald-400 hover:text-rose-500 transition-colors">
                        <XCircle size={20} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-violet-200 bg-violet-50/50 hover:bg-violet-50 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group"
                    >
                      <div className="p-3 bg-violet-100 text-violet-600 rounded-full group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <p className="text-xs font-black text-violet-600 tracking-wide uppercase">Tıkla ve Dosya Seç</p>
                      <p className="text-[10px] font-bold text-violet-400">veya sürükleyip bırakabilirsin</p>
                      <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept=".pdf, .png, .jpg, .jpeg"
                      />
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAiSubmit} 
                  disabled={isAiProcessing || (!aiText.trim() && !aiFile)} 
                  className="w-full py-6 rounded-[2.5rem] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xl shadow-xl shadow-violet-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isAiProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={28} />}
                  {isAiProcessing ? 'YAPAY ZEKA ÇÖZÜMLÜYOR...' : 'YAPAY ZEKA İLE YÜKLE'}
                </button>
              </div>
            )}

            {/* === ELLE GİRİŞ MODU (MANUAL TAB) === */}
            {entryMode === 'manual' && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-left-4">
                
                {/* 1. ADIM: HANGİ KARTTAN? (Sadece Giderse) */}
                {!isIncome && (
                  <div className="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Nasıl Ödendi?</label>
                    <div className="relative">
                      <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full p-4 bg-white border border-slate-200 focus:border-rose-500 rounded-2xl font-bold text-lg appearance-none outline-none cursor-pointer shadow-sm">
                        <option value="cash">💵 Nakit / Cüzdan</option>
                        {userCards.map((card: any) => <option key={card.id} value={card.id}>💳 {card.cardName}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>

                    {selectedCardId !== 'cash' && (
                      <div className="mt-3 flex items-center justify-between bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                        <span className="text-xs font-black text-orange-600 uppercase">Taksit:</span>
                        <select value={installmentCount} onChange={(e) => setInstallmentCount(parseInt(e.target.value))} className="bg-transparent font-black text-orange-700 outline-none text-right cursor-pointer">
                          <option value={1}>Tek Çekim</option>
                          {[2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n} Taksit</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ADIM: NE KADAR? */}
                <div className={`relative p-6 rounded-[2.5rem] border-4 transition-all ${isIncome ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
                  <label className={`absolute -top-3 left-6 px-2 bg-white text-[10px] font-black uppercase tracking-widest ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>Tutar</label>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-4xl font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>₺</span>
                    <input ref={amountRef} type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full text-5xl font-black text-center bg-transparent outline-none text-slate-800 placeholder:text-slate-200" placeholder="0.00" />
                  </div>
                </div>

                {/* 3. ADIM: NE ZAMAN VE KATEGORİ */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tarih</label>
                    <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl font-bold outline-none text-slate-700 cursor-pointer text-sm" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                      <button type="button" onClick={() => setIsQuickCategoryOpen(true)} className="text-[9px] font-black text-blue-600"><Plus size={12} /></button>
                    </div>
                    <select value={lvl1Id} onChange={(e) => setLvl1Id(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl font-bold appearance-none cursor-pointer outline-none text-sm text-slate-700 truncate">
                      <option value="">Seçiniz</option>
                      {lvl1List.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* ALT KATEGORİLER (Sadece lvl1 seçilirse açılır) */}
                <div className="flex gap-4">
                  {lvl2List.length > 0 && (
                    <select value={lvl2Id} onChange={(e) => setLvl2Id(e.target.value)} className="w-full p-3 bg-blue-50/50 border-2 border-blue-100 rounded-xl font-bold text-sm text-blue-900 appearance-none outline-none cursor-pointer truncate animate-in fade-in">
                      <option value="">Alt Kategori</option>
                      {lvl2List.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  )}
                  {lvl3List.length > 0 && (
                    <select value={lvl3Id} onChange={(e) => setLvl3Id(e.target.value)} className="w-full p-3 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl font-bold text-sm text-emerald-900 appearance-none outline-none cursor-pointer truncate animate-in fade-in">
                      <option value="">Detay</option>
                      {lvl3List.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  )}
                </div>

                {/* 4. ADIM: AÇIKLAMA & OTOMATİK TEKRAR */}
                <div className="space-y-4 pt-2">
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl font-medium outline-none transition-all text-sm" placeholder="Not ekleyin (Örn: Haftalık Pazar Alışverişi)" />

                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between cursor-pointer group transition-all" onClick={() => setIsRecurring(!isRecurring)}>
                    <div>
                      <p className="text-xs font-black text-blue-900 group-hover:text-blue-700">Her Ay Otomatik Tekrarla 🔄</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isRecurring ? 'bg-blue-600 border-blue-600' : 'bg-white border-blue-200'}`}>
                      {isRecurring && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full py-6 rounded-[2.5rem] text-white font-black text-xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isIncome ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-rose-600 shadow-rose-200 hover:bg-rose-700'} disabled:opacity-50 mt-4`}>
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={28} />}
                  {editItem ? 'GÜNCELLE' : (isIncome ? 'GELİRİ KAYDET' : 'GİDERİ KAYDET')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      
      <QuickCategoryModal isOpen={isQuickCategoryOpen} onClose={() => setIsQuickCategoryOpen(false)} type={type} onSuccess={() => {
        const typeParam = isIncome ? 0 : 1;
        axiosInstance.get(`/Category/main?type=${typeParam}`).then(res => setLvl1List(res.data));
      }} />
    </>
  );
};

export default TransactionModal;