"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import ProfileSidebar from "../components/ProfileSidebar"; // Make sure this path is correct!

type UserInfo = {
  id: string;
  email: string;
  cashtag?: string; 
};

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  type: "TRANSFER" | "DEPOSIT" | "WITHDRAW";
  status: string;
  description?: string;
  createdAt: string;
  expiresAt?: string;
  direction: "IN" | "OUT";
  fromUser: UserInfo | null;
  toUser: UserInfo | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; cashtag: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancelModalTxId, setCancelModalTxId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch User Profile
  const fetchUser = async () => {
    try {
      const res = await api("/auth/profile"); 
      setUser(res.user);
    } catch (err: any) {
      console.error("Failed to fetch user profile:", err);
      if (err.message.includes("429") || err.message.toLowerCase().includes("too many requests")) {
        toast.error("You're moving too fast! Take a breath.");
      }
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await api("/wallet/balance");
      setBalance(res.balance);
    } catch (err: any) {
      console.error("Failed to fetch balance:", err);
      toast.error("Failed to load balance");
    }
  };

  const fetchTransactions = async (nextCursor?: string) => {
    if (nextCursor) setLoadingMore(true);
    else setLoading(true);

    try {
      const url = nextCursor
        ? `/wallet/transactions?cursor=${nextCursor}`
        : `/wallet/transactions`;

      const res = await api(url);

      if (nextCursor) {
        setTransactions((prev) => [...prev, ...res.transactions]);
      } else {
        setTransactions(res.transactions || []);
      }

      setCursor(res.nextCursor || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Fetch everything concurrently
    Promise.all([fetchUser(), fetchBalance(), fetchTransactions()]);
  }, [router]);

  // Helper to calculate time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const total = Date.parse(expiresAt) - Date.now();
    if (total <= 0) return "Expired";
    
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return `Expires in ${days}d ${hours}h`;
    return `Expires in ${hours}h`;
  };

  const renderTransactionTitle = (tx: Transaction) => {
    if (tx.type === "DEPOSIT") return "Stripe Deposit";
    if (tx.type === "WITHDRAW") return "Bank Withdrawal";
    if (tx.type === "TRANSFER") {
      const otherUser = tx.direction === "OUT" ? tx.toUser : tx.fromUser;
      // Show cashtag if available, otherwise fallback to email
      const identifier = otherUser?.cashtag ? `$${otherUser.cashtag}` : otherUser?.email;
      return `Transfer ${tx.direction === "OUT" ? 'to' : 'from'} ${identifier}`;
    }
    return tx.type;
  };

  const handleConfirmCancel = async (txId: string) => {
    setIsCancelling(true);
    const toastId = toast.loading("Securely refunding to wallet...");
    
    try {
      await api(`/wallet/transfer/${txId}/cancel`, { method: "POST" });
      toast.success("Funds safely refunded!", { id: toastId });
      
      fetchBalance();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel transfer", { id: toastId });
    } finally {
      setIsCancelling(false);
      setCancelModalTxId(null); 
    }
  };

  if (loading && !balance) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#635BFF]"></div>
          <p className="text-sm font-medium text-slate-500">Syncing ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* PAGE HEADER  */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your funds and track recent activity.</p>
          </div>
          
          {user && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-lg font-bold flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105 border-2 border-white"
            >
              {user.cashtag?.charAt(0).toUpperCase() || "U"}
            </button>
          )}
        </div>

        {/* Top Grid: Balance & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Premium Balance Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-[#0A2540] to-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-slate-900/10 flex flex-col justify-between min-h-[220px]">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-[#635BFF]/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <p className="text-slate-400 text-sm font-medium tracking-wide uppercase mb-2">Available Balance</p>
              <h2 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                ${balance !== null ? (balance / 100).toFixed(2) : "0.00"}
              </h2>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Ledger synchronized
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center gap-4">
            <Link 
              href="/deposit"
              className="flex items-center gap-3 w-full bg-slate-50 hover:bg-[#635BFF]/10 text-slate-700 hover:text-[#635BFF] p-4 rounded-2xl transition-all group border border-transparent hover:border-[#635BFF]/20"
            >
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-[#635BFF]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="font-semibold">Add Funds</span>
            </Link>

            <Link 
              href="/transfer"
              className="flex items-center gap-3 w-full bg-[#635BFF] hover:bg-[#4B45C6] text-white p-4 rounded-2xl transition-all group shadow-md shadow-indigo-500/20"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </div>
              <span className="font-semibold">Send Money</span>
            </Link>

            <Link 
              href="/withdraw"
              className="flex items-center gap-3 w-full bg-slate-50 hover:bg-slate-100 text-slate-700 p-4 rounded-2xl transition-all group border border-slate-100"
            >
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-slate-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <span className="font-semibold">Withdraw</span>
            </Link>
          </div>
        </div>

       {/* Transactions List */}
        <div className="bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h3>
          </div>

          {transactions.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-slate-500 font-medium">No transactions yet.</p>
              <p className="text-slate-400 text-sm mt-1">When you move money, it will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-6 sm:px-8 py-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">

                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    
                    {/* Dynamic Icon based on direction */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      tx.direction === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                    }`}>
                      {tx.direction === "IN" ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {renderTransactionTitle(tx)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                        {tx.status !== "SUCCESS" && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {tx.status}
                          </span>
                        )}
                      </div>
                      {tx.description && (
                        <p className="text-xs text-slate-400 mt-1 italic truncate">"{tx.description}"</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right pl-4 flex flex-col items-end shrink-0">
                    {/* The Amount Display */}
                    <p className={`text-lg font-bold tracking-tight ${
                      tx.direction === "OUT" ? "text-slate-900" : "text-emerald-600"
                    } ${tx.status === "CANCELLED" || tx.status === "EXPIRED" ? "line-through opacity-50" : ""}`}>
                      {tx.direction === "OUT" ? "-" : "+"}${(tx.amount / 100).toFixed(2)}
                    </p>

                    {/* THE NEW ESCROW CONTROLS */}
                    {tx.direction === "OUT" && tx.status === "PENDING_CLAIM" && (
                      <div className="flex flex-col items-end mt-2">
                        {/* Expiration Countdown */}
                        {tx.expiresAt && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md mb-2 border border-amber-100 whitespace-nowrap">
                            ⏳ {getTimeRemaining(tx.expiresAt)}
                          </span>
                        )}
                        
                        {/* The Cancel & Refund Button */}
                        <button 
                          onClick={() => setCancelModalTxId(tx.id)}
                          className="text-xs text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500 transition-all shadow-sm whitespace-nowrap"
                        >
                          Cancel & Refund
                        </button>
                      </div>
                    )}

                    {/* Display if it was cancelled/expired */}
                    {(tx.status === "CANCELLED" || tx.status === "EXPIRED") && (
                      <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 whitespace-nowrap">
                        {tx.status === "CANCELLED" ? "Refunded to you" : "Auto-Refunded"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Button */}
          {cursor && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => fetchTransactions(cursor)}
                disabled={loadingMore}
                className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  "Load older transactions"
                )}
              </button>
            </div>
          )}
        </div>

      </div>

      {/*  SIDEBAR COMPONENT  */}
      {user && (
        <ProfileSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          user={user} 
        />
      )}

      {/* Custom Dark Theme Confirmation Modal */}
      {cancelModalTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/60 backdrop-blur-sm animate-fadeIn">
          
          <div className="bg-[#0a0f1c] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transform scale-100 transition-all">
            
            {/* Subtle top red glow edge */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            
            {/* Warning Icon */}
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Refund Transfer?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              This will instantly void the secure escrow link and return the funds directly to your available balance. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setCancelModalTxId(null)}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 hover:text-white transition-colors border border-white/5 disabled:opacity-50"
              >
                Keep Link
              </button>
              <button 
                onClick={() => handleConfirmCancel(cancelModalTxId)}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] disabled:opacity-50 flex justify-center items-center"
              >
                {isCancelling ? "Refunding..." : "Yes, Refund"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}