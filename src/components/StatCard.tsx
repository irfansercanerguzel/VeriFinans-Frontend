import React, { memo } from 'react';

/**
 * StatCardProps - Bileşenin kabul ettiği veri tipleri
 */
interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple'; // purple buraya eklendi
}

const StatCard: React.FC<StatCardProps> = ({ title, amount, icon, color }) => {
  // Renk temalarını merkezi bir nesne üzerinden yönetiyoruz
  const themeClasses = {
    blue: {
      container: 'bg-blue-500/10 text-blue-600',
      border: 'hover:border-blue-200'
    },
    green: {
      container: 'bg-emerald-500/10 text-emerald-600',
      border: 'hover:border-emerald-200'
    },
    red: {
      container: 'bg-rose-500/10 text-rose-600',
      border: 'hover:border-rose-200'
    },
    // Mor tema buraya eklendi
    purple: {
      container: 'bg-purple-500/10 text-purple-600',
      border: 'hover:border-purple-200'
    }
  };

  const activeTheme = themeClasses[color];

  return (
    <div className={`bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all duration-300 ${activeTheme.border}`}>
      <div className={`p-4 rounded-2xl flex-shrink-0 ${activeTheme.container}`}>
        {icon}
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-sm font-bold text-slate-500 truncate">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 mt-1 truncate">
          {new Intl.NumberFormat('tr-TR', { 
            style: 'currency', 
            currency: 'TRY' 
          }).format(amount)}
        </h4>
      </div>
    </div>
  );
};

export default memo(StatCard);