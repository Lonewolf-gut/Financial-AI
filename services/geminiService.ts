import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, TransactionType, FinancialHealthMetric } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url part
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 1. Receipt Parsing Logic
export const parseReceiptImage = async (base64Image: string): Promise<Partial<Transaction>> => {
  const model = "gemini-2.5-flash";
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      merchant: { type: Type.STRING, description: "Name of the merchant or store" },
      date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format" },
      amount: { type: Type.NUMBER, description: "Total amount of the transaction" },
      category: { type: Type.STRING, description: "Category of expense (e.g., Food, Transport, Utilities, Retail)" },
      description: { type: Type.STRING, description: "Brief description of items purchased" },
    },
    required: ["merchant", "amount", "category"],
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Extract transaction details from this receipt. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = result.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    return JSON.parse(text) as Partial<Transaction>;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};

// 2. Financial Health Analysis
export const analyzeFinancialHealth = async (transactions: Transaction[]): Promise<FinancialHealthMetric> => {
  const model = "gemini-2.5-flash";
  
  // Prepare data summary for the prompt
  const summary = transactions.map(t => 
    `${t.date}: ${t.merchant} (${t.category}) - $${t.amount} [${t.type}]`
  ).join('\n');

  const prompt = `
    Analyze the following financial transaction history.
    Provide a health score (0-100), a status label, projected savings for next month based on trends,
    identify 3 potential risks (e.g., recurring large expenses, increasing frequency of dining out),
    and 3 specific actionable recommendations.
    
    Transactions:
    ${summary}
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      status: { type: Type.STRING, enum: ["Critical", "Warning", "Healthy", "Excellent"] },
      cashFlowStatus: { type: Type.STRING, description: "A short sentence describing cash flow health" },
      projectedSavings: { type: Type.NUMBER },
      risks: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["score", "status", "risks", "recommendations"]
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    
    return JSON.parse(result.text || "{}") as FinancialHealthMetric;
  } catch (error) {
    console.error("Error analyzing finances:", error);
    // Return a fallback if AI fails to prevent app crash
    return {
      score: 50,
      status: "Warning",
      cashFlowStatus: "Unable to analyze at this moment.",
      projectedSavings: 0,
      risks: ["Data unavailable"],
      recommendations: ["Try again later"]
    };
  }
};

// 3. Chat Coach
export const getCoachResponse = async (
  message: string, 
  history: { role: string; parts: { text: string }[] }[],
  transactions: Transaction[]
) => {
  const model = "gemini-2.5-flash";
  
  // Context injection
  const transactionContext = JSON.stringify(transactions.slice(-20)); // Last 20 transactions
  const systemInstruction = `
    You are 'Fin', an empathetic, intelligent, and data-driven financial coach.
    Your goal is to help users build wealth, avoid debt, and reduce financial anxiety.
    You have access to the user's recent transactions: ${transactionContext}.
    
    Guidelines:
    1. Be empathetic. Money is emotional. Acknowledge stress.
    2. Be specific. Use the transaction data to point out patterns (e.g., "I noticed you spent $200 on coffee this month").
    3. Be actionable. Don't just say "save more". Say "If you cut 2 takeout meals, you save $40".
    4. Keep responses concise and conversational.
  `;

  try {
    const chat = ai.chats.create({
      model,
      config: { systemInstruction },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to my financial database right now. Please try again in a moment.";
  }
};