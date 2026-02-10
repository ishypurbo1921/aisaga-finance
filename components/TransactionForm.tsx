
import React, { useState, useEffect } from 'react';
import { TransactionType, Category, Transaction, SUB_CATEGORIES } from '../types';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<Category>(Category.RUMAH);
  const [subCategory, setSubCategory] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [amount, setAmount] = useState('');

  // Sinkronisasi sub-kategori saat kategori utama berubah
  useEffect(() => {
    if (type === TransactionType.EXPENSE) {
      const subs = SUB_CATEGORIES[category] || [];
      const defaultSub = subs[0] || 'Lain - lain';
      setSubCategory(defaultSub);
    }
  }, [category, type]);

  const incomeCategories = [
    Category.SALARY, 
    Category.INVESTMENT, 
    Category.BONUS, 
    Category.LAIN_LAIN
  ];
  
  const expenseCategories = [
    Category.SEKOLAH,
    Category.LES,
    Category.KONSUMSI,
    Category.ANAK_JINGGA,
    Category.RUMAH,
    Category.TABUNGAN,
    Category.KESEHATAN
  ];

  const formatAsThousand = (val: string) => {
    const cleanNum = val.replace(/\D/g, '');
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatAsThousand(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    const numericAmount = parseInt(amount.replace(/,/g, '')) || 0;
    if (numericAmount <= 0) return;

    // Gunakan sub-kategori sebagai deskripsi utama, 
    // atau tambahkan keterangan custom jika pilih 'Lain - lain'
    let finalDescription = subCategory;
    if (subCategory === 'Lain - lain' && customDescription) {
      finalDescription = `${category}: ${customDescription}`;
    } else if (customDescription) {
      finalDescription = `${subCategory} (${customDescription})`;
    }

    onAdd({
      date,
      description: finalDescription,
      subCategory: type === TransactionType.EXPENSE ? subCategory : '-',
      amount: numericAmount,
      type,
      category
    });
    
    setAmount('');
    setCustomDescription('');
    setDate(today);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === TransactionType.INCOME ? Category.SALARY : Category.RUMAH);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-100 mb-12 overflow-hidden print:hidden">
      <div className="flex bg-slate-100 p-2">
        <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`flex-1 py-5 rounded-2xl text-base font-black flex items-center justify-center gap-3 transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>PENGELUARAN</button>
        <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`flex-1 py-5 rounded-2xl text-base font-black flex items-center justify-center gap-3 transition-all ${type === TransactionType.INCOME ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}>PEMASUKAN</button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-slate-700 mb-3 uppercase tracking-widest text-[10px] font-black">1. Tanggal Transaksi</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold text-lg" required />
          </div>

          <div>
            <label className="block text-slate-700 mb-3 uppercase tracking-widest text-[10px] font-black">2. Kategori Utama</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold text-lg appearance-none bg-no-repeat bg-[right_1.5rem_center] bg-[length:1.2em_1.2em]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}>
              {(type === TransactionType.EXPENSE ? expenseCategories : incomeCategories).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>

          {type === TransactionType.EXPENSE && (
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-slate-700 mb-3 uppercase tracking-widest text-[10px] font-black">3. Pilih Jenis Pengeluaran</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(SUB_CATEGORIES[category] || []).map((sub) => (
                    // Fix: Removed redundant check for type === TransactionType.INCOME inside a block that is only rendered when type === TransactionType.EXPENSE.
                    <button key={sub} type="button" onClick={() => setSubCategory(sub)} className={`px-4 py-3 rounded-xl border-2 font-black text-xs transition-all ${subCategory === sub ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{sub}</button>
                  ))}
                </div>
              </div>

              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Keterangan Tambahan (Opsional)</label>
                <input type="text" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="Tulis rincian jika perlu..." className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900" />
              </div>
            </div>
          )}

          <div className={type === TransactionType.EXPENSE ? 'md:col-span-2' : ''}>
            <label className="block text-slate-700 mb-3 uppercase tracking-widest text-[10px] font-black">{type === TransactionType.EXPENSE ? '4.' : '3.'} Nominal (IDR)</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-950 font-black text-2xl">Rp</span>
              <input type="text" inputMode="numeric" value={amount} onChange={handleAmountChange} placeholder="0" className={`w-full pl-20 pr-6 py-6 rounded-2xl border-2 border-slate-200 outline-none font-black text-3xl text-slate-900 ${type === TransactionType.INCOME ? 'focus:border-emerald-600' : 'focus:border-rose-600'}`} required />
            </div>
          </div>
        </div>

        <button type="submit" className={`w-full py-6 text-2xl font-black rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 text-white ${type === TransactionType.INCOME ? 'bg-emerald-600' : 'bg-rose-600'}`}>SIMPAN DATA</button>
      </form>
    </div>
  );
};

export default TransactionForm;
