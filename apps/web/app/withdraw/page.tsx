"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Initiating withdrawal...");

    try {
      const amountInCents = Math.round(numericAmount * 100);

      await api("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount: amountInCents }),
      });

      toast.success("Withdrawal initiated successfully", { id: toastId });
      setSuccess(true);
      
      // Short delay so the user can see the success state
      setTimeout(() => router.push("/dashboard"), 2500);

    } catch (err: any) {
      // Catch the specific missing account error from the backend
      if (err.message === "STRIPE_ACCOUNT_MISSING") {
        toast.dismiss(toastId);
        setNeedsOnboarding(true);
      } else {
        toast.error(err.message || "An error occurred while processing your withdrawal.", { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBankSetup = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating secure Stripe link...");
    
    try {
      const res = await api("/wallet/payout-setup", { method: "POST" });
      if (res.url) {
        toast.success("Redirecting to Stripe...", { id: toastId });
        // Redirect to Stripe's secure onboarding flow
        window.location.href = res.url; 
      }
    } catch (err: any) {
      toast.error("Failed to start bank setup. Please try again.", { id: toastId });
      setLoading(false);
    }
  };

  // State 1: Success UI
  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-indigo-500/10 border border-slate-100 text-center max-w-md w-full animate-slideUp">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 mb-6 border-8 border-emerald-50/50">
            <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Withdrawal Initiated</h2>
          <p className="text-slate-500 text-base leading-relaxed mb-6">
            Your funds are securely on their way. They will arrive in your linked bank account within 2-3 business days.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm font-medium text-slate-600">Amount Transferred</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${parseFloat(amount).toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Needs Bank Onboarding UI
  if (needsOnboarding) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] flex flex-col justify-center items-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-indigo-500/10 border border-slate-100 text-center max-w-md w-full animate-slideUp">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-50 mb-6">
            <svg className="h-10 w-10 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Link Your Bank</h2>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            To comply with financial regulations and ensure secure payouts, you need to link a receiving bank account via Stripe.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleBankSetup}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-md shadow-indigo-500/20 text-base font-semibold text-white bg-[#635BFF] hover:bg-[#4B45C6] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  Set up securely with Stripe
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7-7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setNeedsOnboarding(false);
                setAmount("");
              }}
              className="w-full py-4 px-4 text-sm font-medium text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Standard Withdrawal Form UI
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative overflow-hidden flex justify-center items-start pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-30 pointer-events-none hidden sm:block">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-200 to-transparent blur-[80px] rounded-full mix-blend-multiply" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full flex items-center justify-center transition-colors border border-slate-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Withdraw Funds</h1>
            <div className="w-10" /> 
          </div>

          <form onSubmit={handleWithdraw}>
            {/* Amount Input (The Hero) */}
            <div className="flex justify-center items-center mb-10">
              <span className="text-5xl sm:text-6xl font-semibold text-slate-300 mr-2 select-none">$</span>
              <input
                type="number"
                step="0.01"
                min="0.50"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-6xl sm:text-7xl font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-[200px] placeholder-slate-200 focus:outline-none text-left"
                autoFocus
                required
              />
            </div>

            {/* Destination Info Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination</p>
                <p className="text-sm font-medium text-slate-900">Linked Bank Account</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A2540] hover:bg-slate-800 text-white text-base font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/10 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Confirm Withdrawal"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}