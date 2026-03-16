"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 p-10 max-w-md w-full text-center animate-fadeIn">
        
        {/* Cancel Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-slate-50 mb-6 border-8 border-slate-50/50">
          <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
          Payment Cancelled
        </h1>

        <p className="text-slate-500 text-base leading-relaxed mb-10 px-4">
          The transaction was not completed and no funds were moved. You can try again or return to your dashboard.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/deposit"
            className="w-full bg-[#0A2540] text-white py-4 rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            Try Deposit Again
          </Link>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-white text-slate-600 py-4 rounded-2xl font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}