
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight, Category } from "../types";

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<FinancialInsight> => {
  const ai = getAIInstance();
  if (!ai) {
    return {
      summary: "Analisis AI tidak tersedia. Silakan konfigurasi API_KEY di Vercel Settings.",
      advice: ["Anda tetap bisa menggunakan aplikasi untuk mencatat transaksi secara manual."],
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

    const text = response.text;
    return text ? JSON.parse(text) : { summary: "Gagal memproses data AI.", advice: [], warnings: [] };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      summary: "Terjadi kesalahan saat menghubungi AI.",
      advice: ["Pastikan API Key Anda valid dan memiliki kuota."],
      warnings: ["Error API."]
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
