"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { formatCurrency } from "@/lib/utils";
import {
  QrCode,
  Check,
  Copy,
  Download,
  X,
  ShieldCheck,
  Key,
  Settings2,
  FileText,
  PlusCircle,
  Building2,
  Lock,
  ExternalLink,
} from "lucide-react";

type GatewayItem = {
  id: string;
  logo: string;
  name: string;
  desc: string;
  fee: string;
  min: string;
  max: string;
  settle: string;
  methods?: string[];
  active: boolean;
  volume?: number;
  txns?: number;
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  webhookUrl?: string;
  isSandbox?: boolean;
  vpaOrAddress?: string;
};

type BankAccount = {
  id: string;
  flag: string;
  label: string;
  currency: string;
  primary: boolean;
  active: boolean;
  fields: { key: string; label: string; value: string }[];
};

type PaymentActivity = {
  ref: string;
  userName: string;
  userInitials: string;
  userBg: string;
  method: string;
  gateway: string;
  amount: number;
  fee: number;
  status: "completed" | "pending" | "flagged" | "processing";
  date: string;
};

/* ─── INITIAL GATEWAY DATA ─── */
const INITIAL_DOMESTIC: GatewayItem[] = [
  { id: 'upi', logo: '📲', name: 'UPI', desc: 'Unified Payments Interface — instant 24×7 transfers via VPA. Zero MDR for P2P, supports GPay, PhonePe, Paytm, BHIM, Amazon Pay, Cred, Slice.', fee: '0%', min: '₹1', max: '₹1L/txn', settle: 'Instant', active: true, volume: 23705480, txns: 1840, vpaOrAddress: 'brickvest@axisbank' },
  { id: 'imps', logo: '⚡', name: 'IMPS', desc: 'Immediate Payment Service — 24×7 real-time interbank fund transfer via mobile, internet banking & ATMs. RBI regulated.', fee: '₹5–₹15', min: '₹1', max: '₹5L/txn', settle: 'Instant', active: true, volume: 16026240, txns: 620, vpaOrAddress: 'IMPS-AXIS-917020044' },
  { id: 'neft', logo: '🏦', name: 'NEFT', desc: 'National Electronic Funds Transfer — 24×7 batch settlement in 30-minute cycles. No upper limit. RBI regulated.', fee: '₹2–₹25', min: 'No min', max: 'No cap', settle: '30 min (24×7)', active: true, volume: 48412600, txns: 320 },
  { id: 'rtgs', logo: '🚀', name: 'RTGS', desc: 'Real Time Gross Settlement — high-value real-time transfers processed individually. Min ₹2L. Operating hours apply.', fee: '₹25–₹50', min: '₹2L', max: 'No cap', settle: 'Real-time', active: true, volume: 100164000, txns: 48 },
  { id: 'razorpay', logo: '🔷', name: 'Razorpay', desc: 'Full-stack payment gateway. Cards, UPI, Netbanking, Wallets, EMI, subscriptions. 8M+ businesses. PCI DSS Level 1.', fee: '2%', min: '₹100', max: '₹5Cr', settle: 'T+2', active: true, volume: 35057400, txns: 2100, apiKey: 'rzp_live_9a8f7b6c5d4e', merchantId: 'rzp_mch_881920' },
  { id: 'paytm', logo: '💰', name: 'Paytm PG', desc: "India's largest digital payments. Paytm Wallet, UPI, Cards, EMI, BNPL. 350M+ registered users.", fee: '1.99%', min: '₹10', max: '₹1L', settle: 'T+1', active: true, volume: 25875700, txns: 1540, vpaOrAddress: 'paytm-biz@paytm' },
  { id: 'cashfree', logo: '💚', name: 'Cashfree', desc: 'Fast-growing gateway with AutoCollect, instant refunds, split payments and VPA-based collection.', fee: '1.75%', min: '₹1', max: '₹5Cr', settle: 'T+1', active: true, volume: 7178420, txns: 380, apiKey: 'cf_live_key_9921', merchantId: 'CF_MCH_334' },
  { id: 'phonepe', logo: '🟣', name: 'PhonePe Biz', desc: 'PhonePe payment gateway with PG, Smart Collect, POS and Sound Box integrations.', fee: '0–2%', min: '₹1', max: '₹1L', settle: 'T+1', active: true, volume: 7846180, txns: 520, vpaOrAddress: 'phonepe.merchant@ybl' },
  { id: 'gpay', logo: '🟦', name: 'Google Pay Biz', desc: 'Google Pay for Business — UPI-based instant payments via deep link & QR. Zero MDR.', fee: '0%', min: '₹1', max: '₹1L', settle: 'Instant', active: true, volume: 5675960, txns: 840, vpaOrAddress: 'gpay.brickvest@okicici' },
  { id: 'bhim', logo: '🇮🇳', name: 'BHIM UPI', desc: "NPCI's flagship UPI app. Government-backed, supports 300+ banks. Ideal for rural/tier-2.", fee: '0%', min: '₹1', max: '₹1L', settle: 'Instant', active: true, volume: 1836340, txns: 180, vpaOrAddress: 'bhim.brickvest@upi' },
  { id: 'amazon_pay', logo: '📦', name: 'Amazon Pay', desc: "Amazon's payment solution — Wallet, UPI, Cards. Trusted by millions of Amazon users.", fee: '2%', min: '₹1', max: '₹1L', settle: 'T+1', active: false, volume: 0, txns: 0 },
  { id: 'instamojo', logo: '🟡', name: 'Instamojo', desc: 'Simple payment links for SMEs. No setup fee, instant activation, smart pages.', fee: '2%+₹3', min: '₹10', max: '₹2L', settle: 'T+3', active: false, volume: 0, txns: 0 },
  { id: 'ccavenue', logo: '🔶', name: 'CCAvenue', desc: "India's first multi-currency payment gateway. 200+ payment options, 27+ currencies.", fee: '2%', min: '₹1', max: 'No cap', settle: 'T+2', active: false, volume: 0, txns: 0 },
  { id: 'mobikwik', logo: '🔵', name: 'MobiKwik', desc: 'Digital wallet & BNPL. 120M+ users. Zip (BNPL) — pay later in easy installments.', fee: '1.5%', min: '₹1', max: '₹50K', settle: 'T+1', active: false, volume: 0, txns: 0 },
  { id: 'juspay', logo: '🟤', name: 'Juspay HyperPay', desc: 'Payment orchestrator & smart router. 400bps improvement in success rates. SDK-based integration.', fee: 'Custom', min: '₹1', max: 'No cap', settle: 'T+1', active: false, volume: 0, txns: 0 },
];

const INITIAL_INTL: GatewayItem[] = [
  { id: 'stripe', logo: '💜', name: 'Stripe', desc: 'Global payment infrastructure leader. 195+ countries, 135+ currencies. Radar fraud AI, Terminal, Billing.', fee: '2.9%+$0.30', min: '$0.50', max: 'No cap', settle: 'T+2', active: true, volume: 70114800, txns: 3200, apiKey: 'pk_live_51M0...', apiSecret: 'sk_live_51M0...' },
  { id: 'paypal', logo: '🔵', name: 'PayPal', desc: "World's most trusted digital wallet. Buyer protection, 200+ markets, 25+ currencies, Venmo integration.", fee: '3.49%+$0.49', min: '$1', max: 'No cap', settle: 'Instant to PayPal', active: true, volume: 35057400, txns: 1100, merchantId: 'paypal-biz@brickvest.com' },
  { id: 'wise', logo: '🌍', name: 'Wise', desc: 'International transfers at mid-market rate. 80+ countries, 50+ currencies. Lowest fees globally.', fee: '0.41–1.5%', min: '$1', max: 'Varies', settle: '1–2 days', active: true, volume: 24206300, txns: 180 },
  { id: 'apple_pay', logo: '🍎', name: 'Apple Pay', desc: 'One-touch payment for Apple devices. Biometric auth, no card details exposed. 500M+ users.', fee: 'Via gateway', min: '$0.50', max: 'Varies', settle: 'Via Stripe/Adyen', active: true, volume: 9348640, txns: 880 },
  { id: 'google_pay_intl', logo: '🔵', name: 'Google Pay', desc: "Google's global wallet. 700M+ users. Fast checkout on Android and Chrome across 70+ countries.", fee: 'Via gateway', min: '$0.50', max: 'Varies', settle: 'Via Stripe', active: true, volume: 8180060, txns: 720 },
  { id: 'adyen', logo: '🟩', name: 'Adyen', desc: 'Enterprise platform for global giants — Uber, Spotify, Microsoft. Unified commerce: online + in-store.', fee: 'Interchange++', min: 'No min', max: 'No cap', settle: 'T+2', active: false, volume: 0, txns: 0 },
  { id: 'checkout', logo: '✅', name: 'Checkout.com', desc: 'High-performance gateway with advanced fraud tools and global coverage. Transparent pricing.', fee: 'Custom', min: '$1', max: 'No cap', settle: 'T+2', active: false, volume: 0, txns: 0 },
  { id: 'klarna', logo: '🌸', name: 'Klarna', desc: 'BNPL leader in EU/US. Pay in 3, Pay in 30 days. Boosts conversion 30%+. 150M consumers.', fee: '3.29%+$0.30', min: '$10', max: '$10,000', settle: 'T+1', active: false, volume: 0, txns: 0 },
  { id: 'sepa', logo: '🇪🇺', name: 'SEPA Transfer', desc: 'Single Euro Payments Area — pan-European bank transfer standard. SEPA Credit Transfer & Direct Debit.', fee: '€0.20–€0.40', min: '€0.01', max: 'No cap', settle: 'T+1 (SCT) / D+1 (SDD)', active: true, volume: 15042000, txns: 92 },
  { id: 'ach', logo: '🇺🇸', name: 'ACH Transfer', desc: 'US Automated Clearing House. ACH Credit & Debit for domestic US bank transfers. Low cost.', fee: '0.5%+$0.25', min: '$1', max: '$25,000', settle: '1–3 business days', active: true, volume: 20056000, txns: 148 },
];

const INITIAL_CRYPTO: GatewayItem[] = [
  { id: 'bitcoin', logo: '₿', name: 'Bitcoin (BTC)', desc: 'Original peer-to-peer digital cash. 10-min block time. Best for large international transfers.', fee: '~$2–20 network', min: '0.0001 BTC', max: 'No cap', settle: '3 confirmations (~30 min)', active: true, volume: 15042000, txns: 42, vpaOrAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  { id: 'ethereum', logo: 'Ξ', name: 'Ethereum (ETH)', desc: 'Smart contract platform. EIP-1559 fee model. Fast finality with Layer 2 options.', fee: 'Gas fee (variable)', min: '0.001 ETH', max: 'No cap', settle: '~15 sec (L1) / <1 sec (L2)', active: true, volume: 20056000, txns: 68, vpaOrAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
  { id: 'usdt_trc20', logo: '💵', name: 'USDT TRC20', desc: 'USD-pegged stablecoin on Tron network. Near-zero fees, 3-second finality. Most popular stablecoin transfer.', fee: '~$1 flat', min: '$10', max: 'No cap', settle: '~1 min', active: true, volume: 51800000, txns: 210, vpaOrAddress: 'TYD2vK38M21m98JSkX99s7Vd6288s7k21x' },
  { id: 'usdt_erc20', logo: '💰', name: 'USDT ERC20', desc: 'USD stablecoin on Ethereum mainnet. Widely supported across all exchanges and wallets.', fee: 'Gas fee (~$2–15)', min: '$10', max: 'No cap', settle: '~15 sec', active: true, volume: 31730000, txns: 130, vpaOrAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
  { id: 'usdc', logo: '🔵', name: 'USDC', desc: "Circle's regulated stablecoin. Available on ETH, Solana, Polygon, Base, Arbitrum.", fee: 'Network fee', min: '$10', max: 'No cap', settle: 'Instant (Solana)', active: true, volume: 10028000, txns: 55, vpaOrAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
  { id: 'coinbase', logo: '🔷', name: 'Coinbase Commerce', desc: 'Accept crypto without custody risk. Auto-convert to USD. No chargebacks, global reach.', fee: '1%', min: '$1', max: 'No cap', settle: 'Instant', active: true, volume: 7014000, txns: 48, apiKey: 'cc_live_9921_key' },
];

const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_01', flag: '🇮🇳', label: 'Indian Bank Account (INR)', currency: 'INR', primary: true, active: true,
    fields: [
      { key: 'bankName', label: 'Bank Name', value: 'Axis Bank Ltd' },
      { key: 'accountName', label: 'Account Name', value: 'Brickvest Pvt Ltd Escrow' },
      { key: 'accountNumber', label: 'Account Number', value: '917020044889123' },
      { key: 'accountType', label: 'Account Type', value: 'Current Account' },
      { key: 'ifsc', label: 'IFSC Code', value: 'UTIB0001234' },
      { key: 'micr', label: 'MICR Code', value: '110211017' },
      { key: 'branch', label: 'Branch', value: 'Connaught Place, New Delhi' },
      { key: 'swift', label: 'SWIFT / BIC', value: 'AXISINBB' },
      { key: 'note', label: 'Payment Reference', value: 'Use your Customer ID (BKV-CUST-XXXX)' },
    ]
  },
  {
    id: 'bank_02', flag: '🇦🇪', label: 'International Account (USD)', currency: 'USD / AED / EUR / GBP', primary: false, active: true,
    fields: [
      { key: 'bankName', label: 'Bank Name', value: 'Emirates NBD' },
      { key: 'accountName', label: 'Account Name', value: 'Brickvest Global Ltd' },
      { key: 'accountNumber', label: 'Account Number', value: '1019999012345' },
      { key: 'iban', label: 'IBAN', value: 'AE070260001019999012345' },
      { key: 'swift', label: 'SWIFT / BIC', value: 'EBILAEAD' },
      { key: 'branch', label: 'Branch', value: 'DIFC, Dubai' },
      { key: 'currency', label: 'Accepted Currencies', value: 'USD / AED / EUR / GBP' },
    ]
  },
  {
    id: 'bank_03', flag: '🇬🇧', label: 'UK Bank Account (GBP)', currency: 'GBP', primary: false, active: true,
    fields: [
      { key: 'bankName', label: 'Bank Name', value: 'Barclays Bank PLC' },
      { key: 'accountName', label: 'Account Name', value: 'Brickvest UK Ltd' },
      { key: 'accountNumber', label: 'Account Number', value: '12345678' },
      { key: 'sortCode', label: 'Sort Code', value: '20-00-00' },
      { key: 'iban', label: 'IBAN', value: 'GB29BARC20000012345678' },
      { key: 'swift', label: 'SWIFT / BIC', value: 'BARCGB22' },
      { key: 'branch', label: 'Branch', value: 'London, EC2Y 5HQ' },
    ]
  }
];

const INITIAL_ACTIVITIES: PaymentActivity[] = [
  { ref: 'PAY-8000', userName: 'James Harrington', userInitials: 'JH', userBg: 'linear-gradient(135deg, #3b82f6, #6366f1)', method: 'UPI - PhonePe', gateway: 'Razorpay', amount: 6901633, fee: 138059, status: 'completed', date: '2026-04-14' },
  { ref: 'PAY-8001', userName: 'Priya Sharma', userInitials: 'PS', userBg: 'linear-gradient(135deg, #10b981, #059669)', method: 'Razorpay Card', gateway: 'Stripe', amount: 2519208, fee: 50416, status: 'completed', date: '2026-04-13' },
  { ref: 'PAY-8002', userName: 'Marcus Chen', userInitials: 'MC', userBg: 'linear-gradient(135deg, #f59e0b, #d97706)', method: 'NEFT', gateway: 'Cashfree', amount: 13241263, fee: 264850, status: 'completed', date: '2026-04-12' },
  { ref: 'PAY-8003', userName: 'Sophie Müller', userInitials: 'SM', userBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', method: 'IMPS', gateway: 'PhonePe', amount: 3925093, fee: 78462, status: 'pending', date: '2026-04-11' },
];

export function PaymentsManager({ recentPayments }: { recentPayments?: any[] }) {
  const [activeTab, setActiveTab] = useState<"domestic" | "intl" | "crypto" | "bank" | "settings">("domestic");

  const [domesticGateways, setDomesticGateways] = useState<GatewayItem[]>(INITIAL_DOMESTIC);
  const [intlGateways, setIntlGateways] = useState<GatewayItem[]>(INITIAL_INTL);
  const [cryptoGateways, setCryptoGateways] = useState<GatewayItem[]>(INITIAL_CRYPTO);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [activities] = useState<PaymentActivity[]>(INITIAL_ACTIVITIES);

  /* ─── MODAL STATES ─── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [configureGateway, setConfigureGateway] = useState<GatewayItem | null>(null);
  const [qrModalData, setQrModalData] = useState<{ name: string; vpaOrAddress: string; logo: string; fee: string } | null>(null);
  const [logsGateway, setLogsGateway] = useState<GatewayItem | null>(null);
  const [showAddBankModal, setShowAddBankModal] = useState(false);

  /* New Gateway Form State */
  const [newGwType, setNewGwType] = useState<"domestic" | "intl" | "crypto">("domestic");
  const [newGwName, setNewGwName] = useState("");
  const [newGwLogo, setNewGwLogo] = useState("💳");
  const [newGwDesc, setNewGwDesc] = useState("");
  const [newGwFee, setNewGwFee] = useState("1.5%");
  const [newGwMin, setNewGwMin] = useState("₹100");
  const [newGwMax, setNewGwMax] = useState("₹5L");
  const [newGwSettle, setNewGwSettle] = useState("T+1");
  const [newGwApiKey, setNewGwApiKey] = useState("");
  const [newGwMerchantId, setNewGwMerchantId] = useState("");
  const [newGwVpa, setNewGwVpa] = useState("");

  /* New Bank Form State */
  const [bankFlag, setBankFlag] = useState("🇮🇳");
  const [bankLabel, setBankLabel] = useState("");
  const [bankCurrency, setBankCurrency] = useState("INR");
  const [bankName, setBankName] = useState("");
  const [bankAccName, setBankAccName] = useState("");
  const [bankAccNo, setBankAccNo] = useState("");
  const [bankIfscSwift, setBankIfscSwift] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  /* Toast notification */
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleGateway = (type: "domestic" | "intl" | "crypto", id: string) => {
    if (type === "domestic") {
      setDomesticGateways(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g));
    } else if (type === "intl") {
      setIntlGateways(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g));
    } else {
      setCryptoGateways(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g));
    }
  };

  /* Add New Gateway Submit */
  const handleCreateGateway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGwName.trim()) return;

    const newGw: GatewayItem = {
      id: `gw_${Date.now()}`,
      logo: newGwLogo || "💳",
      name: newGwName,
      desc: newGwDesc || `${newGwName} payment gateway integration for digital payments.`,
      fee: newGwFee || "1.5%",
      min: newGwMin || "₹10",
      max: newGwMax || "₹5L",
      settle: newGwSettle || "T+1",
      active: true,
      volume: 0,
      txns: 0,
      apiKey: newGwApiKey,
      merchantId: newGwMerchantId,
      vpaOrAddress: newGwVpa,
    };

    if (newGwType === "domestic") setDomesticGateways(prev => [newGw, ...prev]);
    else if (newGwType === "intl") setIntlGateways(prev => [newGw, ...prev]);
    else setCryptoGateways(prev => [newGw, ...prev]);

    setShowAddModal(false);
    showToast(`Successfully added ${newGwName} payment gateway!`);
    
    // Reset form
    setNewGwName("");
    setNewGwDesc("");
    setNewGwApiKey("");
    setNewGwMerchantId("");
    setNewGwVpa("");
  };

  /* Save Configured Gateway */
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configureGateway) return;

    const updater = (list: GatewayItem[]) =>
      list.map((g) => (g.id === configureGateway.id ? configureGateway : g));

    setDomesticGateways(updater);
    setIntlGateways(updater);
    setCryptoGateways(updater);

    const gwName = configureGateway.name;
    setConfigureGateway(null);
    showToast(`Saved gateway settings for ${gwName}!`);
  };

  /* Add Bank Account Submit */
  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankLabel.trim() || !bankName.trim()) return;

    const newBank: BankAccount = {
      id: `bank_${Date.now()}`,
      flag: bankFlag || "🏦",
      label: bankLabel,
      currency: bankCurrency,
      primary: false,
      active: true,
      fields: [
        { key: "bankName", label: "Bank Name", value: bankName },
        { key: "accountName", label: "Account Name", value: bankAccName || "Brickvest Escrow" },
        { key: "accountNumber", label: "Account Number / IBAN", value: bankAccNo },
        { key: "ifsc", label: "IFSC / SWIFT Code", value: bankIfscSwift },
        { key: "branch", label: "Branch Location", value: bankBranch },
      ],
    };

    setBankAccounts((prev) => [...prev, newBank]);
    setShowAddBankModal(false);
    showToast(`Added receiver bank account: ${bankLabel}`);

    setBankLabel("");
    setBankName("");
    setBankAccName("");
    setBankAccNo("");
    setBankIfscSwift("");
    setBankBranch("");
  };

  const allGateways = [...domesticGateways, ...intlGateways, ...cryptoGateways];
  const activeCount = allGateways.filter((g) => g.active).length;
  const totalVol = allGateways.reduce((sum, g) => sum + (g.volume || 0), 0);
  const totalTxns = allGateways.reduce((sum, g) => sum + (g.txns || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP 4 KEY METRIC CARDS ── */}
      <div className="a-stats">
        <div className="a-sc">
          <div className="a-sc-ico">✅</div>
          <div className="a-sc-lbl">ACTIVE GATEWAYS</div>
          <div className="a-sc-val">{activeCount}</div>
          <div className="a-sc-sub up">of {allGateways.length} configured</div>
        </div>
        <div className="a-sc">
          <div className="a-sc-ico">💳</div>
          <div className="a-sc-lbl">TOTAL VOLUME (30D)</div>
          <div className="a-sc-val">₹{(totalVol / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })}L</div>
          <div className="a-sc-sub up">Across all methods</div>
        </div>
        <div className="a-sc">
          <div className="a-sc-ico">⇄</div>
          <div className="a-sc-lbl">TOTAL TRANSACTIONS</div>
          <div className="a-sc-val">{totalTxns.toLocaleString('en-IN')}</div>
          <div className="a-sc-sub nt">Last 30 days</div>
        </div>
        <div className="a-sc">
          <div className="a-sc-ico">📊</div>
          <div className="a-sc-lbl">PAYMENT SUCCESS RATE</div>
          <div className="a-sc-val">98.4%</div>
          <div className="a-sc-sub up">↑ +0.3% vs last month</div>
        </div>
      </div>

      {/* ── TABS BAR ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "domestic", label: "🇮🇳 Domestic (India)" },
            { id: "intl", label: "🌐 International" },
            { id: "crypto", label: "₿ Crypto" },
            { id: "bank", label: "🏦 Bank Transfer" },
            { id: "settings", label: "⚙ Gateway Settings" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`a-pay-tab ${activeTab === t.id ? "on" : ""}`}
              onClick={() => setActiveTab(t.id as any)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setNewGwType(activeTab === "crypto" ? "crypto" : activeTab === "intl" ? "intl" : "domestic");
            setShowAddModal(true);
          }}
          className="a-btn a-btn-acc a-btn-sm font-extrabold flex items-center gap-1.5 shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>+ Add Payment Gateway</span>
        </button>
      </div>

      {/* ── DOMESTIC PAYMENT METHODS — INDIA ── */}
      {activeTab === "domestic" && (
        <div>
          <div className="a-sh">
            <div className="a-sh-t">Domestic Payment Methods — India</div>
            <div className="a-sh-r">
              <button
                onClick={() => {
                  setNewGwType("domestic");
                  setShowAddModal(true);
                }}
                className="a-btn a-btn-acc a-btn-sm"
              >
                + Add Gateway
              </button>
            </div>
          </div>
          <div className="a-pgw-grid">
            {domesticGateways.map((g) => (
              <div key={g.id} className={`a-pgw-card ${g.active ? "active-gw" : "inactive-gw"}`}>
                <button
                  type="button"
                  className={`a-pgw-toggle ${g.active ? "toggle-on" : "toggle-off"}`}
                  onClick={() => toggleGateway("domestic", g.id)}
                  title={g.active ? "Disable gateway" : "Enable gateway"}
                />
                <div className="a-pgw-logo">{g.logo}</div>
                <div className="a-pgw-name">{g.name}</div>
                <div className="a-pgw-desc">{g.desc}</div>
                <div className="a-pgw-meta">
                  <div className="a-pgw-meta-row">
                    <span>Transaction Fee</span>
                    <span style={{ color: "var(--grn)" }}>{g.fee}</span>
                  </div>
                  <div className="a-pgw-meta-row">
                    <span>Min / Max</span>
                    <span>{g.min} – {g.max}</span>
                  </div>
                  <div className="a-pgw-meta-row">
                    <span>Settlement</span>
                    <span>{g.settle}</span>
                  </div>
                  {(g.volume ?? 0) > 0 && (
                    <div className="a-pgw-meta-row">
                      <span>30D Volume</span>
                      <span style={{ color: "var(--acc2)" }}>₹{(g.volume!).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(g.txns ?? 0) > 0 && (
                    <div className="a-pgw-meta-row">
                      <span>30D Txns</span>
                      <span>{(g.txns!).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="a-pgw-actions">
                  <button
                    className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1"
                    onClick={() => setConfigureGateway(g)}
                  >
                    <Settings2 className="h-3 w-3" /> Configure
                  </button>
                  <button
                    className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1"
                    onClick={() => setLogsGateway(g)}
                  >
                    <FileText className="h-3 w-3" /> Logs
                  </button>

                  {(g.vpaOrAddress || g.id === "upi" || g.id === "gpay" || g.id === "phonepe" || g.id === "paytm" || g.id === "bhim") && (
                    <button
                      className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1 text-amber-600 dark:text-amber-400"
                      onClick={() =>
                        setQrModalData({
                          name: g.name,
                          vpaOrAddress: g.vpaOrAddress || "brickvest@axisbank",
                          logo: g.logo,
                          fee: g.fee,
                        })
                      }
                      title="Show Scannable QR Code"
                    >
                      <QrCode className="h-3 w-3" /> QR Code
                    </button>
                  )}

                  {g.active ? (
                    <button className="a-btn a-btn-red a-btn-sm" onClick={() => toggleGateway("domestic", g.id)}>Disable</button>
                  ) : (
                    <button className="a-btn a-btn-grn a-btn-sm" onClick={() => toggleGateway("domestic", g.id)}>Enable</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INTERNATIONAL PAYMENT GATEWAYS ── */}
      {activeTab === "intl" && (
        <div>
          <div className="a-sh">
            <div className="a-sh-t">International Payment Gateways</div>
            <div className="a-sh-r">
              <button
                onClick={() => {
                  setNewGwType("intl");
                  setShowAddModal(true);
                }}
                className="a-btn a-btn-acc a-btn-sm"
              >
                + Add Gateway
              </button>
            </div>
          </div>
          <div className="a-pgw-grid">
            {intlGateways.map((g) => (
              <div key={g.id} className={`a-pgw-card ${g.active ? "active-gw" : "inactive-gw"}`}>
                <button
                  type="button"
                  className={`a-pgw-toggle ${g.active ? "toggle-on" : "toggle-off"}`}
                  onClick={() => toggleGateway("intl", g.id)}
                  title={g.active ? "Disable gateway" : "Enable gateway"}
                />
                <div className="a-pgw-logo">{g.logo}</div>
                <div className="a-pgw-name">{g.name}</div>
                <div className="a-pgw-desc">{g.desc}</div>
                <div className="a-pgw-meta">
                  <div className="a-pgw-meta-row">
                    <span>Transaction Fee</span>
                    <span style={{ color: "var(--grn)" }}>{g.fee}</span>
                  </div>
                  <div className="a-pgw-meta-row">
                    <span>Min / Max</span>
                    <span>{g.min} – {g.max}</span>
                  </div>
                  <div className="a-pgw-meta-row">
                    <span>Settlement</span>
                    <span>{g.settle}</span>
                  </div>
                  {(g.volume ?? 0) > 0 && (
                    <div className="a-pgw-meta-row">
                      <span>30D Volume</span>
                      <span style={{ color: "var(--acc2)" }}>₹{(g.volume!).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(g.txns ?? 0) > 0 && (
                    <div className="a-pgw-meta-row">
                      <span>30D Txns</span>
                      <span>{(g.txns!).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="a-pgw-actions">
                  <button className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1" onClick={() => setConfigureGateway(g)}>
                    <Settings2 className="h-3 w-3" /> Configure
                  </button>
                  <button className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1" onClick={() => setLogsGateway(g)}>
                    <FileText className="h-3 w-3" /> Logs
                  </button>
                  {g.active ? (
                    <button className="a-btn a-btn-red a-btn-sm" onClick={() => toggleGateway("intl", g.id)}>Disable</button>
                  ) : (
                    <button className="a-btn a-btn-grn a-btn-sm" onClick={() => toggleGateway("intl", g.id)}>Enable</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CRYPTO GATEWAYS ── */}
      {activeTab === "crypto" && (
        <div>
          <div className="a-sh">
            <div className="a-sh-t">Cryptocurrency & Web3 Gateways</div>
            <div className="a-sh-r">
              <button
                onClick={() => {
                  setNewGwType("crypto");
                  setShowAddModal(true);
                }}
                className="a-btn a-btn-acc a-btn-sm"
              >
                + Add Crypto Network
              </button>
            </div>
          </div>
          <div className="a-pgw-grid">
            {cryptoGateways.map((g) => (
              <div key={g.id} className={`a-pgw-card ${g.active ? "active-gw" : "inactive-gw"}`}>
                <button
                  type="button"
                  className={`a-pgw-toggle ${g.active ? "toggle-on" : "toggle-off"}`}
                  onClick={() => toggleGateway("crypto", g.id)}
                  title={g.active ? "Disable gateway" : "Enable gateway"}
                />
                <div className="a-pgw-logo">{g.logo}</div>
                <div className="a-pgw-name">{g.name}</div>
                <div className="a-pgw-desc">{g.desc}</div>
                <div className="a-pgw-meta">
                  <div className="a-pgw-meta-row">
                    <span>Transaction Fee</span>
                    <span style={{ color: "var(--grn)" }}>{g.fee}</span>
                  </div>
                  <div className="a-pgw-meta-row">
                    <span>Min / Max</span>
                    <span>{g.min} – {g.max}</span>
                  </div>
                  <div className="a-pgw-meta-row">
                    <span>Settlement</span>
                    <span>{g.settle}</span>
                  </div>
                  {(g.volume ?? 0) > 0 && (
                    <div className="a-pgw-meta-row">
                      <span>30D Volume</span>
                      <span style={{ color: "var(--acc2)" }}>₹{(g.volume!).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(g.txns ?? 0) > 0 && (
                    <div className="a-pgw-meta-row">
                      <span>30D Txns</span>
                      <span>{(g.txns!).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="a-pgw-actions">
                  <button className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1" onClick={() => setConfigureGateway(g)}>
                    <Settings2 className="h-3 w-3" /> Configure
                  </button>
                  <button className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1" onClick={() => setLogsGateway(g)}>
                    <FileText className="h-3 w-3" /> Logs
                  </button>
                  {g.vpaOrAddress && (
                    <button
                      className="a-btn a-btn-ghost a-btn-sm flex items-center gap-1 text-amber-600 dark:text-amber-400"
                      onClick={() =>
                        setQrModalData({
                          name: g.name,
                          vpaOrAddress: g.vpaOrAddress!,
                          logo: g.logo,
                          fee: g.fee,
                        })
                      }
                      title="Show Crypto Wallet QR Code"
                    >
                      <QrCode className="h-3 w-3" /> QR Code
                    </button>
                  )}
                  {g.active ? (
                    <button className="a-btn a-btn-red a-btn-sm" onClick={() => toggleGateway("crypto", g.id)}>Disable</button>
                  ) : (
                    <button className="a-btn a-btn-grn a-btn-sm" onClick={() => toggleGateway("crypto", g.id)}>Enable</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BANK TRANSFER ESCROW ACCOUNTS ── */}
      {activeTab === "bank" && (
        <div>
          <div className="a-sh">
            <div className="a-sh-t">Receiver Bank Accounts (Escrow & Settlement)</div>
            <div className="a-sh-r">
              <button onClick={() => setShowAddBankModal(true)} className="a-btn a-btn-acc a-btn-sm">
                + Add Bank Account
              </button>
            </div>
          </div>
          <div className="a-grid-3" style={{ marginBottom: 20 }}>
            {bankAccounts.map((b) => (
              <div key={b.id} className="a-bdc" style={{ opacity: b.active ? 1 : 0.55 }}>
                <div className="a-bdc-title">
                  <span>{b.flag}</span>
                  <span style={{ flex: 1 }}>{b.label}</span>
                  {b.primary && <span className="a-bd a-bd-g" style={{ fontSize: 8 }}>PRIMARY</span>}
                  {!b.active && <span className="a-bd a-bd-r" style={{ fontSize: 8 }}>INACTIVE</span>}
                </div>
                {b.fields.map((f) => (
                  <div key={f.key} className="a-bdc-row">
                    <span>{f.label}</span>
                    <span className="a-bdc-val">{f.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--b1)" }}>
                  <button className="a-btn a-btn-ghost a-btn-sm">✏ Edit</button>
                  <button className="a-btn a-btn-ghost a-btn-sm" style={{ color: "var(--acc2)" }}>💸 Transfer</button>
                </div>
              </div>
            ))}
            <div
              onClick={() => setShowAddBankModal(true)}
              style={{
                background: "var(--s3)",
                border: "2px dashed var(--b2)",
                borderRadius: 10,
                padding: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                minHeight: 160,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🏦</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--txt2)" }}>+ Add Bank Account</div>
                <div style={{ fontSize: 10, color: "var(--txt3)", marginTop: 4 }}>Click to add a new receiving account</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GATEWAY SETTINGS ── */}
      {activeTab === "settings" && (
        <div className="a-grid-3">
          <div className="a-psc">
            <div className="a-psc-title">General Settings</div>
            <div className="a-fg">
              <label className="a-fl">Default Settlement Currency</label>
              <select className="a-fi" defaultValue="INR">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="a-fg">
              <label className="a-fl">Minimum Deposit (₹)</label>
              <input className="a-fi" type="number" defaultValue={500} />
            </div>
            <div className="a-fg">
              <label className="a-fl">Maximum Deposit (₹)</label>
              <input className="a-fi" type="number" defaultValue={10000000} />
            </div>
          </div>

          <div className="a-psc">
            <div className="a-psc-title">Settlement Controls</div>
            <div className="a-fg">
              <label className="a-fl">Auto-settle User Deposits</label>
              <select className="a-fi" defaultValue="true">
                <option value="true">Enabled (Instant)</option>
                <option value="false">Manual Review Required</option>
              </select>
            </div>
            <div className="a-fg">
              <label className="a-fl">Fraud Hold Period (Hours)</label>
              <input className="a-fi" type="number" defaultValue={24} />
            </div>
          </div>

          <div className="a-psc">
            <div className="a-psc-title">Limits & Compliance</div>
            <div className="a-fg">
              <label className="a-fl">Daily Deposit Limit per User</label>
              <input className="a-fi" type="number" defaultValue={5000000} />
            </div>
            <div className="a-fg">
              <label className="a-fl">AML Reporting Threshold</label>
              <input className="a-fi" type="number" defaultValue={1000000} />
            </div>
          </div>
        </div>
      )}

      {/* ── RECENT PAYMENT ACTIVITY ── */}
      <div>
        <div className="a-sh">
          <div className="a-sh-t">Recent Payment Activity</div>
          <div className="a-sh-r">
            <button className="a-btn a-btn-ghost a-btn-sm">⬇ Export</button>
          </div>
        </div>

        <div className="a-tbl-wrap" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 800 }}>
            <thead>
              <tr>
                <th>REF</th>
                <th>USER</th>
                <th>METHOD</th>
                <th>GATEWAY</th>
                <th>AMOUNT</th>
                <th>FEE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.ref} style={act.status === "flagged" ? { background: "rgba(244,63,94,.03)" } : {}}>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--txt3)" }}>
                    {act.ref}
                  </td>
                  <td>
                    <div className="a-ud">
                      <div className="a-ua" style={{ background: act.userBg }}>
                        {act.userInitials}
                      </div>
                      <div className="a-un">{act.userName}</div>
                    </div>
                  </td>
                  <td>
                    <span className="a-bd a-bd-b" style={{ fontSize: 9 }}>
                      {act.method}
                    </span>
                  </td>
                  <td style={{ fontSize: 10, color: "var(--txt2)" }}>
                    {act.gateway}
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--txt)" }}>
                    ₹{act.amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontSize: 10, color: "var(--txt3)" }}>
                    ₹{act.fee.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`a-bd ${
                      act.status === 'completed' ? 'a-bd-g' :
                      act.status === 'pending' ? 'a-bd-a' :
                      act.status === 'flagged' ? 'a-bd-r' : 'a-bd-b'
                    }`}>
                      {act.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 10, color: "var(--txt3)" }}>
                    {act.date}
                  </td>
                  <td>
                    <button className="a-btn a-btn-ghost a-btn-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: + ADD PAYMENT GATEWAY POPUP ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-amber-500" /> Add Payment Gateway
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure a new domestic, international or crypto payment processor
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGateway} className="space-y-4 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Gateway Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGwType("domestic")}
                    className={`p-2.5 rounded-xl border font-bold text-center transition ${
                      newGwType === "domestic"
                        ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    🇮🇳 India Domestic
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGwType("intl")}
                    className={`p-2.5 rounded-xl border font-bold text-center transition ${
                      newGwType === "intl"
                        ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    🌐 International
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGwType("crypto")}
                    className={`p-2.5 rounded-xl border font-bold text-center transition ${
                      newGwType === "crypto"
                        ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    ₿ Crypto / Web3
                  </button>
                </div>
              </div>

              {/* Gateway Name & Logo */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Gateway Name</label>
                  <input
                    type="text"
                    placeholder="e.g. BillDesk, PayU, Square, Solana..."
                    value={newGwName}
                    onChange={(e) => setNewGwName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Logo Emoji</label>
                  <input
                    type="text"
                    value={newGwLogo}
                    onChange={(e) => setNewGwLogo(e.target.value)}
                    className="w-full text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-base text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  value={newGwDesc}
                  onChange={(e) => setNewGwDesc(e.target.value)}
                  placeholder="Describe fees, features, supported payment types..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* Fee & Limits */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Transaction Fee</label>
                  <input
                    type="text"
                    value={newGwFee}
                    onChange={(e) => setNewGwFee(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Min / Max</label>
                  <input
                    type="text"
                    value={newGwMin}
                    onChange={(e) => setNewGwMin(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Settlement</label>
                  <input
                    type="text"
                    value={newGwSettle}
                    onChange={(e) => setNewGwSettle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* API Credentials */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-amber-500" /> API Keys & VPA Settings
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="API Key / Publishable Key..."
                    value={newGwApiKey}
                    onChange={(e) => setNewGwApiKey(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Merchant ID / VPA Address..."
                    value={newGwVpa}
                    onChange={(e) => setNewGwVpa(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-2 transition shadow-md cursor-pointer"
                >
                  Add Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ⚙ CONFIGURE GATEWAY POPUP ── */}
      {configureGateway && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{configureGateway.logo}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Configure {configureGateway.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    API Keys, Webhooks, Settlement Rules & QR Settings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfigureGateway(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Gateway Title</label>
                <input
                  type="text"
                  value={configureGateway.name}
                  onChange={(e) => setConfigureGateway({ ...configureGateway, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">API Public Key / Client ID</label>
                  <input
                    type="text"
                    value={configureGateway.apiKey ?? ""}
                    onChange={(e) => setConfigureGateway({ ...configureGateway, apiKey: e.target.value })}
                    placeholder="pk_live_..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">API Secret Key</label>
                  <input
                    type="password"
                    value={configureGateway.apiSecret ?? ""}
                    onChange={(e) => setConfigureGateway({ ...configureGateway, apiSecret: e.target.value })}
                    placeholder="sk_live_..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Merchant ID / VPA Handle</label>
                  <input
                    type="text"
                    value={configureGateway.vpaOrAddress || configureGateway.merchantId || ""}
                    onChange={(e) => setConfigureGateway({ ...configureGateway, vpaOrAddress: e.target.value, merchantId: e.target.value })}
                    placeholder="brickvest@axisbank / 0x..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Webhook Endpoint URL</label>
                  <input
                    type="text"
                    value={configureGateway.webhookUrl ?? `https://brickvest.com/api/v1/webhooks/${configureGateway.id}`}
                    onChange={(e) => setConfigureGateway({ ...configureGateway, webhookUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Transaction Fee</label>
                  <input
                    type="text"
                    value={configureGateway.fee}
                    onChange={(e) => setConfigureGateway({ ...configureGateway, fee: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Settlement Cycle</label>
                  <input
                    type="text"
                    value={configureGateway.settle}
                    onChange={(e) => setConfigureGateway({ ...configureGateway, settle: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* QR Preview Trigger */}
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-300 block text-xs">Dynamic QR Code Test</span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400">Generate & test scannable QR Code for this gateway</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const vpa = configureGateway.vpaOrAddress || configureGateway.merchantId || "brickvest@axisbank";
                    setQrModalData({
                      name: configureGateway.name,
                      vpaOrAddress: vpa,
                      logo: configureGateway.logo,
                      fee: configureGateway.fee,
                    });
                  }}
                  className="rounded-xl bg-amber-500 text-white font-bold px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-amber-600 transition"
                >
                  <QrCode className="h-3.5 w-3.5" /> Test QR
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfigureGateway(null)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black px-5 py-2 transition shadow-md cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: 📱 SCANNABLE QR CODE POPUP ── */}
      {qrModalData && (
        <QrCodeModal
          data={qrModalData}
          onClose={() => setQrModalData(null)}
        />
      )}

      {/* ── MODAL 4: 📋 GATEWAY LOGS POPUP ── */}
      {logsGateway && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{logsGateway.logo}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {logsGateway.name} Gateway Logs & Webhooks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live API ping responses, webhook payloads & transaction health
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLogsGateway(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Gateway Operational (200 OK)
                </span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">Ping: 34ms</span>
              </div>

              {/* Log Stream Terminal */}
              <div className="rounded-2xl bg-slate-950 p-4 text-emerald-400 font-mono text-[11px] space-y-2 max-h-60 overflow-y-auto border border-slate-800 shadow-inner">
                <p><span className="text-slate-500">[2026-08-04 12:35:10]</span> POST /v1/webhooks/{logsGateway.id} <span className="text-emerald-400">200 OK</span> (42ms)</p>
                <p><span className="text-slate-500">[2026-08-04 12:31:04]</span> PAYLOAD: {`{"event": "payment.captured", "amount": 500000, "status": "success"}`}</p>
                <p><span className="text-slate-500">[2026-08-04 12:20:19]</span> POST /v1/payments/create <span className="text-emerald-400">200 OK</span> (28ms)</p>
                <p><span className="text-slate-500">[2026-08-04 11:45:00]</span> GET /v1/settlements/daily <span className="text-emerald-400">200 OK</span> (65ms)</p>
                <p><span className="text-slate-500">[2026-08-04 10:12:33]</span> POST /v1/refunds <span className="text-amber-400">200 OK</span> (31ms)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLogsGateway(null)}
                className="rounded-xl px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: 🏦 + ADD BANK ACCOUNT POPUP ── */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" /> Add Receiver Bank Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure escrow bank account for NEFT/RTGS/IMPS & Wire settlements
                </p>
              </div>
              <button
                onClick={() => setShowAddBankModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBank} className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Account Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Bank Escrow (INR), HDFC Corp..."
                    value={bankLabel}
                    onChange={(e) => setBankLabel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Flag</label>
                  <input
                    type="text"
                    value={bankFlag}
                    onChange={(e) => setBankFlag(e.target.value)}
                    className="w-full text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-base text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank, Axis, Emirates NBD..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Brickvest Pvt Ltd Escrow"
                    value={bankAccName}
                    onChange={(e) => setBankAccName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Account No. / IBAN</label>
                  <input
                    type="text"
                    placeholder="50100293848123"
                    value={bankAccNo}
                    onChange={(e) => setBankAccNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">IFSC / SWIFT Code</label>
                  <input
                    type="text"
                    placeholder="HDFC0001234 / EBILAEAD"
                    value={bankIfscSwift}
                    onChange={(e) => setBankIfscSwift(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Branch Location</label>
                  <input
                    type="text"
                    placeholder="Connaught Place, New Delhi"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Currency</label>
                  <select
                    value={bankCurrency}
                    onChange={(e) => setBankCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-bold outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-2 transition shadow-md cursor-pointer"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DYNAMIC QR CODE MODAL COMPONENT ─── */
function QrCodeModal({
  data,
  onClose,
}: {
  data: { name: string; vpaOrAddress: string; logo: string; fee: string };
  onClose: () => void;
}) {
  const [qrSrc, setQrSrc] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate UPI or Crypto URI
  const isCrypto = data.vpaOrAddress.startsWith("0x") || data.vpaOrAddress.startsWith("bc1") || data.vpaOrAddress.startsWith("T");
  const payloadString = isCrypto
    ? data.vpaOrAddress
    : `upi://pay?pa=${encodeURIComponent(data.vpaOrAddress)}&pn=Brickvest%20Escrow&cu=INR`;

  useEffect(() => {
    QRCode.toDataURL(payloadString, { width: 260, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrSrc)
      .catch(console.error);
  }, [payloadString]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.vpaOrAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-left">
            <span className="text-2xl">{data.logo}</span>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{data.name} Dynamic QR</h3>
              <p className="text-[10px] text-slate-500">Scan via GPay, PhonePe, Paytm, or Web3 Wallet</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 inline-block shadow-inner">
          {qrSrc ? (
            <img src={qrSrc} alt="Payment QR Code" className="w-52 h-52 mx-auto rounded-xl shadow-xs" />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs font-bold">
              Generating QR Code...
            </div>
          )}
        </div>

        {/* VPA Address & Copy */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {isCrypto ? "Receiving Wallet Address" : "Merchant VPA / BHIM ID"}
          </span>
          <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white break-all">
            <span>{data.vpaOrAddress}</span>
            <button onClick={handleCopy} className="text-amber-600 hover:text-amber-700 transition p-1" title="Copy Address">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* QR Actions */}
        <div className="flex gap-2 pt-2">
          <a
            href={qrSrc}
            download={`${data.name}_QR.png`}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Download className="h-4 w-4" /> Download QR
          </a>
        </div>
      </div>
    </div>
  );
}
