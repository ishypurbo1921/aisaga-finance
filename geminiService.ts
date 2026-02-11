
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight, Category } from "../types";

// Inisialisasi aman: Cek apakah API_KEY tersedia
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<FinancialInsight> => {
  const ai = getAIInstance();
  if (!ai) {
    return {
      summary: "Analisis AI tidak tersedia karena API Key belum dikonfigurasi.",
      advice: ["Silakan masukkan API Key di pengaturan lingkungan untuk mengaktifkan fitur ini."],
      warnings: ["Fitur AI non-aktif."]
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

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
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
