
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, TransactionType, Category, FinancialInsight, getFinancialCycle, getCurrentCycleLabel, getAvailableCycles, AppSettings, MONTH_NAMES } from './types';
import TransactionForm from './components/TransactionForm';
import DashboardCharts from './components/DashboardCharts';
import { getFinancialAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('finas_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('finas_settings');
      return saved ? JSON.parse(saved) : { 
        autoIncomeAmount: 7000000, 
        autoIncomeEnabled: true,
        initialSavings: 0,
        syncId: '' 
      };
    } catch (e) {
      return { autoIncomeAmount: 7000000, autoIncomeEnabled: true, initialSavings: 0, syncId: '' };
    }
  });

  const [selectedCycle, setSelectedCycle] = useState<string>(getCurrentCycleLabel());
  const [insight, setInsight] = useState<FinancialInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const formatNumber = (num: number): string => num.toLocaleString('id-ID');
  const parseNumber = (str: string): number => parseInt(str.replace(/\D/g, '')) || 0;

  const availableCycles = useMemo(() => getAvailableCycles(transactions), [transactions]);

  // Gaji otomatis
  useEffect(() => {
    if (settings.autoIncomeEnabled) {
      const todayLabel = getCurrentCycleLabel();
      const today = new Date();
      if (today.getFullYear() >= 2024) {
        const hasAutoIncome = transactions.some(t => 
          t.isAuto && t.type === TransactionType.INCOME && getFinancialCycle(t.date) === todayLabel
        );

        if (!hasAutoIncome && today.getDate() >= 25) {
          const autoTx: Transaction = {
            id: `auto-income-${todayLabel.replace(/\s+/g, '-')}`,
            date: today.toISOString().split('T')[0],
            description: `Gaji Otomatis - Siklus Baru`,
            subCategory: 'Gaji Tetap',
            amount: settings.autoIncomeAmount,
            type: TransactionType.INCOME,
            category: Category.SALARY,
            isAuto: true
          };
          setTransactions(prev => [autoTx, ...prev]);
        }
      }
    }
  }, [settings.autoIncomeEnabled, settings.autoIncomeAmount, transactions]);

  useEffect(() => {
    localStorage.setItem('finas_transactions', JSON.stringify(transactions));
    localStorage.setItem('finas_settings', JSON.stringify(settings));
  }, [transactions, settings]);

  const currentCycleTransactions = useMemo(() => {
    return transactions.filter(t => getFinancialCycle(t.date) === selectedCycle);
  }, [transactions, selectedCycle]);

  const totalIncome = currentCycleTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentCycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const currentTotalAsset = (settings.initialSavings || 0) + transactions.filter(t => t.category === Category.TABUNGAN).reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = (newT: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = { ...newT, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [transaction, ...prev]);
    const newCycle = getFinancialCycle(transaction.date);
    if (newCycle !== selectedCycle) setSelectedCycle(newCycle);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Hapus transaksi ini?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const analyzeFinances = async () => {
    if (currentCycleTransactions.length === 0) return;
    setIsAnalyzing(true);
    setInsight(null);
    try {
      const advice = await getFinancialAdvice(currentCycleTransactions);
      setInsight(advice);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-indigo-700 text-white sticky top-0 z-50 px-4 md:px-8 py-4 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl">
              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c.51-.51.815-1.124.815-1.801 0-1.105-1.343-2-3-2s-3 .895-3 2c0 .677.305 1.291.815 1.801M12 16h.01" /></svg>
            </div>
            <h1 className="text-xl font-black tracking-tighter italic">AISAGA</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSettings(true)} className="p-2.5 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all border border-indigo-400/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /></svg>
            </button>
            <button onClick={analyzeFinances} disabled={isAnalyzing || currentCycleTransactions.length === 0} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
              {isAnalyzing ? <span className="animate-spin">⏳</span> : '💡 ANALISIS AI'}
            </button>
          </div>
        </div>
      </nav>

      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b bg-indigo-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-indigo-900">Konfigurasi Pengeluaran</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 text-indigo-400"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                 <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Update Gaji Bulanan</h4>
                 <div className="flex gap-4 items-center">
                   <input type="text" inputMode="numeric" value={formatNumber(settings.autoIncomeAmount)} onChange={(e) => setSettings({...settings, autoIncomeAmount: parseNumber(e.target.value)})} className="flex-1 px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-xl font-black text-lg outline-none focus:border-indigo-600" />
                   <input type="checkbox" checked={settings.autoIncomeEnabled} onChange={(e) => setSettings({...settings, autoIncomeEnabled: e.target.checked})} className="w-8 h-8 accent-indigo-600 cursor-pointer" />
                 </div>
              </div>
              <div className="space-y-3">
                 <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-widest">Saldo Awal Tabungan</h4>
                 <input type="text" inputMode="numeric" value={formatNumber(settings.initialSavings)} onChange={(e) => setSettings({...settings, initialSavings: parseNumber(e.target.value)})} className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-xl font-black text-lg outline-none focus:border-indigo-600" />
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-indigo-700 text-white font-black rounded-xl shadow-xl shadow-indigo-100 mt-4">SIMPAN PERUBAHAN</button>
            </div>
          </div>
        </div>
      )}

      {insight && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
          <div className="bg-indigo-950 text-white p-8 rounded-[3rem] shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-xl font-black mb-4 flex items-center gap-3">
              <span className="text-2xl">🤖</span> Hasil Analisis AI
            </h3>
            <p className="text-indigo-100 mb-6 font-medium italic opacity-90">{insight.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 p-6 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-4">Saran Keuangan</p>
                <ul className="space-y-3">
                  {insight.advice.map((a, i) => <li key={i} className="text-sm flex gap-3"><span className="text-emerald-400">✔</span> {a}</li>)}
                </ul>
              </div>
              <div className="bg-white/10 p-6 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-300 mb-4">Peringatan</p>
                <ul className="space-y-3">
                  {insight.warnings.map((w, i) => <li key={i} className="text-sm flex gap-3"><span className="text-rose-400">⚠</span> {w}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="bg-white p-8 rounded-[3rem] border-2 border-indigo-100 shadow-xl mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 block">Siklus Keuangan</span>
            <div className="relative">
              <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full appearance-none bg-slate-900 text-white text-2xl md:text-3xl font-black py-6 px-10 rounded-3xl cursor-pointer outline-none border-4 border-slate-900 focus:border-indigo-500 shadow-2xl transition-all">
                {availableCycles.map(cycle => <option key={cycle} value={cycle} className="bg-white text-slate-900">{cycle}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col items-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Aset</p>
             <p className="text-3xl font-black text-indigo-700">Rp {currentTotalAsset.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-10 rounded-[3rem] border-2 border-emerald-50 shadow-xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Pemasukan</p>
            <p className="text-3xl font-black text-emerald-600">Rp {totalIncome.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border-2 border-rose-50 shadow-xl text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Pengeluaran</p>
            <p className="text-3xl font-black text-rose-600">Rp {totalExpense.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-indigo-700 p-10 rounded-[3rem] shadow-2xl text-white text-center border-4 border-indigo-600">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Saldo Siklus</p>
            <p className="text-3xl font-black">Rp {balance.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <TransactionForm onAdd={handleAddTransaction} />
        
        <DashboardCharts transactions={transactions} currentCycleLabel={selectedCycle} />

        <div className="bg-white rounded-[3rem] shadow-2xl border-2 border-slate-100 overflow-hidden mt-12 mb-12">
           <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">Riwayat Transaksi</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b">
                    <th className="px-10 py-5">Tgl</th>
                    <th className="px-10 py-5">Kategori</th>
                    <th className="px-10 py-5">Deskripsi</th>
                    <th className="px-10 py-5 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentCycleTransactions.length > 0 ? (
                    currentCycleTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-10 py-6 text-xs font-bold text-slate-400">{new Date(t.date).getDate()} {MONTH_NAMES[new Date(t.date).getMonth()]}</td>
                        <td className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase">{t.category}</td>
                        <td className="px-10 py-6 text-sm font-bold text-slate-800">{t.description}</td>
                        <td className={`px-10 py-6 text-right font-black text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'} {t.amount.toLocaleString('id-ID')}
                          <button onClick={() => handleDeleteTransaction(t.id)} className="ml-4 opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase italic">Belum ada data di siklus ini</td></tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
