"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/app/lib/api";

export default function PublicPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const cashtag = params.cashtag as string;

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isValidating, setIsValidating] = useState(true);
  const [recipient, setRecipient] = useState<any>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
   if (!cashtag || cashtag === "undefined") return;

    const fetchRecipient = async () => {
      setIsValidating(true);
      setIsUnauthorized(false);
      
      try {
        const data = await api(`/wallet/lookup/${cashtag}`);
        setRecipient(data.user);
      } catch (err: any) {
        setRecipient(null); 
        if (err.status === 401 || err.message?.includes("401")) {
        setIsUnauthorized(true);
      }
      } finally {
        setIsValidating(false);
      }
    };

    fetchRecipient();
  }, [cashtag]);

  const handlePayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast("Please log in to send money.");
      router.push(`/login?redirect=/pay/${cashtag}`);
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Sending money to $${cashtag}...`);

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      const idempotencyKey = crypto.randomUUID();

      await api("/wallet/transfer", {
        method: "POST",
        body: JSON.stringify({
          receiverIdentifier: cashtag, 
          amount: amountInCents,
          description,
          idempotencyKey,
        }),
      });

      toast.success(`Sent $${amount} to $${cashtag}!`, { id: toastId });
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Transfer failed.", { id: toastId });
      setLoading(false);
    }
  };

  if (isValidating) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC]">Loading...</div>;
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F9FC] text-center p-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg className="w-8 h-8 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h1>
        <p className="text-slate-500 mb-6">Please log in to verify the recipient and send money to <strong>${cashtag}</strong>.</p>
        <button 
          onClick={() => router.push(`/login?redirect=/pay/${cashtag}`)} 
          className="bg-[#635BFF] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#4B45C6] transition-all shadow-lg"
        >
          Log In to Continue
        </button>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F9FC] text-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">User Not Found</h1>
        <p className="text-slate-500 mb-6">We couldn't find anyone with the cashtag <strong>${cashtag}</strong>.</p>
        <button onClick={() => router.push("/")} className="text-[#635BFF] font-semibold hover:underline">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative overflow-hidden flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 text-center">
          
          {/* Recipient Avatar & Name */}
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 text-white text-3xl font-bold uppercase">
            {cashtag.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-slate-900">Paying ${cashtag}</h2>
          
          {/* Giant Amount Input */}
          <div className="mt-8 mb-6 relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl text-slate-400 font-light">$</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center text-6xl font-bold text-slate-900 bg-transparent outline-none placeholder-slate-200 py-2"
              autoFocus
            />
          </div>

          {/* Optional Description */}
          <input
            type="text"
            placeholder="What's this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border-transparent rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 transition-all mb-8 text-center"
          />

          <button
            onClick={handlePayment}
            disabled={loading || !amount}
            className="w-full bg-[#0A2540] hover:bg-slate-800 text-white text-lg font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : `Send $${amount || "0"}`}
          </button>
        </div>
      </div>
    </div>
  );
}