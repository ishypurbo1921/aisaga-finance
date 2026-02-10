
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Transaction, TransactionType, Category, getFinancialCycle } from '../types';

interface DashboardChartsProps {
  transactions: Transaction[];
  currentCycleLabel: string;
}

// Ultra-vibrant contrast palette
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];

const DashboardCharts: React.FC<DashboardChartsProps> = ({ transactions, currentCycleLabel }) => {
  const currentCycleExpenses = transactions.filter(t => 
    t.type === TransactionType.EXPENSE && getFinancialCycle(t.date) === currentCycleLabel
  );
  
  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    value: currentCycleExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(d => d.value > 0);

  const cycleTrend = transactions.reduce((acc: any[], t) => {
    const cycle = getFinancialCycle(t.date);
    const existing = acc.find(item => item.cycle === cycle);
    if (existing) {
      if (t.type === TransactionType.INCOME) existing.income += t.amount;
      else existing.expense += t.amount;
    } else {
      acc.push({
        cycle,
        income: t.type === TransactionType.INCOME ? t.amount : 0,
        expense: t.type === TransactionType.EXPENSE ? t.amount : 0
      });
    }
    return acc;
  }, []).sort((a, b) => {
    const dateA = transactions.find(t => getFinancialCycle(t.date) === a.cycle)?.date || '';
    const dateB = transactions.find(t => getFinancialCycle(t.date) === b.cycle)?.date || '';
    return dateA.localeCompare(dateB);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-slate-100">
        <h3 className="text-2xl font-black mb-1 text-slate-950">Alokasi Dana</h3>
        <p className="text-sm font-bold text-slate-500 mb-10 uppercase tracking-widest">Periode {currentCycleLabel}</p>
        <div className="h-[350px]">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={4} stroke="#fff" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} 
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-black uppercase tracking-tighter">Tidak Ada Pengeluaran Terdeteksi</div>
          )}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-slate-100">
        <h3 className="text-2xl font-black mb-1 text-slate-950">Kesehatan Arus Kas</h3>
        <p className="text-sm font-bold text-slate-500 mb-10 uppercase tracking-widest">Perbandingan Antar Siklus</p>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cycleTrend} margin={{top: 10, right: 10, left: 10, bottom: 0}}>
              <XAxis dataKey="cycle" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
              <YAxis tickFormatter={(val) => `${(val/1000000).toFixed(1)}jt`} fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} 
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px', fontWeight: 'bold'}} />
              <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[8, 8, 8, 8]} barSize={25} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[8, 8, 8, 8]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
