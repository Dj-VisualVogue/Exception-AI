import type { TransactionException, AIExplanationResult } from '../types';
import { ResolutionPolicyService } from './policyService';

export class AIExplanationService {
  /**
   * Generates a grounded natural language explanation and recommendation.
   * If VITE_GEMINI_API_KEY is available, calls Gemini API with structured prompt.
   * Otherwise, falls back to deterministic grounded generator.
   */
  public static async explainAndSuggest(
    exception: TransactionException
  ): Promise<AIExplanationResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_LLM_API_KEY;

    if (apiKey) {
      try {
        const llmResult = await this.callGeminiAPI(exception, apiKey);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('LLM API call failed, falling back to deterministic explanation generator:', err);
      }
    }

    // Deterministic grounded fallback
    return this.generateDeterministicExplanation(exception);
  }

  /**
   * Deterministic, zero-dependency explanation generator grounded strictly in transaction parameters.
   */
  public static generateDeterministicExplanation(
    exception: TransactionException
  ): AIExplanationResult {
    const {
      transactionAmount,
      expectedAmount,
      varianceAmount,
      variancePercentage,
      ruleTriggered,
      historicalVendorTrustScore,
      flaggedFactors,
    } = exception.evidence;

    const formattedTxAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(transactionAmount);

    const formattedExpAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(expectedAmount);

    const formattedVarAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Math.abs(varianceAmount));

    const policyEval = ResolutionPolicyService.evaluatePolicy(exception);

    let explanationText = '';
    let resolutionText = '';
    const evidenceSummary: string[] = [
      `Transaction Amount: ${formattedTxAmount}`,
      `Expected PO Baseline: ${formattedExpAmount}`,
      `Variance: ${varianceAmount >= 0 ? '+' : '-'}${formattedVarAmount} (${variancePercentage.toFixed(2)}%)`,
      `Rule: ${ruleTriggered}`,
      `Vendor Trust Rating: ${historicalVendorTrustScore}/100`,
      `Calculated Confidence: ${exception.confidence}%`,
      `Policy Eligibility: ${policyEval.reason}`,
    ];

    switch (exception.exceptionType) {
      case 'DUPLICATE_INVOICE':
        explanationText = `This transaction reference ${exception.transactionReference} for ${exception.vendor} was flagged because an identical invoice reference and billing amount (${formattedTxAmount}) was previously recorded within a short time window. Evidence indicates high risk of double-payment.`;
        resolutionText = `Reject the duplicate submission (${exception.transactionReference}) and archive the exception record. Contact vendor ${exception.vendor} to inform them of duplicate filing.`;
        break;

      case 'HIGH_AMOUNT_VARIANCE':
        explanationText = `The transaction amount of ${formattedTxAmount} submitted by ${exception.vendor} is ${formattedVarAmount} (${variancePercentage.toFixed(2)}%) ${varianceAmount > 0 ? 'above' : 'below'} the expected purchase order baseline of ${formattedExpAmount}. Flagged under ${ruleTriggered}.`;
        if (variancePercentage <= 5) {
          resolutionText = `Approve variance under acceptable tolerance limit (${variancePercentage.toFixed(2)}% <= 5%). Update purchase order line item to reflect actual charges.`;
        } else if (variancePercentage <= 15) {
          resolutionText = `Request freight/tax line-item breakdown from ${exception.vendor} to justify the ${formattedVarAmount} variance prior to releasing payment.`;
        } else {
          resolutionText = `Escalate transaction ${exception.transactionReference} to Corporate Procurement & Finance VP due to excessive variance exceeding 25%.`;
        }
        break;

      case 'GEOGRAPHIC_ANOMALY':
        explanationText = `Flagged by Visa/Mastercard Fraud Guard due to physical impossibility: A card swipe event occurred in a foreign terminal location shortly after a swipe in another jurisdiction. Terminal vendor trust score is low (${historicalVendorTrustScore}/100).`;
        resolutionText = `Freeze corporate card associated with ${exception.transactionReference}, reject payment authorization, and contact the employee cardholder to confirm physical card custody.`;
        break;

      case 'ACCOUNT_VELOCITY_SPIKE':
        explanationText = `The transaction burst monitor detected an anomalous frequency of micro-transfers (${flaggedFactors.join(', ')}) targeting vendor ${exception.vendor}. Total burst sum: ${formattedTxAmount}.`;
        resolutionText = `Place temporary payment hold on beneficiary account. Request compliance review of newly registered banking details for ${exception.vendor}.`;
        break;

      case 'TAX_REGION_MISMATCH':
        explanationText = `Tax engine discrepancy detected: Invoice billed by ${exception.vendor} applied tax rate inconsistent with the buyer/seller state tax codes. Expected IGST/CGST tax mapping differs from invoice payload.`;
        resolutionText = `Issue vendor correction advice to ${exception.vendor} requesting revised credit note / GST invoice with corrected tax jurisdiction breakdown.`;
        break;

      case 'UNAUTHORIZED_VENDOR':
        explanationText = `Wire dispatch of ${formattedTxAmount} attempted for ${exception.vendor}, which lacks a matching verified Master Vendor Record in the ERP database. Trust score is low (${historicalVendorTrustScore}/100).`;
        resolutionText = `Block wire dispatch immediately. Require Vendor Onboarding team to complete KYC, tax verification, and bank details verification before processing any payouts.`;
        break;
    }

    return {
      explanation: explanationText,
      evidenceSummary,
      suggestedAction: policyEval.action,
      suggestedResolutionText: resolutionText,
      confidenceScore: exception.confidence,
      isFallback: true,
      provider: 'Deterministic Evidence Engine (Local Grounded)',
    };
  }

  /**
   * Optional LLM integration (Gemini REST API endpoint call)
   */
  private static async callGeminiAPI(
    exception: TransactionException,
    apiKey: string
  ): Promise<AIExplanationResult | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
You are an expert financial compliance AI assistant. Analyze this flagged exception and return a JSON object ONLY with grounded analysis.

TRANSACTION DATA:
- ID: ${exception.id}
- Reference: ${exception.transactionReference}
- Vendor: ${exception.vendor}
- Category: ${exception.category}
- Transaction Amount: ${exception.transactionAmount}
- Expected Amount: ${exception.expectedAmount}
- Variance Amount: ${exception.varianceAmount}
- Variance Percentage: ${exception.variancePercentage}%
- Exception Type: ${exception.exceptionType}
- Severity: ${exception.severity}
- Confidence Score: ${exception.confidence}%
- Evidence Rule: ${exception.evidence.ruleTriggered}
- Vendor Trust Score: ${exception.evidence.historicalVendorTrustScore}/100
- Flags: ${exception.evidence.flaggedFactors.join(', ')}

Strictly adhere to facts provided above. Do NOT invent information.

Respond in JSON format:
{
  "explanation": "concise grounded explanation citing numbers",
  "evidenceSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "suggestedResolutionText": "clear actionable recommendation"
}
`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    // Clean JSON markdown blocks if any
    const jsonStr = candidateText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const policyEval = ResolutionPolicyService.evaluatePolicy(exception);

    return {
      explanation: parsed.explanation || 'Grounded explanation generated by AI.',
      evidenceSummary: Array.isArray(parsed.evidenceSummary)
        ? parsed.evidenceSummary
        : [
            `Transaction Amount: ₹${exception.transactionAmount}`,
            `Expected Baseline: ₹${exception.expectedAmount}`,
            `Variance: ${exception.variancePercentage}%`,
          ],
      suggestedAction: policyEval.action,
      suggestedResolutionText: parsed.suggestedResolutionText || 'Proceed with reviewer verification.',
      confidenceScore: exception.confidence,
      isFallback: false,
      provider: 'Gemini 1.5 Flash API (LLM Grounded)',
    };
  }
}
