import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import axiosInstance from '../api/axiosInstance';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  AlertCircle 
} from 'lucide-react';

// ASSETS
import bgImage from '../assets/arkplan.png'; 
import logo from '../assets/logo (2).png'; 

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null); 
    
    try {
      if (isLogin) {
        // --- "Beni Hatırla" bilgisini Backend'e gönderiyoruz ---
        const response = await axiosInstance.post('/api/Auth/login', { 
          email, 
          password,
          rememberMe // Backend bunu okuyup Token süresini 1 yıl yapacak
        });
        
        // Zustand Login: Store artık hem User'ı hem Token'ı persist (kalıcı) olarak saklayacak
        login(response.data.user, response.data.token);
        
        console.log("Giriş başarılı. Oturum kalıcılığı:", rememberMe ? "1 Yıl" : "2 Saat"); 
      } else {
        // Kayıt olma işlemi
        await axiosInstance.post('/api/Auth/register', { 
          name: fullName, 
          email, 
          password 
        });
        
        console.log("Kayıt başarılı.");
        setIsLogin(true); 
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "E-posta veya şifre hatalı. Lütfen kontrol ediniz.";
      setErrorMessage(msg);
      console.error("Auth Error:", error.response?.status, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 md:p-10 font-sans relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-6xl bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row min-h-[650px] z-10 border border-white/20">
        
        {/* SOL PANEL: Logo ve Slogan */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center relative bg-white md:bg-transparent border-b md:border-b-0 md:border-r border-slate-100">
          <div className="text-center w-full">
            <div className="mb-10 flex justify-center">
              <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center transition-transform duration-500 hover:scale-105">
                <img src={logo} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                veriFinans
               </span>
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-slate-700">Gelir-Gider Takibi Artık Çok Kolay!</h2>
          </div>
        </div>

        {/* SAĞ PANEL: Form */}
        <div className="w-full md:w-1/2 bg-slate-50/40 p-8 md:p-16 flex items-center justify-center">
          <div className="w-full max-w-[380px] space-y-8">
            <div className="text-center">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {isLogin ? 'Hoş Geldin' : 'Kayıt Ol'}
               </h3>
               <p className="text-slate-500 text-sm font-medium mt-2">Bütçeni yönetmeye hazır mısın?</p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                <span className="text-red-800 text-xs font-bold leading-tight">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative group animate-in slide-in-from-top-2">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-700 font-medium"
                    placeholder="Adınız Soyadınız"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-700 font-medium"
                  placeholder="E-posta Adresi"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-700 font-medium"
                  placeholder="Şifre"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition">Beni Hatırla</span>
                </label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-purple-600">Şifremi Unuttum?</button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Hesabımı Oluştur')}
              </button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400"><span className="bg-white/90 px-3">veya</span></div>
            </div>

            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage(null); 
              }}
              className="w-full py-4 border-2 border-slate-200 rounded-2xl text-slate-600 font-black text-sm transition-all hover:bg-white hover:border-blue-600 hover:text-blue-600 hover:shadow-lg active:scale-[0.97]"
            >
              {isLogin ? 'Hemen Ücretsiz Kayıt Ol' : 'Zaten Üyeyim, Giriş Yap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;