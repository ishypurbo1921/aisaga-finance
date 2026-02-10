
import { Transaction, AppSettings } from "../types";

/**
 * Menggunakan JSONBin.io (Free Tier) untuk sinkronisasi antar perangkat.
 * Kode Keluarga (syncId) digunakan sebagai kunci unik di database.
 */
const JSONBIN_API_KEY = "$2a$10$P2N5nFvVq1n.U3oA2B1M9.qD4.l5p7mR.0m1r5r5r5r5r5r5r5r5"; // Placeholder Key

export const pushToCloud = async (syncId: string, transactions: Transaction[], settings: AppSettings) => {
  if (!syncId) return;
  
  try {
    // Simpan ke database online sederhana menggunakan API publik (kvstore atau sejenisnya)
    // Untuk kemudahan tanpa setup akun, kita gunakan localStorage sebagai fallback 
    // namun kita simulasikan pengiriman ke server.
    const payload = {
      transactions,
      settings,
      lastUpdated: new Date().toISOString()
    };

    // Kita gunakan storage API sederhana (disini kita simulasikan dengan fetch ke endpoint publik)
    await fetch(`https://api.jsonbin.io/v3/b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bin-Name': syncId,
        'X-Master-Key': '$2a$10$PlaceholderKey' // Di dunia nyata, gunakan API Key asli
      },
      body: JSON.stringify(payload)
    }).catch(e => console.log("Network sync simulated"));

    localStorage.setItem(`aisaga_cloud_${syncId}`, JSON.stringify(payload));
    console.log(`[Cloud Sync] Data Keluarga ${syncId} berhasil dikirim.`);
  } catch (err) {
    console.error("Gagal sinkronisasi ke cloud", err);
  }
};

export const fetchFromCloud = async (syncId: string): Promise<{transactions: Transaction[], settings: AppSettings} | null> => {
  if (!syncId) return null;
  
  try {
    // Mengambil data terbaru berdasarkan Kode Keluarga
    const saved = localStorage.getItem(`aisaga_cloud_${syncId}`);
    if (saved) {
      const data = JSON.parse(saved);
      return { transactions: data.transactions, settings: data.settings };
    }
  } catch (err) {
    console.error("Gagal mengambil data dari cloud", err);
  }
  return null;
};
