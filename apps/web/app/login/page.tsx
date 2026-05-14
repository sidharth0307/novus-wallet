"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "../lib/api";
import toast from "react-hot-toast";

 function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [step, setStep] = useState<"login" | "forgot-request" | "forgot-reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Authenticating...");

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.token);

      const pendingClaimToken = sessionStorage.getItem("pendingClaimToken");

      if (pendingClaimToken) {
        toast.success("Welcome! Redirecting to your funds...", { id: toastId });
        router.push(`/claim/${pendingClaimToken}`);
      } else if (redirectTo) {
        toast.success("Logged in! Let's finish that payment.", { id: toastId });
        router.push(redirectTo); 
      } else {
        toast.success("Welcome!", { id: toastId });
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.message === "UNVERIFIED_ACCOUNT") {
        toast.error("Please verify your email before logging in.", { id: toastId });
        router.push("/register"); 
      } else {
        toast.error(err.message || "Invalid credentials. Please try again.", { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending reset code...");

    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success("Reset code sent!", { id: toastId });
      setStep("forgot-reset");
    } catch (err: any) {
      toast.error(err.message || "Failed to send code.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || newPassword.length < 6) {
      toast.error("Enter a valid 6-digit OTP and a new password (min 6 chars).");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating password...");

    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      });
      toast.success("Password updated! Please sign in.", { id: toastId });
      setStep("login");
      setPassword("");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative overflow-hidden flex items-center justify-center p-4 font-sans">
      
      {/* Decorative Background Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30 pointer-events-none hidden sm:block">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-300 to-purple-200 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10">
          
          {/* Dynamic Logo & Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-14 h-14 bg-[#0A2540] rounded-2xl flex items-center justify-center shadow-md mb-6">
              <span className="text-white font-extrabold text-2xl tracking-tighter">N</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {step === "login" && "Sign in to Novus"}
              {step === "forgot-request" && "Reset Password"}
              {step === "forgot-reset" && "Create New Password"}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {step === "login" && "Welcome back. Please enter your details."}
              {step === "forgot-request" && "Enter your email to receive a secure code."}
              {step === "forgot-reset" && `We sent a 6-digit code to ${email}.`}
            </p>
          </div>

          {/* 1. LOGIN FORM */}
          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
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
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#635BFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100 disabled:opacity-50"
                    required
                  />
                </div>
                {/* Forgot Password Link */}
                <div className="flex justify-end pr-1">
                  <button
                    type="button"
                    onClick={() => setStep("forgot-request")}
                    disabled={loading}
                    className="text-sm font-semibold text-[#635BFF] hover:text-[#4B45C6] transition-colors disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#635BFF] hover:bg-[#4B45C6] text-white text-base font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 mt-2 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* 2. FORGOT PASSWORD REQUEST FORM */}
          {step === "forgot-request" && (
            <form onSubmit={handleForgotRequest} className="space-y-5 animate-fadeIn">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#635BFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Enter your account email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100 disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#0A2540] hover:bg-slate-800 text-white text-base font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/10 mt-2 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Send Reset Code"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("login")}
                disabled={loading}
                className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors mt-2"
              >
                Remember your password? Sign in.
              </button>
            </form>
          )}

          {/* 3. RESET PASSWORD SUBMISSION FORM */}
          {step === "forgot-reset" && (
            <form onSubmit={handlePasswordReset} className="space-y-5 animate-fadeIn">
              {/* OTP Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#635BFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  maxLength={6}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-center tracking-[0.5em] text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100 disabled:opacity-50"
                  required
                />
              </div>

              {/* New Password Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#635BFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:bg-white focus:border-[#635BFF]/20 transition-all placeholder-slate-400 hover:bg-slate-100 disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || newPassword.length < 6}
                className="w-full bg-[#635BFF] hover:bg-[#4B45C6] text-white text-base font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 mt-2 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Update Password"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("login")}
                disabled={loading}
                className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors mt-2"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Footer Link - Only visible on the main login step */}
          {step === "login" && (
            <p className="text-center text-sm text-slate-500 mt-8 font-medium animate-fadeIn">
              Don't have an account?{" "}
              <Link 
                href={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} 
                className="text-[#635BFF] hover:text-[#4B45C6] font-bold transition-colors"
              >
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}