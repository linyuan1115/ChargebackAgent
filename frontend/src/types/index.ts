export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  merchantName: string;
  merchantCategory: string;
  transactionDate: string;
  location: string;
  cardLast4: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: string;
  creditScore: number;
  customerSince: string;
  previousDisputes: number;
}

export interface Evidence {
  id: string;
  type: 'receipt' | 'communication' | 'authorization' | 'other';
  fileName: string;
  uploadDate: string;
  description: string;
}

export interface DisputeCase {
  id: string;
  caseNumber: string;
  transaction: Transaction;
  customer: Customer;
  disputeReason: string;
  disputeDescription: string;
  evidence?: Evidence[]; // Made optional for API compatibility
  riskScore: number;
  aiRecommendation: 'approve' | 'reject' | 'review' | 'merchant_investigation';
  aiConfidence: number;
  aiAnalysis: string;
  humanDecision?: 'approve' | 'reject' | 'investigate' | 'send_to_merchant';
  analystFeedback?: string;
  status: 'pending' | 'analyzing' | 'review' | 'completed' | 'pending_risk_review' | 'internal_analyzing' | 'merchant_investigation' | 'representment_raised' | 'admitted_closed' | 'representment_win_back' | 'representment_lost';
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  // New categorization fields
  category?: string; // FRAUD_UNAUTHORIZED, PROCESSING_ISSUES, MERCHANT_MERCHANDISE
  subcategory?: string; // 1A_Card_Fraud, 2B_Technical_Processing, etc.
  reasonCode?: string; // Visa/MC/Amex reason codes
  cardNetwork?: string; // visa, mastercard, amex
}

export interface AnalysisResult {
  riskScore: number;
  recommendation: 'approve' | 'reject' | 'review' | 'merchant_investigation';
  confidence: number;
  analysis: string;
  keyFactors: string[];
  warningFlags: string[];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: string;
  data?: any;
}
