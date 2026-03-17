"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "../lib/api";
import toast from "react-hot-toast";

 function RegisterContent
 () {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = useSearchParams().get("redirect");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating your secure ledger...");

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const pendingClaimToken = sessionStorage.getItem("pendingClaimToken");
      
      if (pendingClaimToken) {
        toast.success("Account created! Log in to claim your funds.", { id: toastId });
      } else {
        toast.success("Account created! Please sign in.", { id: toastId });
      }

      const loginUrl = `/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`;
      
      router.push(loginUrl);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account.", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative overflow-hidden flex items-center justify-center p-4 font-sans">
      
      {/* Decorative Background Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30 pointer-events-none hidden sm:block">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-emerald-200 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-14 h-14 bg-[#635BFF] rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 mb-6">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-sm text-slate-500 font-medium px-4">
              Join Novus and experience the future of programmable money.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Email Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#635BFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100 disabled:opacity-50"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#635BFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100 disabled:opacity-50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A2540] hover:bg-slate-800 text-white text-base font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/10 mt-2 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#635BFF] hover:text-[#4B45C6] font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}