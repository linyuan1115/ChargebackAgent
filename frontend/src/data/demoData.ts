import { DisputeCase } from '../types';

export const demoDisputes: DisputeCase[] = [
  {
    id: '1',
    caseNumber: 'CD2024001',
    transaction: {
      id: 'txn_001',
      amount: 1250.00,
      currency: 'USD',
      merchantName: 'TechMart Online',
      merchantCategory: 'Electronics',
      transactionDate: '2024-01-15T10:30:00Z',
      location: 'New York, NY',
      cardLast4: '4567'
    },
    customer: {
      id: 'cust_001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0123',
      accountType: 'Platinum',
      creditScore: 750,
      customerSince: '2019-03-15',
      previousDisputes: 1
    },
    disputeReason: 'Unauthorized Transaction',
    disputeDescription: 'Customer claims they did not make this transaction and states their credit card was not with them at the stated time. Customer provided location proof.',
    evidence: [
      {
        id: 'ev_001',
        type: 'authorization',
        fileName: 'location_proof.pdf',
        uploadDate: '2024-01-16T09:00:00Z',
        description: 'Customer provided location proof document'
      },
      {
        id: 'ev_002',
        type: 'communication',
        fileName: 'customer_statement.doc',
        uploadDate: '2024-01-16T09:15:00Z',
        description: 'Customer written statement'
      }
    ],
    riskScore: 45,
    aiRecommendation: 'review',
    aiConfidence: 72,
    aiAnalysis: 'This case presents medium risk. Customer provided location proof, but transaction occurred near customer\'s residence area. Customer has good credit history with only one previous dispute.',
    status: 'pending_risk_review',
    createdAt: '2024-01-16T08:00:00Z',
    updatedAt: '2024-01-16T08:00:00Z',
    priority: 'medium'
  },
  {
    id: '2',
    caseNumber: 'CD2024002',
    transaction: {
      id: 'txn_002',
      amount: 89.99,
      currency: 'USD',
      merchantName: 'QuickFood Delivery',
      merchantCategory: 'Food Delivery',
      transactionDate: '2024-01-14T19:45:00Z',
      location: 'San Francisco, CA',
      cardLast4: '8901'
    },
    customer: {
      id: 'cust_002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0456',
      accountType: 'Standard',
      creditScore: 680,
      customerSince: '2021-07-20',
      previousDisputes: 0
    },
    disputeReason: 'Product Quality Issue',
    disputeDescription: 'Customer received food that did not match the order and was of poor quality. Customer contacted merchant with no resolution and requests refund.',
    evidence: [
      {
        id: 'ev_003',
        type: 'receipt',
        fileName: 'food_photos.jpg',
        uploadDate: '2024-01-15T10:30:00Z',
        description: 'Photos of received food'
      },
      {
        id: 'ev_004',
        type: 'communication',
        fileName: 'merchant_chat.pdf',
        uploadDate: '2024-01-15T10:45:00Z',
        description: 'Chat records with merchant'
      }
    ],
    riskScore: 25,
    aiRecommendation: 'approve',
    aiConfidence: 88,
    aiAnalysis: 'Low-risk case. Customer provided sufficient evidence including food photos and merchant communication records. Small transaction amount and excellent customer history. Merchant has records of similar complaints. Recommend approving refund.',
    status: 'pending_risk_review',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    priority: 'low'
  },
  {
    id: '3',
    caseNumber: 'CD2024003',
    transaction: {
      id: 'txn_003',
      amount: 3500.00,
      currency: 'USD',
      merchantName: 'Luxury Watches Co.',
      merchantCategory: 'Luxury Goods',
      transactionDate: '2024-01-13T14:20:00Z',
      location: 'Miami, FL',
      cardLast4: '2345'
    },
    customer: {
      id: 'cust_003',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1-555-0789',
      accountType: 'Black Card',
      creditScore: 820,
      customerSince: '2015-05-10',
      previousDisputes: 3
    },
    disputeReason: 'Duplicate Charge',
    disputeDescription: 'Customer claims they were charged twice for the same watch purchase. Customer provided bank statement as evidence.',
    evidence: [
      {
        id: 'ev_005',
        type: 'receipt',
        fileName: 'bank_statement.pdf',
        uploadDate: '2024-01-14T08:00:00Z',
        description: 'Bank statement showing duplicate charges'
      }
    ],
    riskScore: 75,
    aiRecommendation: 'reject',
    aiConfidence: 65,
    aiAnalysis: 'High-risk case. Although customer has excellent credit score, they have multiple dispute history. Large transaction amount requires careful verification. Recommend contacting merchant to confirm transaction details and check for technical issues causing duplicate charges.',
    status: 'internal_analyzing',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T12:30:00Z',
    priority: 'high'
  },
  {
    id: '4',
    caseNumber: 'CD2024004',
    transaction: {
      id: 'txn_004',
      amount: 199.99,
      currency: 'USD',
      merchantName: 'StreamingPlus',
      merchantCategory: 'Subscription Service',
      transactionDate: '2024-01-12T00:01:00Z',
      location: 'Online',
      cardLast4: '6789'
    },
    customer: {
      id: 'cust_004',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1-555-0321',
      accountType: 'Standard',
      creditScore: 720,
      customerSince: '2020-11-05',
      previousDisputes: 0
    },
    disputeReason: 'Charged After Cancellation',
    disputeDescription: 'Customer cancelled annual subscription in December 2023 but was still charged for 2024. Customer provided cancellation confirmation email.',
    evidence: [
      {
        id: 'ev_006',
        type: 'communication',
        fileName: 'cancellation_email.pdf',
        uploadDate: '2024-01-13T16:20:00Z',
        description: 'Subscription cancellation confirmation email'
      }
    ],
    riskScore: 20,
    aiRecommendation: 'approve',
    aiConfidence: 92,
    aiAnalysis: 'Low-risk case. Customer provided clear cancellation confirmation email and has excellent customer history. Technical errors in subscription services are common. Strongly recommend approving refund.',
    status: 'merchant_investigation',
    createdAt: '2024-01-13T17:00:00Z',
    updatedAt: '2024-01-13T17:30:00Z',
    priority: 'low'
  },
  {
    id: '5',
    caseNumber: 'CD2024005',
    transaction: {
      id: 'txn_005',
      amount: 850.00,
      currency: 'USD',
      merchantName: 'AirTravel Bookings',
      merchantCategory: 'Travel Services',
      transactionDate: '2024-01-10T16:45:00Z',
      location: 'Chicago, IL',
      cardLast4: '1234'
    },
    customer: {
      id: 'cust_005',
      name: 'Robert Wilson',
      email: 'robert.wilson@email.com',
      phone: '+1-555-0654',
      accountType: 'Gold',
      creditScore: 695,
      customerSince: '2018-09-22',
      previousDisputes: 2
    },
    disputeReason: 'Service Not Provided',
    disputeDescription: 'Customer\'s travel was cancelled due to flight cancellation. Merchant refused refund claiming non-refundable terms. Customer believes this is unreasonable.',
    evidence: [
      {
        id: 'ev_007',
        type: 'communication',
        fileName: 'flight_cancellation.pdf',
        uploadDate: '2024-01-11T10:00:00Z',
        description: 'Airline flight cancellation notice'
      },
      {
        id: 'ev_008',
        type: 'communication',
        fileName: 'merchant_refusal.pdf',
        uploadDate: '2024-01-11T11:30:00Z',
        description: 'Merchant refund refusal email'
      }
    ],
    riskScore: 55,
    aiRecommendation: 'review',
    aiConfidence: 78,
    aiAnalysis: 'Medium-risk case. Customer has reasonable grounds for refund (flight cancellation), but merchant terms may indeed not support refund. Requires detailed review of service terms and consumer protection regulations. Recommend legal department involvement in assessment.',
    status: 'pending_risk_review',
    createdAt: '2024-01-11T12:00:00Z',
    updatedAt: '2024-01-11T12:00:00Z',
    priority: 'medium'
  }
];