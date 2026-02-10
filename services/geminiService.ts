
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight, Category } from "../types";

// Always use process.env.API_KEY directly for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<FinancialInsight> => {
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
          summary: { type: Type.STRING, description: "Ringkasan kondisi keuangan bulan ini" },
          advice: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-5 tips praktis untuk menghemat atau mengelola uang"
          },
          warnings: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Peringatan jika ada pengeluaran berlebih di kategori tertentu"
          }
        },
        required: ["summary", "advice", "warnings"]
      }
    }
  });

  // Directly access the .text property from the response.
  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr);
};

export const autoCategorize = async (description: string): Promise<Category> => {
  const categories = Object.values(Category).join(", ");
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Kategorikan transaksi berikut: "${description}". Pilih satu dari kategori ini saja: ${categories}. Hanya kembalikan nama kategorinya saja.`,
  });

  const predicted = response.text?.trim() || "";
  // Match with enum
  const match = Object.values(Category).find(c => predicted.includes(c));
  
  // Fix: Property 'OTHER' does not exist on type 'typeof Category'. Use LAIN_LAIN as fallback.
  return (match as Category) || Category.LAIN_LAIN;
};
