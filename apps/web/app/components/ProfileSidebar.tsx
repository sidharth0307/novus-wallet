"use client";

import QRCode from "react-qr-code";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    cashtag: string;
    email: string;
  };
}

export default function ProfileSidebar({ isOpen, onClose, user }: ProfileSidebarProps) {
  const paymentUrl = typeof window !== "undefined" ? `${window.location.origin}/pay/${user.cashtag}` : "";

  return (
    <>
      {/* 1. The Blurred Overlay (Clicks outside will close the sidebar) */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* 2. The Sliding Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-slate-100 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Decorative Background Mesh (Cute glowing orbs) */}
        <div className="absolute top-0 left-0 w-full h-64 overflow-hidden pointer-events-none rounded-tl-3xl">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200 blur-[80px] rounded-full opacity-60 mix-blend-multiply" />
          <div className="absolute top-10 -left-20 w-48 h-48 bg-indigo-200 blur-[60px] rounded-full opacity-60 mix-blend-multiply" />
        </div>

        <div className="relative h-full flex flex-col p-8 overflow-y-auto">
          
          {/* Header & Close Button */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Profile</h2>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info Section */}
          <div className="flex flex-col items-center text-center mb-10">
            {/* Gradient Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 mb-4 shadow-xl shadow-purple-500/20">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-4 border-white text-3xl font-bold text-indigo-600 uppercase">
                {user.cashtag?.charAt(0) || "U"}
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
              ${user.cashtag}
            </h3>
            <p className="text-sm font-medium text-slate-400">{user.email}</p>
          </div>

          {/* The QR Code Card */}
          <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center text-center border border-slate-100 shadow-sm relative group">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4">
              Scan to Pay Me
            </p>
            
            <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 transition-transform group-hover:scale-105 duration-300">
              {paymentUrl ? (
                <QRCode value={paymentUrl} size={160} level="H" fgColor="#0A2540" />
              ) : (
                <div className="w-[160px] h-[160px] bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>
            
            <p className="text-xs text-slate-500 max-w-[200px]">
              Anyone can scan this code with their phone camera to send you money instantly.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}