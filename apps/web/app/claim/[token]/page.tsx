"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/app/lib/api";

export default function ClaimPage() {
  const router = useRouter();
  const params = useParams();
  const claimToken = params.token as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      sessionStorage.setItem("pendingClaimToken", claimToken);
    }
  }, [claimToken]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      router.push("/register");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Securely claiming your funds...");

    try {
      await api("/wallet/claim", {
        method: "POST",
        body: JSON.stringify({ claimToken }),
      });

      toast.success("Funds successfully added to your wallet!", { id: toastId });
      sessionStorage.removeItem("pendingClaimToken"); // Clean up
      
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to claim funds. This link may be expired.", { id: toastId });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#030712] relative overflow-hidden flex items-center justify-center p-4 font-sans selection:bg-[#635BFF] selection:text-white">
      
      {/* Cinematic Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20 pointer-events-none hidden sm:block">
        <div className="absolute inset-0 bg-gradient-to-b from-[#635BFF] to-teal-500 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        
        {/* Glassmorphism Dark Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
          
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Elegant Icon Container */}
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-[0_0_30px_rgba(99,91,255,0.15)]">
            <svg className="w-8 h-8 text-[#635BFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
            Funds ready to claim.
          </h1>
          
          <p className="text-slate-400 font-medium mb-10 leading-relaxed text-sm sm:text-base">
            A secure transfer has been placed in escrow for you. 
            {isAuthenticated 
              ? " Click below to deposit the funds directly into your wallet." 
              : " Please set up your free wallet to securely receive this transfer."}
          </p>

          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-100 text-slate-950 text-lg font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {isLoading 
              ? "Processing securely..." 
              : isAuthenticated 
                ? "Deposit to Wallet" 
                : "Set Up Wallet to Claim"}
          </button>

          {/* Trust Indicator */}
          <p className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" /></svg>
            Secured by Novus Escrow
          </p>

        </div>
      </div>
    </div>
  );
}