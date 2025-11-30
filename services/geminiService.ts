import { GoogleGenAI, Type } from "@google/genai";
import { ParsedReceiptData } from '../types';

const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing Gemini API Key. Please set VITE_GEMINI_API_KEY in your .env file.");
    throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseReceiptImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<ParsedReceiptData> => {
  const ai = getGenAI();

  const prompt = `
    Analyze this image, which could be a printed receipt or a handwritten expense note/ledger.
    Extract the merchant name (or payee/description for handwritten notes), date (YYYY-MM-DD), subtotal, tax, and total amount.
    
    **Handwritten Text Handling:**
    - If the image is a handwritten note, do your best to decipher the handwriting.
    - "Merchant Name" can be the person paid, the item bought, or a short description of the expense (e.g., "Lunch", "Taxi", "Market").
    
    **Currency Detection:** Look for symbols like $, €, £, ¥, ₹ (Rupee), K (Kyat). 
    Return the 3-letter ISO code (USD, EUR, GBP, INR, MMK, etc). Default to 'USD' if unsure.

    **Line Item Extraction & Categorization:**
    List all individual line items.
    IMPORTANT: You MUST categorize each item into EXACTLY one of the following categories based on the item name:
    - 'Food' (Groceries, Food, Supermarket items, Restaurants)
    - 'Utilities' (Electricity, Water, Internet, Phone)
    - 'Personal' (Books, Education, School supplies, Personal care)
    - 'Entertainment' (Movies, Games, Hobbies, Dining out)
    - 'Housing' (Rent, Repairs, Furniture, Home improvement)
    - 'Medical' (Medicine, Doctor, Gym, Health, Healthcare)
    - 'Transportation' (Gas, Car, Bus, Taxi, Travel expenses)
    - 'Other' (Anything else)

    Do NOT create new categories. Use 'Other' if unsure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING },
            date: { type: Type.STRING },
            currency: { type: Type.STRING },
            subtotal: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as ParsedReceiptData;

    if (!data.items) data.items = [];

    // Normalize date to YYYY-MM-DD format
    if (data.date) {
      try {
        const dateObj = new Date(data.date);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          data.date = `${year}-${month}-${day}`;
        } else {
          data.date = new Date().toISOString().split('T')[0];
        }
      } catch (e) {
        data.date = new Date().toISOString().split('T')[0];
      }
    } else {
      data.date = new Date().toISOString().split('T')[0];
    }

    return data;
  } catch (error: unknown) {
    console.error("Gemini OCR Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to analyze receipt: ${errorMessage}`);
  }
};