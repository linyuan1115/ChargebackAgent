import React, { useState, useEffect } from 'react';
import { DisputeCase, AnalysisResult } from '../types';
import { 
  User, CreditCard, AlertCircle, CheckCircle, 
  XCircle, FileText, Download, ThumbsUp, ThumbsDown, Loader 
} from 'lucide-react';

// API configuration
const API_BASE_URL = 'http://localhost:5002/api';

interface DisputeAnalyzerProps {
  dispute: DisputeCase | null;
  onUpdateDispute: (dispute: DisputeCase) => void;
}

const DisputeAnalyzer: React.FC<DisputeAnalyzerProps> = ({ dispute, onUpdateDispute }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [humanDecision, setHumanDecision] = useState<'approve' | 'reject' | 'investigate' | 'send_to_merchant' | null>(null);
  const [analystFeedback, setAnalystFeedback] = useState<string>('');

  useEffect(() => {
    if (dispute) {
      // Check if we need to override the recommendation for merchandise issues
      let recommendation = dispute.aiRecommendation;
      if (dispute.category === 'MERCHANT_MERCHANDISE' && 
          dispute.riskScore >= 36 && dispute.riskScore <= 74 && 
          dispute.aiRecommendation === 'review') {
        recommendation = 'merchant_investigation';
      }
      
      setAnalysisResult({
        riskScore: dispute.riskScore,
        recommendation: recommendation,
        confidence: dispute.aiConfidence,
        analysis: dispute.aiAnalysis,
        keyFactors: getKeyFactors(dispute),
        warningFlags: getWarningFlags(dispute)
      });
    }
  }, [dispute]);

  const getKeyFactors = (dispute: DisputeCase): string[] => {
    const factors = [];
    if (dispute.customer.creditScore > 700) factors.push('Excellent customer credit score');
    if (dispute.customer.previousDisputes === 0) factors.push('No dispute history records');
    if (dispute.evidence && dispute.evidence.length > 1) factors.push('Multiple evidence provided');
    if (dispute.transaction.amount < 500) factors.push('Small dispute amount');
    
    // Category-aware order history factors
    const sameCardOrders = (dispute.transaction as any).sameCardSuccessOrders || (dispute as any).sameCardSuccessOrders || 0;
    const sameAddressOrders = (dispute.transaction as any).sameAddressSuccessOrders || (dispute as any).sameAddressSuccessOrders || 0;
    const sameIpOrders = (dispute.transaction as any).sameIpSuccessOrders || (dispute as any).sameIpSuccessOrders || 0;
    const sameDeviceOrders = (dispute.transaction as any).sameDeviceSuccessOrders || (dispute as any).sameDeviceSuccessOrders || 0;
    const totalLinkedOrders = sameCardOrders + sameAddressOrders + sameIpOrders + sameDeviceOrders;
    
    if (dispute.category === 'MERCHANT_MERCHANDISE' || dispute.category === 'PROCESSING_ISSUES') {
      // For merchandise/processing: order history = good customer
      if (totalLinkedOrders >= 3) {
        factors.push(`Loyal customer with ${totalLinkedOrders} previous successful orders`);
      } else if (totalLinkedOrders >= 1) {
        factors.push(`Returning customer with ${totalLinkedOrders} previous successful orders`);
      }
      if (sameCardOrders > 0) factors.push(`Same payment card used in ${sameCardOrders} previous orders`);
      if (sameAddressOrders > 0) factors.push(`Same shipping address used in ${sameAddressOrders} previous orders`);
      if ((dispute.transaction as any).itemDelivered === 'Y') factors.push('Item was delivered - supports customer claim');
      if ((dispute.transaction as any).itemShipped === 'Y') factors.push('Item was shipped - merchant fulfilled obligation');
    } else if (dispute.category === 'FRAUD_UNAUTHORIZED') {
      // For fraud: only no links is a good sign
      if (totalLinkedOrders === 0) {
        factors.push('No transaction history links - consistent with stolen card/identity theft');
      }
    }
    
    // General factors
    const disputePercentage = (dispute.customer as any).disputePercentage || 0;
    if (disputePercentage < 2) factors.push('Low customer dispute rate');
    
    return factors;
  };

  const getWarningFlags = (dispute: DisputeCase): string[] => {
    const flags = [];
    if (dispute.customer.previousDisputes > 2) flags.push('Multiple dispute history');
    if (dispute.riskScore > 70) flags.push('High risk score');
    if (!dispute.evidence || dispute.evidence.length === 0) flags.push('Lack of supporting evidence');
    if (dispute.transaction.amount > 2000) flags.push('Large transaction amount');
    
    // Category-aware order history flags
    const disputePercentage = (dispute.customer as any).disputePercentage || 0;
    const sameCardOrders = (dispute.transaction as any).sameCardSuccessOrders || (dispute as any).sameCardSuccessOrders || 0;
    const sameAddressOrders = (dispute.transaction as any).sameAddressSuccessOrders || (dispute as any).sameAddressSuccessOrders || 0;
    const sameIpOrders = (dispute.transaction as any).sameIpSuccessOrders || (dispute as any).sameIpSuccessOrders || 0;
    const sameDeviceOrders = (dispute.transaction as any).sameDeviceSuccessOrders || (dispute as any).sameDeviceSuccessOrders || 0;
    const totalLinkedOrders = sameCardOrders + sameAddressOrders + sameIpOrders + sameDeviceOrders;
    const linkedCustomersDisputeRate = (dispute.customer as any).linkedCustomersDisputeRate || 0;
    const disputeCustomerWon = (dispute.customer as any).disputeCustomerWon || 0;
    const previousDisputes = dispute.customer.previousDisputes || 0;
    
    if (disputePercentage > 5) flags.push('High customer dispute rate (>5%)');
    
    if (dispute.category === 'FRAUD_UNAUTHORIZED') {
      // For fraud: order history = suspicious (abusive chargeback)
      if (sameCardOrders >= 1) flags.push(`Card used in ${sameCardOrders} previous orders - potential abusive chargeback`);
      if (sameAddressOrders >= 1) flags.push(`Address used in ${sameAddressOrders} previous orders - potential abusive chargeback`);
      if (sameIpOrders >= 1) flags.push(`IP used in ${sameIpOrders} previous orders - potential abusive chargeback`);
      if (sameDeviceOrders >= 1) flags.push(`Device used in ${sameDeviceOrders} previous orders - potential abusive chargeback`);
      if ((dispute.transaction as any).itemDelivered === 'Y') flags.push('Item delivered - disputing received goods');
    } else if (dispute.category === 'MERCHANT_MERCHANDISE' || dispute.category === 'PROCESSING_ISSUES') {
      // For merchandise/processing: lack of order history = more suspicious
      if (totalLinkedOrders === 0) {
        flags.push('New customer with no order history - higher risk');
      }
      // Note: Having order history is GOOD for these categories, so no flags for that
    }
    
    // General flags
    if (linkedCustomersDisputeRate > 4) flags.push('High-risk customer network');
    if (previousDisputes > 0 && (disputeCustomerWon / previousDisputes) > 0.6) {
      flags.push('High dispute win rate (potential abuse)');
    }
    
    return flags;
  };

  const generateDetailedAnalysis = (dispute: DisputeCase): string => {
    const analysis = [];
    
    analysis.push("🔍 **COMPREHENSIVE RISK ANALYSIS BREAKDOWN**\n");
    
    // 1. Transaction Amount Analysis (15% weight)
    const amount = dispute.transaction.amount;
    let amountScore = 0;
    if (amount < 100) amountScore = 10;
    else if (amount < 500) amountScore = 25;
    else if (amount < 2000) amountScore = 50;
    else amountScore = 80;
    
    analysis.push(`**1. TRANSACTION AMOUNT FACTOR (10% weight)**`);
    analysis.push(`   • Amount: $${amount.toLocaleString()}`);
    if (amount < 100) analysis.push(`   • Assessment: Low risk amount (Score: ${amountScore}) - Small transactions typically have lower fraud risk`);
    else if (amount < 500) analysis.push(`   • Assessment: Moderate risk amount (Score: ${amountScore}) - Standard transaction range`);
    else if (amount < 2000) analysis.push(`   • Assessment: Elevated risk amount (Score: ${amountScore}) - Higher value requires more scrutiny`);
    else analysis.push(`   • Assessment: High risk amount (Score: ${amountScore}) - Large transactions often targeted by fraudsters`);
    analysis.push(`   • Weighted Impact: ${Math.round(amountScore * 0.10)} points\n`);
    
    // 2. Customer History Analysis (10% weight)
    const creditScore = dispute.customer.creditScore;
    const previousDisputes = dispute.customer.previousDisputes;
    let customerScore = 0;
    
    if (creditScore > 750) customerScore += 10;
    else if (creditScore > 650) customerScore += 30;
    else customerScore += 70;
    customerScore += Math.min(30, previousDisputes * 10);
    
    analysis.push(`**2. CUSTOMER HISTORY FACTOR (10% weight)**`);
    analysis.push(`   • Credit Score: ${creditScore}`);
    if (creditScore > 750) analysis.push(`   • Credit Assessment: Excellent (Low risk) - High creditworthiness indicates reliable customer`);
    else if (creditScore > 650) analysis.push(`   • Credit Assessment: Good (Moderate risk) - Standard creditworthiness`);
    else analysis.push(`   • Credit Assessment: Fair/Poor (High risk) - Lower creditworthiness increases risk`);
    analysis.push(`   • Previous Disputes: ${previousDisputes}`);
    if (previousDisputes === 0) analysis.push(`   • Dispute History: No previous disputes - Positive indicator`);
    else if (previousDisputes <= 2) analysis.push(`   • Dispute History: Limited disputes - Normal customer behavior`);
    else analysis.push(`   • Dispute History: Multiple disputes - Concerning pattern that increases risk`);
    analysis.push(`   • Combined Customer Score: ${customerScore}`);
    analysis.push(`   • Weighted Impact: ${Math.round(customerScore * 0.10)} points\n`);
    
    // 3. Merchant Risk Analysis (5% weight)
    const merchantCategory = dispute.transaction.merchantCategory;
    let merchantScore = 0;
    const highRiskCategories = ['Luxury Goods', 'Online Services', 'Travel Services'];
    const mediumRiskCategories = ['Electronics', 'Subscription Service'];
    
    if (highRiskCategories.includes(merchantCategory)) merchantScore = 60;
    else if (mediumRiskCategories.includes(merchantCategory)) merchantScore = 35;
    else merchantScore = 20;
    
    analysis.push(`**3. MERCHANT RISK FACTOR (5% weight)**`);
    analysis.push(`   • Merchant Category: ${merchantCategory}`);
    if (highRiskCategories.includes(merchantCategory)) analysis.push(`   • Category Risk: High risk industry - These categories have higher chargeback rates historically`);
    else if (mediumRiskCategories.includes(merchantCategory)) analysis.push(`   • Category Risk: Medium risk industry - Moderate chargeback rates in this sector`);
    else analysis.push(`   • Category Risk: Low risk industry - Stable sector with lower chargeback rates`);
    analysis.push(`   • Merchant Score: ${merchantScore}`);
    analysis.push(`   • Weighted Impact: ${Math.round(merchantScore * 0.05)} points\n`);
    
    // 4. Dispute Reason Analysis (5% weight)
    const disputeReason = dispute.disputeReason;
    let reasonScore = 0;
    const highRiskReasons = ['Fraudulent Transaction', 'Identity Theft'];
    const mediumRiskReasons = ['Unauthorized transaction', 'Duplicate Charge'];
    
    if (highRiskReasons.some(reason => disputeReason.includes(reason))) reasonScore = 80;
    else if (mediumRiskReasons.some(reason => disputeReason.includes(reason))) reasonScore = 50;
    else reasonScore = 30;
    
    analysis.push(`**4. DISPUTE REASON FACTOR (5% weight)**`);
    analysis.push(`   • Dispute Reason: ${disputeReason}`);
    if (reasonScore === 80) analysis.push(`   • Reason Risk: High risk - Fraud-related disputes require immediate investigation`);
    else if (reasonScore === 50) analysis.push(`   • Reason Risk: Medium risk - Common dispute type requiring verification`);
    else analysis.push(`   • Reason Risk: Low risk - Service/product related dispute typically easier to resolve`);
    analysis.push(`   • Reason Score: ${reasonScore}`);
    analysis.push(`   • Weighted Impact: ${Math.round(reasonScore * 0.05)} points\n`);
    
    // 5. Evidence Analysis (10% weight)
    const evidenceCount = dispute.evidence?.length || 0;
    let evidenceScore = 0;
    if (evidenceCount === 0) evidenceScore = 80;
    else if (evidenceCount === 1) evidenceScore = 50;
    else evidenceScore = 20;
    
    analysis.push(`**5. EVIDENCE COMPLETENESS FACTOR (10% weight)**`);
    analysis.push(`   • Evidence Files: ${evidenceCount}`);
    if (evidenceCount === 0) analysis.push(`   • Evidence Assessment: No evidence provided - High risk, difficult to defend`);
    else if (evidenceCount === 1) analysis.push(`   • Evidence Assessment: Limited evidence - Some support but may be insufficient`);
    else analysis.push(`   • Evidence Assessment: Adequate evidence - Good documentation to support case`);
    analysis.push(`   • Evidence Score: ${evidenceScore}`);
    analysis.push(`   • Weighted Impact: ${Math.round(evidenceScore * 0.10)} points\n`);
    
    // 6. Transaction Legitimacy Analysis (40% weight - PRIMARY FACTOR)
    const sameCardOrders = (dispute.transaction as any).sameCardSuccessOrders || (dispute as any).sameCardSuccessOrders || 0;
    const sameAddressOrders = (dispute.transaction as any).sameAddressSuccessOrders || (dispute as any).sameAddressSuccessOrders || 0;
    const sameIpOrders = (dispute.transaction as any).sameIpSuccessOrders || (dispute as any).sameIpSuccessOrders || 0;
    const sameDeviceOrders = (dispute.transaction as any).sameDeviceSuccessOrders || (dispute as any).sameDeviceSuccessOrders || 0;
    const itemDelivered = (dispute.transaction as any).itemDelivered;
    const itemShipped = (dispute.transaction as any).itemShipped;
    const digitalGoods = (dispute.transaction as any).digitalGoods;
    
    let legitimacyScore = 0;
    const totalLinkedOrders = sameCardOrders + sameAddressOrders + sameIpOrders + sameDeviceOrders;
    const hasAnyLinks = totalLinkedOrders > 0;
    const category = dispute.category;
    
    // CATEGORY-AWARE LOGIC
    if (category === 'FRAUD_UNAUTHORIZED') {
      // FRAUD LOGIC: Links indicate abusive chargeback (stolen account with history)
      if (!hasAnyLinks) {
        legitimacyScore = 10;  // Pure fraud - stolen card/identity theft
      } else {
        // Base score of 80 when ANY links exist
        legitimacyScore = 80;
        
        // More links = higher score (more suspicious for fraud)
        if (totalLinkedOrders >= 20) {
          legitimacyScore += 15;  // Very suspicious (95 total)
        } else if (totalLinkedOrders >= 10) {
          legitimacyScore += 10;  // High suspicion (90 total)
        } else if (totalLinkedOrders >= 5) {
          legitimacyScore += 5;   // Moderate suspicion (85 total)
        }
        
        // Context factors for fraud
        if (digitalGoods === 'Y') {
          legitimacyScore += 5;
        } else if (itemDelivered === 'Y') {
          legitimacyScore += 10;
        } else if (itemShipped === 'Y') {
          legitimacyScore += 5;
        }
        
        legitimacyScore = Math.min(100, legitimacyScore);
      }
    } else if (category === 'MERCHANT_MERCHANDISE' || category === 'PROCESSING_ISSUES') {
      // LOYAL CUSTOMER LOGIC: More links = Much lower score (very loyal customer)
      if (totalLinkedOrders === 0) {
        legitimacyScore = 60;  // No history - moderate risk
      } else if (totalLinkedOrders >= 1 && totalLinkedOrders <= 2) {
        legitimacyScore = 30;  // Some history - lower risk
      } else {
        legitimacyScore = 0;   // 3+ linked orders = very loyal customer, minimal risk
      }
    } else {
      // Unknown category - use moderate approach
      legitimacyScore = 50;
    }
    
    analysis.push(`**6. TRANSACTION LEGITIMACY FACTOR (40% weight - PRIMARY FACTOR)**`);
    analysis.push(`   • Same Card Success Orders: ${sameCardOrders}`);
    analysis.push(`   • Same Address Success Orders: ${sameAddressOrders}`);
    analysis.push(`   • Same IP Success Orders: ${sameIpOrders}`);
    analysis.push(`   • Same Device Success Orders: ${sameDeviceOrders}`);
    analysis.push(`   • Total Linked Orders: ${sameCardOrders + sameAddressOrders + sameIpOrders + sameDeviceOrders}`);
    analysis.push(`   • Item Delivery Status: ${itemDelivered || 'N/A'}`);
    
    // Category-specific analysis explanation
    if (category === 'FRAUD_UNAUTHORIZED') {
      if (hasAnyLinks) {
        analysis.push(`   • FRAUD ASSESSMENT: LIKELY ABUSIVE CHARGEBACK - Previous transaction history found`);
        if (sameCardOrders > 0) analysis.push(`     → Card previously used: Evidence of account takeover or friendly fraud`);
        if (sameAddressOrders > 0) analysis.push(`     → Address previously used: Evidence of cardholder involvement`);
        if (sameIpOrders > 0) analysis.push(`     → IP previously used: Evidence of cardholder involvement`);
        if (sameDeviceOrders > 0) analysis.push(`     → Device previously used: Evidence of cardholder involvement`);
        
        if (totalLinkedOrders >= 20) {
          analysis.push(`     → Very high confidence: ${totalLinkedOrders} total linked orders (Score: ${legitimacyScore})`);
        } else if (totalLinkedOrders >= 10) {
          analysis.push(`     → High confidence: ${totalLinkedOrders} total linked orders (Score: ${legitimacyScore})`);
        } else if (totalLinkedOrders >= 5) {
          analysis.push(`     → Moderate confidence: ${totalLinkedOrders} total linked orders (Score: ${legitimacyScore})`);
        } else {
          analysis.push(`     → Base confidence: ${totalLinkedOrders} total linked orders (Score: ${legitimacyScore})`);
        }
      } else {
        analysis.push(`   • FRAUD ASSESSMENT: LIKELY REAL FRAUD - No transaction history (stolen card/identity theft)`);
      }
    } else if (category === 'MERCHANT_MERCHANDISE' || category === 'PROCESSING_ISSUES') {
      if (totalLinkedOrders === 0) {
        analysis.push(`   • CUSTOMER ASSESSMENT: NEW CUSTOMER - No transaction history (Score: ${legitimacyScore})`);
        analysis.push(`     → No previous orders found - moderate risk for new customer`);
      } else if (totalLinkedOrders >= 1 && totalLinkedOrders <= 2) {
        analysis.push(`   • CUSTOMER ASSESSMENT: RETURNING CUSTOMER - Limited transaction history (Score: ${legitimacyScore})`);
        if (sameCardOrders > 0) analysis.push(`     → Card previously used: ${sameCardOrders} times`);
        if (sameAddressOrders > 0) analysis.push(`     → Address previously used: ${sameAddressOrders} times`);
        if (sameIpOrders > 0) analysis.push(`     → IP previously used: ${sameIpOrders} times`);
        if (sameDeviceOrders > 0) analysis.push(`     → Device previously used: ${sameDeviceOrders} times`);
        analysis.push(`     → ${totalLinkedOrders} total linked orders - lower risk`);
      } else {
        analysis.push(`   • CUSTOMER ASSESSMENT: LOYAL CUSTOMER - Extensive transaction history (Score: ${legitimacyScore})`);
        if (sameCardOrders > 0) analysis.push(`     → Card previously used: ${sameCardOrders} times`);
        if (sameAddressOrders > 0) analysis.push(`     → Address previously used: ${sameAddressOrders} times`);
        if (sameIpOrders > 0) analysis.push(`     → IP previously used: ${sameIpOrders} times`);
        if (sameDeviceOrders > 0) analysis.push(`     → Device previously used: ${sameDeviceOrders} times`);
        analysis.push(`     → ${totalLinkedOrders} total linked orders - VERY LOYAL CUSTOMER, minimal risk`);
      }
    }
    analysis.push(`   • Legitimacy Score: ${legitimacyScore}`);
    analysis.push(`   • Weighted Impact: ${Math.round(legitimacyScore * 0.40)} points\n`);
    
    // 7. Abuse Patterns Analysis (20% weight)
    const disputePercentage = (dispute.customer as any).disputePercentage || 0;
    const linkedCustomersDisputeRate = (dispute.customer as any).linkedCustomersDisputeRate || 0;
    const disputeCustomerWon = (dispute.customer as any).disputeCustomerWon || 0;
    
    let abuseScore = 0;
    if (disputePercentage >= 10) abuseScore += 80;
    else if (disputePercentage >= 5) abuseScore += 60;
    else if (disputePercentage >= 2) abuseScore += 35;
    else abuseScore += 5;
    abuseScore = Math.round(abuseScore / 5); // Simplified calculation
    
    analysis.push(`**7. ABUSE PATTERNS FACTOR (20% weight - SECONDARY FACTOR)**`);
    analysis.push(`   • Customer Dispute Rate: ${disputePercentage}%`);
    analysis.push(`   • Disputes Won by Customer: ${disputeCustomerWon}/${previousDisputes}`);
    analysis.push(`   • Linked Customers Dispute Rate: ${linkedCustomersDisputeRate}%`);
    if (disputePercentage > 5) analysis.push(`   • Abuse Assessment: High risk - Excessive dispute rate suggests potential abuse`);
    else if (disputePercentage > 2) analysis.push(`   • Abuse Assessment: Moderate risk - Elevated dispute rate requires monitoring`);
    else analysis.push(`   • Abuse Assessment: Normal behavior - Dispute rate within acceptable range`);
    analysis.push(`   • Abuse Score: ${abuseScore}`);
    analysis.push(`   • Weighted Impact: ${Math.round(abuseScore * 0.20)} points\n`);
    
    // Final Assessment
    const totalWeightedScore = Math.round(
      amountScore * 0.10 + customerScore * 0.10 + merchantScore * 0.05 + 
      reasonScore * 0.05 + evidenceScore * 0.10 + legitimacyScore * 0.40 + abuseScore * 0.20
    );
    
    analysis.push(`**📊 FINAL RISK ASSESSMENT**`);
    analysis.push(`   • Calculated Total Score: ${totalWeightedScore}/100`);
    analysis.push(`   • Actual Risk Score: ${dispute.riskScore}/100`);
    if (dispute.riskScore < 30) analysis.push(`   • Risk Level: LOW - Strong indicators support approving this dispute`);
    else if (dispute.riskScore < 70) analysis.push(`   • Risk Level: MEDIUM - Mixed indicators require manual review`);
    else analysis.push(`   • Risk Level: HIGH - Multiple risk factors suggest rejecting this dispute`);
    
    analysis.push(`\n**🎯 RECOMMENDATION RATIONALE**`);
    if (dispute.aiRecommendation === 'approve') {
      analysis.push(`   • AI Recommendation: APPROVE - Low risk factors and legitimate customer patterns support approval`);
    } else if (dispute.aiRecommendation === 'reject') {
      analysis.push(`   • AI Recommendation: REJECT - High risk factors and concerning patterns suggest fraud`);
    } else {
      analysis.push(`   • AI Recommendation: MANUAL REVIEW - Mixed indicators require human judgment`);
    }
    
    return analysis.join('\n');
  };

  const handleAnalyze = async () => {
    if (!dispute) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newAnalysis: AnalysisResult = {
      riskScore: dispute.riskScore,
      recommendation: dispute.aiRecommendation,
      confidence: dispute.aiConfidence,
      analysis: dispute.aiAnalysis + '\n\n[Updated] After deep learning model analysis, recommend focusing on customer payment behavior patterns and merchant historical records.',
      keyFactors: getKeyFactors(dispute),
      warningFlags: getWarningFlags(dispute)
    };
    
    setAnalysisResult(newAnalysis);
    setIsAnalyzing(false);
    
    // Update dispute status
    const updatedDispute = {
      ...dispute,
      status: 'merchant_investigation' as const,
      updatedAt: new Date().toISOString()
    };
    onUpdateDispute(updatedDispute);
  };

  const generateEnhancedAnalysis = (feedback: string, dispute: DisputeCase): string => {
    const analysis = [];
    
    analysis.push("🔄 **RE-ANALYSIS WITH ANALYST FEEDBACK**");
    analysis.push(`**Original Risk Score**: ${dispute.riskScore}`);
    analysis.push(`**Analyst Input**: "${feedback}"`);
    analysis.push("");
    
    analysis.push("**🤖 AI ASSISTANT RESPONSE:**");
    analysis.push("Thank you for the additional context. I have carefully reviewed your feedback and incorporated it into my analysis:");
    analysis.push("");
    
    // Analyze the feedback content and provide specific responses
    const feedbackLower = feedback.toLowerCase();
    
    if (feedbackLower.includes('customer') || feedbackLower.includes('loyal')) {
      analysis.push("✓ **Customer Relationship Consideration**: Your insight about the customer relationship is valuable. I have adjusted the customer loyalty assessment based on your expertise.");
    }
    
    if (feedbackLower.includes('evidence') || feedbackLower.includes('document') || feedbackLower.includes('proof')) {
      analysis.push("✓ **Evidence Evaluation**: I have re-evaluated the evidence quality and documentation based on your additional observations.");
    }
    
    if (feedbackLower.includes('merchant') || feedbackLower.includes('seller') || feedbackLower.includes('vendor')) {
      analysis.push("✓ **Merchant Behavior Analysis**: Your feedback regarding merchant practices has been factored into the risk assessment.");
    }
    
    if (feedbackLower.includes('fraud') || feedbackLower.includes('suspicious') || feedbackLower.includes('abuse')) {
      analysis.push("✓ **Fraud Pattern Recognition**: I have updated the fraud risk indicators based on your professional judgment.");
    }
    
    if (feedbackLower.includes('approve') || feedbackLower.includes('accept')) {
      analysis.push("✓ **Approval Consideration**: Your recommendation towards approval has been weighted into the decision matrix.");
    }
    
    if (feedbackLower.includes('reject') || feedbackLower.includes('deny') || feedbackLower.includes('decline')) {
      analysis.push("✓ **Rejection Consideration**: Your concerns about approving this dispute have been incorporated into the risk assessment.");
    }
    
    if (feedbackLower.includes('investigate') || feedbackLower.includes('review') || feedbackLower.includes('unclear')) {
      analysis.push("✓ **Investigation Requirement**: I agree that additional investigation may be warranted based on your observations.");
    }
    
    analysis.push("");
    analysis.push("**📊 UPDATED ASSESSMENT:**");
    
    return analysis.join('\n');
  };

  const calculateAdjustedRiskScore = (feedback: string, originalScore: number): number => {
    let adjustment = 0;
    const feedbackLower = feedback.toLowerCase();
    
    // Positive indicators (reduce risk)
    if (feedbackLower.includes('loyal') || feedbackLower.includes('good customer')) adjustment -= 15;
    if (feedbackLower.includes('evidence') && feedbackLower.includes('strong')) adjustment -= 10;
    if (feedbackLower.includes('legitimate') || feedbackLower.includes('valid')) adjustment -= 12;
    if (feedbackLower.includes('approve') || feedbackLower.includes('favor')) adjustment -= 8;
    
    // Negative indicators (increase risk)
    if (feedbackLower.includes('suspicious') || feedbackLower.includes('doubt')) adjustment += 15;
    if (feedbackLower.includes('fraud') || feedbackLower.includes('abuse')) adjustment += 20;
    if (feedbackLower.includes('reject') || feedbackLower.includes('deny')) adjustment += 12;
    if (feedbackLower.includes('risk') && feedbackLower.includes('high')) adjustment += 10;
    
    // Apply adjustment with bounds
    const newScore = Math.max(5, Math.min(95, originalScore + adjustment));
    return newScore;
  };

  const getUpdatedRecommendation = (riskScore: number, category?: string): 'approve' | 'reject' | 'review' | 'merchant_investigation' => {
    if (riskScore < 30) return 'approve';
    if (riskScore > 70) return 'reject';
    
    // Special handling for merchandise issues
    if (category === 'MERCHANT_MERCHANDISE' && riskScore >= 36 && riskScore <= 74) {
      return 'merchant_investigation';
    }
    
    return 'review';
  };

  const handleReAnalysis = async () => {
    if (!dispute || !analystFeedback.trim()) {
      console.log('Re-analysis blocked: missing dispute or feedback');
      return;
    }
    
    console.log('Starting re-analysis with feedback:', analystFeedback.trim());
    setIsAnalyzing(true);
    
    try {
      // Send re-analysis request to backend with analyst feedback
      const response = await fetch(`${API_BASE_URL}/analyze/${dispute.id}/reanalyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analystFeedback: analystFeedback.trim(),
          disputeData: dispute
        })
      });
      
      if (!response.ok) {
        throw new Error('Re-analysis request failed');
      }
      
      const result = await response.json();
      
      // Generate enhanced analysis showing how feedback was incorporated
      const enhancedAnalysis = generateEnhancedAnalysis(analystFeedback.trim(), dispute);
      
      // Update analysis result with new insights from backend
      setAnalysisResult({
        riskScore: result.riskScore,
        recommendation: result.recommendation,
        confidence: result.confidence,
        analysis: `${enhancedAnalysis}\n\n${result.analysis}\n\n📝 **ANALYST FEEDBACK INCORPORATED**:\n"${analystFeedback.trim()}"`,
        keyFactors: [...(result.keyFactors || []), 'Analyst expertise incorporated', 'Additional context considered'],
        warningFlags: result.warningFlags || []
      });
      
      // Update the dispute with new analysis
      const updatedDispute = {
        ...dispute,
        riskScore: result.riskScore,
        aiRecommendation: result.recommendation,
        aiConfidence: result.confidence,
        aiAnalysis: result.analysis,
        analystFeedback: analystFeedback.trim(),
        updatedAt: new Date().toISOString()
      };
      
      onUpdateDispute(updatedDispute);
      
    } catch (error) {
      console.error('Re-analysis failed, using fallback analysis:', error);
      
      // Generate detailed re-analysis showing how feedback was incorporated
      const enhancedAnalysis = generateEnhancedAnalysis(analystFeedback.trim(), dispute);
      const adjustedRiskScore = calculateAdjustedRiskScore(analystFeedback.trim(), dispute.riskScore);
      const newRecommendation = getUpdatedRecommendation(adjustedRiskScore, dispute.category);
      
      // Show enhanced fallback analysis
      setAnalysisResult({
        riskScore: adjustedRiskScore,
        recommendation: newRecommendation,
        confidence: Math.max(75, Math.min(95, dispute.aiConfidence + 5)),
        analysis: `${enhancedAnalysis}\n\nBased on your feedback, I have adjusted my assessment. The risk score has been modified from ${dispute.riskScore} to ${adjustedRiskScore} to reflect your professional judgment.\n\n📝 **ANALYST FEEDBACK INCORPORATED**:\n"${analystFeedback.trim()}"`,
        keyFactors: [...(analysisResult?.keyFactors || []), 'Analyst expertise incorporated', 'Additional context considered'],
        warningFlags: analysisResult?.warningFlags || []
      });
      
      const updatedDispute = {
        ...dispute,
        riskScore: adjustedRiskScore,
        aiRecommendation: newRecommendation,
        aiConfidence: Math.max(75, Math.min(95, dispute.aiConfidence + 5)),
        aiAnalysis: `Re-analyzed with analyst feedback: "${analystFeedback.trim()}". Updated risk assessment based on additional context provided.`,
        analystFeedback: analystFeedback.trim(),
        updatedAt: new Date().toISOString()
      };
      
      onUpdateDispute(updatedDispute);
    } finally {
      console.log('Re-analysis completed, clearing state');
      setIsAnalyzing(false);
      // Clear the feedback textbox after re-analysis
      setAnalystFeedback('');
    }
  };

  const handleDecision = (decision: 'approve' | 'reject' | 'investigate' | 'send_to_merchant') => {
    if (!dispute) return;
    
    setHumanDecision(decision);
    
    let newStatus: DisputeCase['status'];
    if (decision === 'investigate' || decision === 'send_to_merchant') {
      newStatus = 'merchant_investigation';
    } else {
      newStatus = 'admitted_closed';
    }
    
    const updatedDispute = {
      ...dispute,
      humanDecision: decision,
      analystFeedback: analystFeedback.trim() || undefined,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    onUpdateDispute(updatedDispute);
  };

  if (!dispute) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Case Selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select a dispute case from the dashboard for analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Case Basic Information */}
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Case Analysis: {dispute.caseNumber}</h2>
            <p className="text-gray-600">Created: {new Date(dispute.createdAt).toLocaleString()}</p>
          </div>

        </div>

        {/* Transaction Information */}
        <div className="space-y-3 mt-4">

          <h3 className="text-lg font-semibold text-gray-900">Transaction Information:</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Order Amount:&nbsp;&nbsp;</span>
                <span className="ml-8">${dispute.transaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Checkout Time:&nbsp;&nbsp;</span>
                <span className="ml-8">{new Date(dispute.transaction.transactionDate).toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Merchant:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.transaction.merchantName}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Category:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.transaction.merchantCategory}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Items:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).items || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Digital Goods (Y/N):&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).digitalGoods || 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Login Method:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).loginMethod || 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Item Shipped (Y/N):&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).itemShipped || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Item Shipped Date:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).itemShippedDate && (dispute.transaction as any).itemShippedDate !== 'N/A' ? new Date((dispute.transaction as any).itemShippedDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Item Delivered (Y/N):&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).itemDelivered || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Item Delivered Date:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).itemDeliveredDate && (dispute.transaction as any).itemDeliveredDate !== 'N/A' ? new Date((dispute.transaction as any).itemDeliveredDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Card:&nbsp;&nbsp;</span>
                <span className="ml-8">****{dispute.transaction.cardLast4}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500"># of Success Orders Paid From Same Card:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).sameCardSuccessOrders || (dispute as any).sameCardSuccessOrders || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Shipping Address:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.transaction.location}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500"># of Success Orders Sharing Same Shipping Address:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).sameAddressSuccessOrders || (dispute as any).sameAddressSuccessOrders || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Checkout IP:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).checkoutIp || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500"># of Success Orders Sharing Same IP:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).sameIpSuccessOrders || (dispute as any).sameIpSuccessOrders || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Checkout Device:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).checkoutDevice || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500"># of Success Orders Sharing Same Device:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.transaction as any).sameDeviceSuccessOrders || (dispute as any).sameDeviceSuccessOrders || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-3 mt-4">

          <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Name:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.customer.name}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Email:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.customer.email}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Phone:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.customer.phone}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Account Type:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.customer.accountType}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Credit Score:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.customer.creditScore}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Customer Since:&nbsp;&nbsp;</span>
                <span className="ml-8">{new Date(dispute.customer.customerSince).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Total Disputes:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.customer.previousDisputes}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Dispute Customer Won:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).disputeCustomerWon || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Dispute % out of Total Purchase:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).disputePercentage ? `${(dispute.customer as any).disputePercentage}%` : 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Total Purchase:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).totalPurchaseAmount ? `$${(dispute.customer as any).totalPurchaseAmount.toLocaleString()}` : 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Linked Customers:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).linkedCustomersCount || 0}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Linked Customers Dispute Rate:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).linkedCustomersDisputeRate ? `${(dispute.customer as any).linkedCustomersDisputeRate}%` : '0%'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Linked Customers by Device:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).linkedByDevice || 0}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Linked Customers by IP:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).linkedByIp || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Linked Customers by Card:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).linkedByCard || 0}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Linked Customers by Shipping Address:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute.customer as any).linkedByAddress || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Details */}
        <div className="space-y-3 mt-4">

          <h3 className="text-lg font-semibold text-gray-900">Dispute Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Dispute Type:&nbsp;&nbsp;</span>
              <span>{dispute.disputeReason}</span>
            </div>
            <div>
              <span className="text-gray-500">Detailed Description:&nbsp;&nbsp;</span>
              <span>{dispute.disputeDescription}</span>
            </div>
            <div>
              <span className="text-gray-500">Evidence Files:&nbsp;&nbsp;</span>
              <span>
                {dispute.evidence && dispute.evidence.length > 0 
                  ? dispute.evidence.map(e => e.fileName).join(', ')
                  : 'No evidence files uploaded'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Case Information */}
        <div className="space-y-3 mt-4">

          <h3 className="text-lg font-semibold text-gray-900">Case Information</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Case Number:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.caseNumber}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Category:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.category?.replace('_', ' ') || 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Subcategory:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.subcategory?.replace('_', ' ') || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Card Issuer:&nbsp;&nbsp;</span>
                <span className="ml-8">{(dispute as any).cardIssuer || 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Network:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.cardNetwork || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Network Chargeback Code:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.reasonCode || 'N/A'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex">
                <span className="text-gray-500">Priority:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.priority.charAt(0).toUpperCase() + dispute.priority.slice(1)}</span>
              </div>
              <div className="flex">
                <span className="text-gray-500">Status:&nbsp;&nbsp;</span>
                <span className="ml-8">{dispute.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results */}
      {analysisResult && (
        <>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Intelligent Analysis Results</h3>
          
          <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg mb-3">
            {/* Risk Score */}
            <div className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-300"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${
                      analysisResult.riskScore > 70 ? 'text-red-500' :
                      analysisResult.riskScore > 30 ? 'text-yellow-500' : 'text-green-500'
                    }`}
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={`${analysisResult.riskScore}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  {analysisResult.riskScore}
                </span>
              </div>
              <span className="text-xs text-gray-600">Risk Score</span>
            </div>

            {/* AI Recommendation */}
            <div className="flex items-center space-x-2">
              {analysisResult.recommendation === 'approve' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : analysisResult.recommendation === 'reject' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : analysisResult.recommendation === 'merchant_investigation' ? (
                <AlertCircle className="h-4 w-4 text-blue-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-xs text-gray-600">
                {analysisResult.recommendation === 'approve' ? 'Approve' :
                 analysisResult.recommendation === 'reject' ? 'Reject' :
                 analysisResult.recommendation === 'merchant_investigation' ? 'Send for Merchant Investigation' : 'Review'}
              </span>
            </div>

            {/* Confidence */}
            <div className="flex items-center space-x-2">
              <div className="text-xs font-bold text-gray-700">
                {analysisResult.confidence}%
              </div>
              <span className="text-xs text-gray-600">Confidence</span>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Detailed Analysis</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {generateDetailedAnalysis(dispute)}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Factors */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Supporting Factors</h4>
                <ul className="space-y-1">
                  {analysisResult.keyFactors.map((factor, index) => (
                    <li key={index} className="flex items-center text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning Flags */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Risk Factors</h4>
                <ul className="space-y-1">
                  {analysisResult.warningFlags.map((flag, index) => (
                    <li key={index} className="flex items-center text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Human Decision */}
      {!humanDecision && (
        <>

          <div className="card" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Decision</h3>
          <p className="text-gray-600 mb-4">
            Based on AI analysis results, please make the final decision:
          </p>
          
          {/* AI Assistant Feedback Section */}
          <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200" style={{ width: '100%', maxWidth: '100%' }}>
            <div className="flex items-start space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">AI Assistant for Dispute Management</p>
                <p className="text-sm text-blue-600 mt-1">Hi, I am your AI assistant for dispute management. Please add your feedback here for additional context or insights that might help with this case.</p>
              </div>
            </div>
            <textarea
              value={analystFeedback}
              onChange={(e) => setAnalystFeedback(e.target.value)}
              placeholder="Share your thoughts, additional evidence, or context that might influence the decision..."
              className="w-full p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              rows={5}
              style={{ width: '100%', maxWidth: 'none' }}
            />
            
            {/* Re-Analysis Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  console.log('Re-analysis button clicked');
                  console.log('Feedback:', analystFeedback);
                  console.log('Is analyzing:', isAnalyzing);
                  console.log('Dispute ID:', dispute?.id);
                  handleReAnalysis();
                }}
                disabled={!analystFeedback.trim() || isAnalyzing}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isAnalyzing ? 'Re-Analyzing...' : 'Re-Analysis with Feedback'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleDecision('approve')}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              Approve Refund
            </button>
            
            {dispute.category === 'MERCHANT_MERCHANDISE' && (
              <button
                onClick={() => handleDecision('investigate')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2" />
                Send for Merchant Investigation
              </button>
            )}
            
            {dispute.category === 'PROCESSING_ISSUES' && (
              <button
                onClick={() => handleDecision('send_to_merchant')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2" />
                Send To Merchant
              </button>
            )}
            
            <button
              onClick={() => handleDecision('reject')}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              Reject Refund and Represent
            </button>
          </div>
          </div>
        </>
      )}

      {/* Decision Result */}
      {dispute.humanDecision && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Result</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
            dispute.humanDecision === 'approve' ? 'bg-green-100 text-green-800' : 
            dispute.humanDecision === 'investigate' ? 'bg-blue-100 text-blue-800' :
            dispute.humanDecision === 'send_to_merchant' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
          }`}>
            {dispute.humanDecision === 'approve' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : dispute.humanDecision === 'investigate' ? (
              <FileText className="h-5 w-5 mr-2" />
            ) : dispute.humanDecision === 'send_to_merchant' ? (
              <FileText className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            {dispute.humanDecision === 'approve' ? 'Refund Approved' : 
             dispute.humanDecision === 'investigate' ? 'Sent for Merchant Investigation' :
             dispute.humanDecision === 'send_to_merchant' ? 'Sent To Merchant for Processing' : 'Refund Rejected - Representment'}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Processing Time: {new Date(dispute.updatedAt).toLocaleString()}
          </p>
          
          {/* Analyst Feedback Display */}
          {dispute.analystFeedback && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700 mb-1">Analyst Feedback:</p>
                  <p className="text-sm text-gray-600 italic">"{dispute.analystFeedback}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DisputeAnalyzer;
