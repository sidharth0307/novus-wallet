"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); 
  
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [pathname]);

  // Define which routes should show the navbar. 
  const allowedRoutes = ["/dashboard", "/deposit", "/withdrawal", "/transfer"];
  const isAllowedRoute = allowedRoutes.includes(pathname);

  // If the current URL is not in the list, hide the navbar
  if (!isAllowedRoute) {
    return null; 
  }

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    toast.success("Signed out successfully");
    router.push("/");
  };

  // Prevent hydration mismatch by rendering a blank dark nav until client loads
  if (!isMounted) {
    return <nav className="bg-[#030712] border-b border-white/5 h-16 sticky top-0 z-40" />;
  }

  return (
    <nav className="bg-[#030712]/80 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left side: Logo & Primary Links */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-white/5 group-hover:bg-white/10 border border-white/10 transition-all rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <span className="text-white font-black text-lg leading-none">N</span>
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">NOVUS</span>
            </Link>

            {/* Navigation Links */}
            {isAuthenticated && (
              <div className="hidden sm:flex space-x-2">
                <Link 
                  href="/dashboard" 
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${pathname === '/dashboard' ? 'text-white bg-white/10 shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/transfer" 
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${pathname === '/transfer' ? 'text-white bg-white/10 shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  Transfer
                </Link>
                <Link 
                  href="/deposit" 
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${pathname === '/deposit' ? 'text-white bg-white/10 shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  Deposit
                </Link>
                <Link 
                  href="/withdraw" 
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${pathname === '/withdrawal' ? 'text-white bg-white/10 shadow-inner border border-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  Withdraw
                </Link>
              </div>
            )}
          </div>

          {/* Right side: Auth Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button 
                onClick={handleSignOut}
                className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors px-4 py-2 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-bold bg-white text-slate-950 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Sign up
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}