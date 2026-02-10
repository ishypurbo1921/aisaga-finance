
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  SEKOLAH = 'Sekolah',
  LES = 'Les',
  KONSUMSI = 'Konsumsi',
  ANAK_JINGGA = 'Anak Jingga',
  RUMAH = 'Rumah',
  TABUNGAN = 'Tabungan',
  KESEHATAN = 'Kesehatan',
  SALARY = 'Gaji Utama',
  INVESTMENT = 'Investasi',
  BONUS = 'Bonus Suami/Istri',
  LAIN_LAIN = 'Lain-lain'
}

export interface Transaction {
  id: string;
  date: string;
  description: string; 
  subCategory: string;
  amount: number;
  type: TransactionType;
  category: Category;
  isAuto?: boolean;
}

export interface AppSettings {
  autoIncomeAmount: number;
  autoIncomeEnabled: boolean;
  initialSavings: number;
  syncId: string; // ID unik untuk sinkronisasi antar perangkat
}

export interface FinancialInsight {
  summary: string;
  advice: string[];
  warnings: string[];
}

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

export const SUB_CATEGORIES: Record<string, string[]> = {
  [Category.SEKOLAH]: ['Pembayaran/Beli Buku', 'Infaq', 'Zakat', 'Sedekah', 'Beli Seragam/Aksesori', 'Lain - lain'],
  [Category.LES]: ['Sempoa', 'Bahasa Inggris', 'Bahasa Arab', 'Mengaji', 'Renang', 'Tari', 'Lain - lain'],
  [Category.KONSUMSI]: ['Makan di Luar', 'Jajan di Luar', 'Lain - lain'],
  [Category.ANAK_JINGGA]: ['Uang Saku Sekolah', 'Uang Saku Main', 'Lain - lain'],
  [Category.RUMAH]: ['Listrik', 'PDAM', 'Bensin Motor', 'Sumbangan Desa', 'Mingguan Rumah Tangga', 'Belanja Mingguan/Bulanan', 'Lain - lain'],
  [Category.TABUNGAN]: ['Tabungan Umum', 'Dana Darurat', 'Investasi', 'Lain - lain'],
  [Category.KESEHATAN]: ['Obat/Rumah Sakit', 'Vitamin', 'Lain - lain'],
};

export const getFinancialCycle = (dateStr: string): string => {
  const d = new Date(dateStr);
  const day = d.getDate();
  let startDate: Date;
  let endDate: Date;

  if (day >= 25) {
    startDate = new Date(d.getFullYear(), d.getMonth(), 25);
    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 24);
  } else {
    startDate = new Date(d.getFullYear(), d.getMonth() - 1, 25);
    endDate = new Date(d.getFullYear(), d.getMonth(), 24);
  }

  const startM = MONTH_NAMES[startDate.getMonth()];
  const endM = MONTH_NAMES[endDate.getMonth()];
  const year = endDate.getFullYear();

  return `25 ${startM} - 24 ${endM} ${year}`;
};

export const getCurrentCycleLabel = (): string => {
  const now = new Date();
  if (now.getFullYear() < 2026) return getFinancialCycle("2026-01-25");
  return getFinancialCycle(now.toISOString().split('T')[0]);
};

export const getAvailableCycles = (transactions: Transaction[]): string[] => {
  const cycles = new Set<string>();
  for (let year = 2026; year <= 2030; year++) {
    for (let month = 0; month < 12; month++) {
      const d = new Date(year, month, 25);
      cycles.add(getFinancialCycle(d.toISOString().split('T')[0]));
    }
  }
  transactions.forEach(t => cycles.add(getFinancialCycle(t.date)));
  return Array.from(cycles).sort((a, b) => {
    const parseDate = (label: string) => {
      const parts = label.split(' ');
      return new Date(parseInt(parts[parts.length-1]), MONTH_NAMES.indexOf(parts[1]), parseInt(parts[0])).getTime();
    };
    return parseDate(a) - parseDate(b);
  });
};
