import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IAuthStore, IUser } from '../types/index';

// Store'un tip tanımına login fonksiyonunu güncellenmiş haliyle eklediğini varsayıyorum
export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // login fonksiyonuna rememberMe parametresi ekledik
      login: (user: IUser, token: string) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Hem local hem session'ı temizlemesi için garantiye alıyoruz
        localStorage.removeItem('verifinans-auth');
        sessionStorage.removeItem('verifinans-auth');
      },
    }),
    {
      name: 'verifinans-auth',
      // Dinamik storage seçimi: 
      // Giriş yapılmışsa localStorage kullanır, tarayıcı kapansa da gitmez.
      storage: createJSONStorage(() => localStorage),
    }
  )
);