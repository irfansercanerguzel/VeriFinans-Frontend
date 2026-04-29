/**
 * VeriFinans Uygulaması Ana Tip Tanımlamaları
 */

// 1. Kullanıcı Modeli
export interface IUser {
  id: number;
  name: string
  email: string;
  fullName: string;
}

// 2. Auth (Giriş/Hafıza) Store Modeli
export interface IAuthStore {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: IUser, token: string) => void;
  logout: () => void;
}

// 3. Harcama/Fatura Modeli (Backend'deki Expense ile eşleşir)
export interface IExpense {
  id: number;
  description: string;
  amount: number;
  date: string;
  categoryName: string;
}

// 4. Analiz Raporu Modeli (AI Sonuçları için)
export interface IAnalysisResponse {
  analysisReport: string;
}

// 5. API Hata Modeli
export interface IApiError {
  message: string;
  errors?: string[];
}