import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the new client
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type || "image/jpeg",
    },
  };
}

export async function analyzeReceipt(file) {
  if (!API_KEY) {
    throw new Error("Gemini API anahtarı eksik. Lütfen .env dosyasını veya Vercel ayarlarını kontrol edin.");
  }

  console.log("Analyzing file:", file.name, "Type:", file.type, "Size:", file.size);

  try {
    // Use the new SDK method signature
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Bu fişi analiz et ve şu JSON formatında yanıt ver: { title: 'işyeri adı', date: 'YYYY-MM-DD', amount: 'toplam tutar (sadece sayı)', category_guess: 'food|transport|shopping|bills|other' (tahmin et) }. Sadece JSON döndür." },
            await fileToGenerativePart(file)
          ]
        }
      ]
    });

    const text = response.text;

    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      throw new Error("Yapay zeka yanıtı anlaşılamadı.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Yapay zeka servisine erişilemedi: " + error.message);
  }
}

export async function analyzeStatement(file) {
  if (!API_KEY) {
    throw new Error("Gemini API anahtarı eksik.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Bu kredi kartı ekstresini veya banka dökümünü analiz et. Tüm harcama ve ödemeleri tek tek çıkar. Şu JSON formatında bir DİZİ (Array) döndür: [{ date: 'YYYY-MM-DD', title: 'İşyeri/İşlem Adı', amount: Tutar (Sayı, pozitif olmalı), type: 'expense' (harcama ise) veya 'income' (ödeme/maaş ise), category: 'food|transport|shopping|bills|other' (tahmin et) }]. Sadece JSON dizisi döndür." },
            await fileToGenerativePart(file)
          ]
        }
      ]
    });

    const text = response.text;
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Statement Analysis Error:", error);
    throw new Error("Ekstre analiz edilemedi: " + error.message);
  }
}
