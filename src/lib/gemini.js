import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

export async function analyzeReceipt(file) {
  if (!API_KEY) {
    throw new Error("Gemini API anahtarı eksik. Lütfen .env dosyasını veya Vercel ayarlarını kontrol edin.");
  }

  console.log("Analyzing file:", file.name, "Type:", file.type, "Size:", file.size);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    const prompt = "Bu fişi analiz et ve şu JSON formatında yanıt ver: { merchant: 'işyeri adı', date: 'YYYY-MM-DD', amount: 'toplam tutar (sadece sayı)', category_guess: 'food|transport|shopping|bills|other' (tahmin et) }. Sadece JSON döndür.";

    const imagePart = await fileToGenerativePart(file);

    if (!imagePart.inlineData.mimeType) {
      console.warn("MimeType missing, defaulting to image/jpeg");
      imagePart.inlineData.mimeType = "image/jpeg";
    }

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

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
