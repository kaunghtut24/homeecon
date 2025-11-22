import { GoogleGenAI, Type } from "@google/genai";
import { ParsedReceiptData } from '../types';

const getGenAI = () => {
  if (!process.env.API_KEY) {
    console.error("Missing API_KEY");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const parseReceiptImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<ParsedReceiptData> => {
  const ai = getGenAI();
  
  const prompt = `
    Analyze this receipt image. Extract the merchant name, date (YYYY-MM-DD), subtotal, tax, and total amount.
    
    **Currency Detection:** Look for symbols like $, €, £, ¥, ₹ (Rupee), K (Kyat). 
    Return the 3-letter ISO code (USD, EUR, GBP, INR, MMK, etc). Default to 'USD' if unsure.

    **Line Item Extraction & Categorization:**
    List all individual line items.
    IMPORTANT: You MUST categorize each item into EXACTLY one of the following categories based on the item name:
    - 'Groceries' (Food, Supermarket items)
    - 'Utilities' (Electricity, Water, Internet, Phone)
    - 'Education' (Books, Tuition, School supplies)
    - 'Entertainment' (Movies, Games, Dining out at Restaurants, Hobbies)
    - 'Housing' (Rent, Repairs, Furniture)
    - 'Health' (Medicine, Doctor, Gym)
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
    if (!data.date) data.date = new Date().toISOString().split('T')[0];
    
    return data;
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Failed to analyze receipt. Please try again or enter manually.");
  }
};