"use client";

export type SyncedTransaction = {
  id: string;
  userId: string; // e.g. "USR-10030" or database id
  userName: string;
  userEmail: string;
  type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | "REFUND";
  propertyTitle: string;
  propertySymbol: string;
  method: string;
  gateway?: string;
  amount: number;
  fee: number;
  status: "completed" | "pending" | "flagged" | "processing";
  date: string;
};

export const INITIAL_SYNCED_TRANSACTIONS: SyncedTransaction[] = [
  {
    id: "TXN-8821",
    userId: "USR-10001",
    userName: "James Harrington",
    userEmail: "james@example.com",
    type: "BUY",
    propertyTitle: "Kensington Manor",
    propertySymbol: "BKV-PROP-LON-001",
    method: "Escrow Bank Transfer",
    gateway: "Razorpay Escrow",
    amount: 12520500,
    fee: 12520,
    status: "completed",
    date: "2026-04-14 09:12",
  },
  {
    id: "TXN-8820",
    userId: "USR-10003",
    userName: "Marcus Chen",
    userEmail: "marcus@example.com",
    type: "SELL",
    propertyTitle: "Manhattan Penthouse",
    propertySymbol: "BKV-PROP-NYC-003",
    method: "Direct Wire",
    gateway: "Stripe Connect",
    amount: 23705480,
    fee: 23705,
    status: "completed",
    date: "2026-04-14 08:45",
  },
  {
    id: "TXN-8819",
    userId: "USR-10004",
    userName: "Sophie Müller",
    userEmail: "sophie@example.com",
    type: "BUY",
    propertyTitle: "Swiss Chalet",
    propertySymbol: "BKV-PROP-VRB-005",
    method: "Cheque / NEFT",
    gateway: "HDFC Escrow",
    amount: 3505740,
    fee: 3505,
    status: "flagged",
    date: "2026-04-14 07:33",
  },
  {
    id: "TXN-8818",
    userId: "USR-10002",
    userName: "Priya Sharma",
    userEmail: "priya@example.com",
    type: "BUY",
    propertyTitle: "Tuscany Villa",
    propertySymbol: "BKV-PROP-FLR-004",
    method: "UPI Payment",
    gateway: "Paytm Escrow",
    amount: 6677600,
    fee: 6677,
    status: "completed",
    date: "2026-04-13 18:20",
  },
  {
    id: "TXN-8817",
    userId: "USR-10006",
    userName: "Liam O'Sullivan",
    userEmail: "liam@example.com",
    type: "SELL",
    propertyTitle: "Malibu Beach House",
    propertySymbol: "BKV-PROP-MAL-002",
    method: "Wire Transfer",
    gateway: "Direct Escrow",
    amount: 43404400,
    fee: 43404,
    status: "pending",
    date: "2026-04-13 14:10",
  },
  {
    id: "TXN-8816",
    userId: "USR-10005",
    userName: "Adeola Williams",
    userEmail: "adeola@example.com",
    type: "BUY",
    propertyTitle: "Bondi Beachfront",
    propertySymbol: "BKV-PROP-SYD-006",
    method: "IMPS Payout",
    gateway: "Cashfree",
    amount: 5425550,
    fee: 5425,
    status: "completed",
    date: "2026-04-13 11:05",
  },
];

const STORAGE_KEY = "realestate_crm_transactions";

export function getAllSyncedTransactions(): SyncedTransaction[] {
  if (typeof window === "undefined") return INITIAL_SYNCED_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SYNCED_TRANSACTIONS));
      return INITIAL_SYNCED_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SYNCED_TRANSACTIONS));
    return INITIAL_SYNCED_TRANSACTIONS;
  } catch (e) {
    return INITIAL_SYNCED_TRANSACTIONS;
  }
}

export function saveSyncedTransactions(txns: SyncedTransaction[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
    window.dispatchEvent(new Event("realestate_crm_transactions_updated"));
  } catch (e) {
    console.error("Failed to save transactions to localStorage", e);
  }
}

export function getTransactionsForUser(user: {
  id?: string;
  userId?: string | null;
  email: string;
  name: string;
}): SyncedTransaction[] {
  const all = getAllSyncedTransactions();
  const uId = (user.userId || user.id || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  const name = (user.name || "").toLowerCase();

  const userTxns = all.filter((t) => {
    const tUserId = (t.userId || "").toLowerCase();
    const tEmail = (t.userEmail || "").toLowerCase();
    const tName = (t.userName || "").toLowerCase();

    return (
      (uId && tUserId === uId) ||
      (email && tEmail === email) ||
      (name && tName === name) ||
      (uId && tUserId.includes(uId)) ||
      (uId && uId.includes(tUserId))
    );
  });

  if (userTxns.length > 0) {
    return userTxns;
  }

  // If no transactions exist yet for this specific user, create 2 initial transactions explicitly tied to this user & save to store
  const generatedId = user.userId || `USR-${(user.id || "10030").slice(-5).toUpperCase()}`;
  const seed = Math.abs(user.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
  
  const createdTxns: SyncedTransaction[] = [
    {
      id: `TXN-${generatedId.replace("USR-", "")}-01`,
      userId: generatedId,
      userName: user.name,
      userEmail: user.email,
      type: "BUY",
      propertyTitle: "DLF Privana South Phase II",
      propertySymbol: "BKV-PROP-GUG-008",
      method: "Escrow Wire Transfer",
      gateway: "HDFC Escrow",
      amount: 15500000 + (seed * 1000),
      fee: 15500,
      status: "completed",
      date: "2026-04-14 09:12",
    },
    {
      id: `TXN-${generatedId.replace("USR-", "")}-02`,
      userId: generatedId,
      userName: user.name,
      userEmail: user.email,
      type: "DEPOSIT",
      propertyTitle: "Emaar Palm Heights Escrow",
      propertySymbol: "BKV-PROP-GUG-002",
      method: "Cheque / IMPS",
      gateway: "ICICI Bank",
      amount: 500000 + (seed * 500),
      fee: 0,
      status: "completed",
      date: "2026-04-10 14:20",
    },
  ];

  const updatedAll = [...createdTxns, ...all];
  saveSyncedTransactions(updatedAll);
  return createdTxns;
}
