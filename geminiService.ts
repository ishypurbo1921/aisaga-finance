
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight, Category } from "../types";

const getAIInstance = () => {
  // Mencoba mengambil API KEY dari environment variable
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "YOUR_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<FinancialInsight> => {
  const ai = getAIInstance();
  
  if (!ai) {
    return {
      summary: "Analisis AI belum aktif. Pasang API_KEY di Dashboard Vercel (Settings > Environment Variables) untuk mengaktifkan fitur ini.",
      advice: ["Aplikasi tetap berfungsi normal untuk pencatatan manual."],
      warnings: ["Fitur saran AI tidak tersedia."]
    };
  }

  try {
    const dataString = JSON.stringify(transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      category: t.category,
      desc: t.description
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analisis data keuangan rumah tangga berikut dan berikan saran dalam Bahasa Indonesia: ${dataString}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "advice", "warnings"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : { summary: "Gagal memproses data AI.", advice: [], warnings: [] };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      summary: "Gagal menghubungi AI. Pastikan kuota API masih tersedia.",
      advice: ["Coba lagi beberapa saat lagi."],
      warnings: ["Kesalahan koneksi AI."]
    };
  }
};

export const autoCategorize = async (description: string): Promise<Category> => {
  const ai = getAIInstance();
  if (!ai) return Category.LAIN_LAIN;

  try {
    const categories = Object.values(Category).join(", ");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Kategorikan transaksi berikut: "${description}". Pilih satu dari kategori ini saja: ${categories}. Hanya kembalikan nama kategorinya saja.`,
    });

    const predicted = response.text?.trim() || "";
    const match = Object.values(Category).find(c => predicted.includes(c));
    return (match as Category) || Category.LAIN_LAIN;
  } catch {
    return Category.LAIN_LAIN;
  }
};
