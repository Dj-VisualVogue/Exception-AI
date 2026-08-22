import type { RawTransactionInput } from '../services/analysisEngine';
import { AnalysisEngine } from '../services/analysisEngine';
import type { TransactionException } from '../types';

export const RAW_SEED_DATA: RawTransactionInput[] = [
  {
    id: 'EXC-8091',
    transactionReference: 'TX-440912',
    vendor: 'Acme Cloud Infrastructure Ltd',
    category: 'SaaS & Hosting',
    transactionAmount: 45000.00,
    expectedAmount: 40000.00,
    exceptionType: 'HIGH_AMOUNT_VARIANCE',
    detectedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    description: 'Transaction amount exceeds monthly PO baseline by ₹5,000.00 (12.50% variance).',
    source: 'SAP ERP Integration',
    vendorTrustScore: 92,
    flaggedFactors: ['Amount variance > 10%', 'Exceeds monthly baseline'],
  },
  {
    id: 'EXC-8092',
    transactionReference: 'TX-440988',
    vendor: 'FastLogistics Global Express',
    category: 'Freight & Fulfillment',
    transactionAmount: 18450.00,
    expectedAmount: 18450.00,
    exceptionType: 'DUPLICATE_INVOICE',
    detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    description: 'Identical invoice number INV-2026-991 submitted twice within 24 hours.',
    source: 'Vendor Portal API',
    vendorTrustScore: 95,
    flaggedFactors: ['Identical invoice reference', 'Identical timestamp window (14m)'],
  },
  {
    id: 'EXC-8093',
    transactionReference: 'TX-441004',
    vendor: 'Hyperion CyberSec Solutions',
    category: 'Software License',
    transactionAmount: 125000.00,
    expectedAmount: 80000.00,
    exceptionType: 'HIGH_AMOUNT_VARIANCE',
    detectedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    description: 'Critical variance of 56.25% (₹45,000.00 difference) against contracted annual cap.',
    source: 'Oracle Financials',
    vendorTrustScore: 78,
    flaggedFactors: ['Variance > 50%', 'Exceeds annual contract ceiling', 'Requires Finance VP Signoff'],
  },
  {
    id: 'EXC-8094',
    transactionReference: 'TX-441019',
    vendor: 'Tokyo Express Card Services',
    category: 'Corporate Travel',
    transactionAmount: 8900.00,
    expectedAmount: 0.00,
    exceptionType: 'GEOGRAPHIC_ANOMALY',
    detectedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    description: 'Physical card swipe in Tokyo, JP recorded 15 minutes after terminal swipe in London, UK.',
    source: 'Visa Fraud Guard Gateway',
    vendorTrustScore: 40,
    flaggedFactors: ['Impossible travel speed (>8000 km in 15 mins)', 'Unregistered foreign terminal'],
  },
  {
    id: 'EXC-8095',
    transactionReference: 'TX-441042',
    vendor: 'Apex Micro-Merchant Pay',
    category: 'Treasury Transfer',
    transactionAmount: 4900.00,
    expectedAmount: 1000.00,
    exceptionType: 'ACCOUNT_VELOCITY_SPIKE',
    detectedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8 hours ago
    description: '52 micro-transfers submitted in 4 minutes to freshly registered vendor account.',
    source: 'Core Banking API Engine',
    vendorTrustScore: 35,
    flaggedFactors: ['High frequency burst', 'Unverified new beneficiary account'],
  },
  {
    id: 'EXC-8096',
    transactionReference: 'TX-441066',
    vendor: 'OmniMedia Marketing Partners',
    category: 'Advertising & PR',
    transactionAmount: 34200.00,
    expectedAmount: 32000.00,
    exceptionType: 'TAX_REGION_MISMATCH',
    detectedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
    description: 'GST tax rate applied (18%) mismatches billing state code (DL vs MH - expected IGST 18%).',
    source: 'Tax Compliance Engine',
    vendorTrustScore: 88,
    flaggedFactors: ['State code discrepancy', 'Tax sub-category recalculation required'],
  },
  {
    id: 'EXC-8097',
    transactionReference: 'TX-441088',
    vendor: 'Apex Hardware Supplies Inc',
    category: 'Office Supplies',
    transactionAmount: 3200.00,
    expectedAmount: 3100.00,
    exceptionType: 'HIGH_AMOUNT_VARIANCE',
    detectedAt: new Date(Date.now() - 1000 * 60 * 750).toISOString(), // 12.5 hours ago
    description: 'Minor price adjustment ₹100.00 (3.23% variance) due to freight surcharge.',
    source: 'SAP ERP Integration',
    vendorTrustScore: 98,
    flaggedFactors: ['Minor freight adjustment'],
  },
  {
    id: 'EXC-8098',
    transactionReference: 'TX-441112',
    vendor: 'Unknown Overseas Entity 99',
    category: 'Unclassified Wire',
    transactionAmount: 67000.00,
    expectedAmount: 0.00,
    exceptionType: 'UNAUTHORIZED_VENDOR',
    detectedAt: new Date(Date.now() - 1000 * 60 * 900).toISOString(), // 15 hours ago
    description: 'Wire request to unverified vendor without matching Approved Master Supplier Record.',
    source: 'Swift Wire Dispatch System',
    vendorTrustScore: 20,
    flaggedFactors: ['No Master Vendor Record', 'Sanction list partial name alert'],
  },
];

export function getSeedExceptions(): TransactionException[] {
  return RAW_SEED_DATA.map((raw) => AnalysisEngine.analyzeTransaction(raw));
}
