import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, TransactionType, FinancialHealthMetric, Insight, Anomaly, CashFlowPoint } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url part
      const base64Data = base64String.split(',')[1];
      resolve({ data: base64Data, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 1. Receipt/Document Parsing Logic
export const parseReceiptImage = async (base64Data: string, mimeType: string = "image/jpeg"): Promise<Partial<Transaction>> => {
  const model = "gemini-2.5-flash";
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      merchant: { type: Type.STRING, description: "Name of the merchant, store, or payer (for income)" },
      date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format" },
      amount: { type: Type.NUMBER, description: "Total amount of the transaction" },
      category: { type: Type.STRING, description: "Category of expense or income source" },
      description: { type: Type.STRING, description: "Brief description of items purchased or income detail" },
      type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"], description: "Whether this is money coming in (INCOME) or going out (EXPENSE)" }
    },
    required: ["merchant", "amount", "category", "type"],
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: "Extract transaction details from this document (receipt, invoice, or bank statement). Identify if it is INCOME or EXPENSE. Return JSON." }
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

// 2. Financial Health Analysis (Updated for Business Context)
export const analyzeFinancialHealth = async (transactions: Transaction[], currency: string = 'USD'): Promise<FinancialHealthMetric> => {
  const model = "gemini-2.5-flash";
  
  const summary = transactions.map(t => 
    `${t.date}: ${t.merchant} (${t.category}) - ${currency} ${t.amount} [${t.type}]`
  ).join('\n');

  const prompt = `
    Analyze the following transaction history for a Small/Medium Enterprise (SME) or individual. User currency is ${currency}.
    Calculate a 'Business Health Score' (0-100).
    Identify cash flow status, projected savings/surplus, specific business risks (e.g., high burn rate, vendor dependency),
    and actionable business recommendations.
    
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
  transactions: Transaction[],
  currency: string = 'USD'
) => {
  const model = "gemini-2.5-flash";
  
  const transactionContext = JSON.stringify(transactions.slice(-20)); 
  const systemInstruction = `
    You are 'Fin', an empathetic, intelligent, and data-driven financial coach for SMEs and individuals.
    Your goal is to help users manage cash flow, budgets, and financial decisions.
    The user's currency is ${currency}.
    You have access to the user's recent transactions: ${transactionContext}.
    
    Guidelines:
    1. Be empathetic but professional.
    2. Be specific. Use the transaction data.
    3. Focus on cash flow and sustainability.
    4. Keep responses concise.
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

// 4. AI Budget Generator
export const generateBudgetPlan = async (transactions: Transaction[], currency: string): Promise<Record<string, number>> => {
  const model = "gemini-2.5-flash";
  const summary = transactions.filter(t => t.type === TransactionType.EXPENSE).map(t => `${t.category}: ${t.amount}`).join('\n');
  
  const prompt = `Based on these expenses, create a realistic monthly budget for each category to improve savings. Return JSON where keys are category names and values are budget limits (numbers). Expenses: ${summary}`;
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      budget: {
        type: Type.OBJECT,
        additionalProperties: { type: Type.NUMBER } // Dynamic keys for categories
      }
    }
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" } // Schema for dynamic keys is tricky, letting model infer
    });
    
    // Fallback parsing strategy for dynamic keys
    const parsed = JSON.parse(result.text || "{}");
    return parsed.budget || parsed;
  } catch (e) {
    console.error("Budget Gen Error", e);
    return { 'General': 1000 };
  }
};

// 5. Smart Insights
export const generateSmartInsights = async (transactions: Transaction[]): Promise<Insight[]> => {
  const model = "gemini-2.5-flash";
  const summary = transactions.map(t => `${t.date}: ${t.merchant} (${t.amount})`).join('\n');

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['SAVINGS', 'PATTERN', 'ALERT'] },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        impactAmount: { type: Type.NUMBER }
      },
      required: ['type', 'title', 'description']
    }
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: `Analyze these transactions for smart insights. Find 3 insights: one savings opportunity, one spending pattern, and one alert (e.g. subscription or increase). Data: ${summary}`,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(result.text || "[]") as Insight[];
  } catch (e) {
    return [];
  }
};

// 6. Fraud/Anomaly Detection
export const detectAnomalies = async (transactions: Transaction[]): Promise<Anomaly[]> => {
  const model = "gemini-2.5-flash";
  const summary = transactions.map(t => `ID:${t.id}, Date:${t.date}, Merch:${t.merchant}, Amt:${t.amount}, Cat:${t.category}`).join('\n');

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        transactionId: { type: Type.STRING },
        reason: { type: Type.STRING },
        severity: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
      },
      required: ['transactionId', 'reason', 'severity']
    }
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: `Analyze these transactions for fraud or anomalies (e.g. duplicates, unusually high amounts, strange merchants). Return list of anomalies. Data: ${summary}`,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(result.text || "[]") as Anomaly[];
  } catch (e) {
    return [];
  }
};

// 7. Cash Flow Prediction
export const predictCashFlow = async (transactions: Transaction[], currentBalance: number): Promise<CashFlowPoint[]> => {
  const model = "gemini-2.5-flash";
  const summary = transactions.map(t => `${t.date}: ${t.amount} (${t.type})`).join('\n');
  const today = new Date().toISOString().split('T')[0];

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING },
        balance: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['PREDICTED'] }
      },
      required: ['date', 'balance', 'type']
    }
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: `Based on transaction history, predict the daily cash flow balance for the next 30 days starting from ${today} with starting balance ${currentBalance}. Account for recurring bills/income. Data: ${summary}`,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(result.text || "[]") as CashFlowPoint[];
  } catch (e) {
    return [];
  }
};