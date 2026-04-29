import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Bot, X, Sparkles, Lightbulb, TrendingDown, Search } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface AiBotProps {
  pageContext?: 'global' | 'cardDetails' | 'dashboard' | 'analysis';
  pageData?: any; 
}

const FloatingAiBot: React.FC<AiBotProps> = ({ pageContext = 'global', pageData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{role: 'ai'|'user', content: string}[]>([
    { role: 'ai', content: 'Merhaba. Ben finansal yapay zeka asistanınızım. Ekranda yer alan verilere dayanarak size nasıl yardımcı olabilirim? Lütfen aşağıdaki aksiyonlardan birini seçiniz.' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleAction = async (actionType: string, userText: string) => {
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsTyping(true);

    try {
      let dataToSend = "";

      // KANKA BAKIYORUZ: Veriyi çok net ve basit bir string olarak hazırlıyoruz ki kaybolmasın.
      if (pageContext === 'cardDetails' && pageData && pageData.items && pageData.items.length > 0) {
        const mappedItems = pageData.items.map((item: any) => {
           return {
             Tarih: item.date || item.rawDate || "",
             Tutar: item.amount || 0,
             Aciklama: item.description || ""
           };
        });
        // Sadece işimize yarayan kısmı doğrudan JSON string yapıp yolluyoruz
        dataToSend = JSON.stringify(mappedItems);
      } 
      else if (pageContext === 'analysis' && pageData && pageData.categoryBreakdown) {
         dataToSend = JSON.stringify(pageData.categoryBreakdown);
      } 
      else {
         dataToSend = "[]"; // Eğer veri gerçekten yoksa boş array yolla
      }

      // Eğer dataToSend boş string veya "[]" ise backend boş görecektir, bunu engellemek için kontrol ekledik.
      if(dataToSend === "[]" || dataToSend === "") {
           setMessages(prev => [...prev, { role: 'ai', content: 'Ekranda incelenebilecek bir harcama verisi bulunamadı.' }]);
           setIsTyping(false);
           return;
      }

      const payload = {
        actionType: actionType,
        context: pageContext,
        dataJson: dataToSend // Kesin string olarak yolladık
      };

      const response = await axiosInstance.post('/Ai/analyze', payload);
      
      const aiResponse = response.data?.message || 'Analiz işlemi tamamlandı.';
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);

    } catch (error: any) {
      console.error("AI Analiz Hatası:", error);
      
      const errorMsg = error.response?.data?.message || 'Üzgünüm, şu anda yapay zeka servisiyle iletişim kuramıyorum. Lütfen bağlantınızı kontrol ediniz.';
      
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getActionButtons = () => {
    switch (pageContext) {
      case 'cardDetails':
        return (
          <>
            <button 
              onClick={() => handleAction('check_duplicates', 'Mükerrer (çift çekim) işlem kontrolü yapar mısın?')} 
              disabled={isTyping}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black p-2.5 rounded-xl text-left flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Search size={14} className="shrink-0" /> Mükerrer İşlem Kontrolü
            </button>
            <button 
              onClick={() => handleAction('highest_expense', 'Bu ekstredeki en yüksek harcamamı analiz et.')} 
              disabled={isTyping}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-black p-2.5 rounded-xl text-left flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <TrendingDown size={14} className="shrink-0" /> En Yüksek Harcamayı Bul
            </button>
          </>
        );
      case 'dashboard':
      case 'analysis':
        return (
          <button 
            onClick={() => handleAction('give_advice', 'Finansal durumuma göre bir tasarruf tavsiyesi verebilir misin?')} 
            disabled={isTyping}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black p-2.5 rounded-xl text-left flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Lightbulb size={14} className="shrink-0" /> Tasarruf Tavsiyesi Al
          </button>
        );
      default:
        return (
          <button 
            onClick={() => handleAction('general_overview', 'Genel finansal bir değerlendirme yapar mısın?')} 
            disabled={isTyping}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black p-2.5 rounded-xl text-left flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Sparkles size={14} className="shrink-0" /> Genel Değerlendirme Talep Et
          </button>
        );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-[340px] rounded-[2rem] shadow-2xl border border-slate-100 mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
          
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm">Finansal Yapay Zeka</h3>
                <p className="text-[10px] text-indigo-100 font-bold">Aktif</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar flex flex-col">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-bold leading-relaxed shadow-sm ${
                  msg.role === 'ai' 
                    ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm' 
                    : 'bg-indigo-600 text-white rounded-tr-sm'
                }`}>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-sm flex gap-1 shadow-sm">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">İşlem Seçiniz:</span>
            {getActionButtons()}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-indigo-200 hover:scale-110 transition-all flex items-center justify-center group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="group-hover:animate-pulse" />}
      </button>
    </div>
  );
};

export default FloatingAiBot;