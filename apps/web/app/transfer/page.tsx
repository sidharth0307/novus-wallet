"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function TransferPage() {
  const router = useRouter();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Open modal on send
  const handleTransfer = () => {
    if (!recipient || !amount || Number(amount) <= 0) {
      toast.error("Please enter a valid recipient and amount.");
      return;
    }
    setShowModal(true);
  };

  // Confirm transfer 
  const confirmTransfer = async () => {
    setLoading(true);
    
    const toastId = toast.loading("Processing transfer...");

    try {
      // Convert dollars to cents for the database
      const amountInCents = Math.round(parseFloat(amount) * 100);
      const idempotencyKey = crypto.randomUUID();

      await api("/wallet/transfer", {
        method: "POST",
        body: JSON.stringify({
          email: recipient,
          amount: amountInCents,
         description: description,
          idempotencyKey: idempotencyKey,
        }),
      });

      toast.success(`Successfully sent $${parseFloat(amount).toFixed(2)}`, { id: toastId });
      setShowModal(false);

      setTimeout(() => router.push("/dashboard"), 1500);

    } catch (err: any) {
      toast.error(err.message || "Transfer failed", { id: toastId });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative overflow-hidden flex justify-center items-start pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-40 pointer-events-none hidden sm:block">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-200 to-transparent blur-[80px] rounded-full mix-blend-multiply" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        
        {/* Main Glass Card */}
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
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Send Money</h1>
            <div className="w-10" /> 
          </div>

          {/* Amount Input (The Hero) */}
          <div className="flex justify-center items-center mb-10">
            <span className="text-5xl sm:text-6xl font-semibold text-slate-300 mr-2 select-none">$</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-6xl sm:text-7xl font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-[200px] placeholder-slate-200 focus:outline-none text-left"
              autoFocus
            />
          </div>

          {/* Inputs Section */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-[#635BFF] group-focus-within:bg-[#635BFF] group-focus-within:text-white transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Recipient Email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="block w-full pl-14 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-focus-within:bg-slate-200 group-focus-within:text-slate-600 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="What's this for? (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full pl-14 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100"
              />
            </div>

            <button
              onClick={handleTransfer}
              className="w-full bg-[#0A2540] hover:bg-slate-800 text-white text-base font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/10 mt-6 flex justify-center items-center gap-2 group"
            >
              Review Transfer
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Bottom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 animate-slideUp sm:animate-fadeIn">
            <h2 className="text-center text-xl font-bold text-slate-900 mb-6 tracking-tight">Review Transfer</h2>
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-4 border border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Amount</span>
                <span className="font-bold text-slate-900 text-lg">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">To</span>
                <span className="font-semibold text-[#635BFF] truncate max-w-[150px]">{recipient}</span>
              </div>
              {description && (
                <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-4 mt-4">
                  <span className="text-slate-500 font-medium">Note</span>
                  <span className="font-medium text-slate-700 truncate max-w-[150px]">{description}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransfer}
                disabled={loading}
                className="flex-1 px-4 py-3.5 bg-[#635BFF] text-white font-bold rounded-xl hover:bg-[#4B45C6] shadow-md shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  `Send $${parseFloat(amount).toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}