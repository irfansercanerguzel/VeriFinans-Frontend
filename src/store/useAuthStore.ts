import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IUser } from '../types/index';

// Interface'i direkt burada tanımlayalım ki import hatası yaşanmasın
interface IAuthStore {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: IUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user: IUser, token: string) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('verifinans-auth');
        sessionStorage.removeItem('verifinans-auth');
      },
    }),
    {
      name: 'verifinans-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);