"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 3-second delay to allow webhooks/ledger updates to settle
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-indigo-500/10 border border-slate-100 text-center max-w-md w-full animate-slideUp">
        
        {/* Animated Success Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 mb-6 border-8 border-emerald-50/50">
          <svg className="h-10 w-10 text-emerald-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Payment Successful</h2>
        <p className="text-slate-500 text-base leading-relaxed mb-8">
          Your funds have been received securely. We are currently synchronizing your ledger.
        </p>
        
        {/* Progress Indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#635BFF] h-full w-1/2 animate-[loading_2s_ease-in-out_infinite] rounded-full"></div>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Redirecting to Dashboard...
          </p>
        </div>

        <Link 
          href="/dashboard" 
          className="mt-8 inline-block text-sm font-medium text-[#635BFF] hover:text-[#4B45C6] transition-colors"
        >
          Click here if you aren't redirected
        </Link>
      </div>
    </div>
  );
}