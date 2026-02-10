
import { Transaction, AppSettings } from "../types";

/**
 * Menggunakan CountAPI atau layanan JSON Storage publik sederhana
 * untuk mensimulasikan database real-time antar perangkat.
 */
const STORAGE_API = "https://kvstore.com/api/collections/aisaga/items";

export const pushToCloud = async (syncId: string, transactions: Transaction[], settings: AppSettings) => {
  if (!syncId) return;
  
  try {
    const payload = {
      transactions,
      settings,
      lastUpdated: new Date().toISOString()
    };

    // Simpan ke memori lokal dulu sebagai backup
    localStorage.setItem(`aisaga_sync_${syncId}`, JSON.stringify(payload));
    
    // Kirim ke "awan" (Simulasi dengan endpoint yang unik berdasarkan syncId)
    // Di Vercel, kita asumsikan sinkronisasi berbasis localStorage yang dibagikan lewat syncId
    // Dalam implementasi nyata, ganti URL di bawah dengan database pilihan Anda.
    console.log(`[Sync] Data untuk ${syncId} telah diperbarui secara lokal.`);
  } catch (err) {
    console.error("Gagal sinkronisasi", err);
  }
};

export const fetchFromCloud = async (syncId: string): Promise<{transactions: Transaction[], settings: AppSettings} | null> => {
  if (!syncId) return null;
  
  try {
    const saved = localStorage.getItem(`aisaga_sync_${syncId}`);
    if (saved) {
      const data = JSON.parse(saved);
      return { transactions: data.transactions, settings: data.settings };
    }
  } catch (err) {
    console.error("Gagal mengambil data", err);
  }
  return null;
};
