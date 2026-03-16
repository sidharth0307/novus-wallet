"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount to deposit.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Preparing secure checkout...");

    try {
      const amountInCents = Math.round(numericAmount * 100);

      const res = await api("/payment/create", {
        method: "POST",
        body: JSON.stringify({ amount: amountInCents }),
      });

      if (res.url) {
        toast.success("Redirecting to Stripe...", { id: toastId });
        window.location.href = res.url;
      } else {
        throw new Error("Failed to generate payment link");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during checkout.", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative overflow-hidden flex justify-center items-start pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Background Decorative Mesh */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[500px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#635BFF] to-transparent blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8">
          
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
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Add Funds</h1>
            <div className="w-10" />
          </div>

          <form onSubmit={handleDeposit}>
            {/* Amount Input (Hero Style) */}
            <div className="flex justify-center items-center mb-12">
              <span className="text-5xl sm:text-6xl font-semibold text-slate-300 mr-2 select-none">$</span>
              <input
                type="number"
                step="0.01"
                min="0.50"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-6xl sm:text-7xl font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-[200px] placeholder-slate-200 focus:outline-none"
                autoFocus
                required
              />
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">PCI Secure</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <svg className="w-4 h-4 text-[#635BFF]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.962 10.134l-1.63 4.542h2.22l.534 1.43h-5.112l-.534-1.43h1.614l1.644-4.542h-2.22l-.535-1.43h5.101l.551 1.43h-1.533zm-4.475-6.134h-6.41l-.544 1.43h1.365c1.104 0 1.303.199 1.554.882l2.365 6.327-2.618 7.022h5.111l6.766-18.231h-2.148l-1.472 4.14-3.111-8.14z" />
                </svg>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">via Stripe</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#635BFF] hover:bg-[#4B45C6] text-white text-base font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center group"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  Continue to Checkout
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
            
            <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed px-4">
              Funds will be available in your Novus wallet immediately after successful payment verification.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}