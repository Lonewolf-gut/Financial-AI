export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  type: TransactionType;
  description?: string;
}

export interface FinancialHealthMetric {
  score: number; // 0-100
  status: 'Critical' | 'Warning' | 'Healthy' | 'Excellent';
  cashFlowStatus: string;
  projectedSavings: number;
  risks: string[];
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  RECEIPT_SCANNER = 'RECEIPT_SCANNER',
  COACH = 'COACH',
  FORECAST = 'FORECAST',
  BUDGETS = 'BUDGETS',
  INSIGHTS = 'INSIGHTS',
  ANOMALIES = 'ANOMALIES',
  CASHFLOW = 'CASHFLOW'
}

export interface SpendingCategory {
  name: string;
  value: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Insight {
  type: 'SAVINGS' | 'PATTERN' | 'ALERT';
  title: string;
  description: string;
  impactAmount?: number;
}

export interface Anomaly {
  transactionId: string;
  reason: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CashFlowPoint {
  date: string;
  balance: number;
  type: 'ACTUAL' | 'PREDICTED';
}