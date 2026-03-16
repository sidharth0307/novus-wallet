import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] font-sans selection:bg-[#635BFF] selection:text-white overflow-hidden relative">
      
      {/* DRAMATIC AMBIENT GLOW */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#635BFF] to-teal-500 blur-[200px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* HERO SECTION: Monolithic Brand Focus */}
      <main className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 z-10 pt-20">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-medium mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Novus Core v2.0 is now live
        </div>

        {/* MASSIVE BRAND TITLE */}
        <h1 className="text-[6rem] sm:text-[9rem] lg:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/20 tracking-tighter leading-none mb-6 select-none">
          NOVUS.
        </h1>
        
        <p className="text-xl sm:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
          Programmable money has arrived. Experience instant $cashtags, auto-refunding escrow, and mathematically flawless ledger security.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-md mx-auto sm:max-w-none sm:justify-center">
          <Link href="/register" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3">
            Open Wallet <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 text-white font-semibold border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-2">
            Access Dashboard
          </Link>
        </div>
      </main>

      {/* DARK BENTO GRID: Feature Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 border-t border-white/5 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Large Feature Card: Smart Escrow */}
          <div className="md:col-span-2 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-10 border border-white/10 hover:border-white/20 transition-colors relative group overflow-hidden">
            <div className="relative z-10 w-full md:w-2/3">
              <div className="w-14 h-14 bg-[#635BFF]/20 rounded-2xl flex items-center justify-center mb-6 border border-[#635BFF]/30 backdrop-blur-md">
                <span className="text-3xl">📧</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Smart Escrow Links.</h3>
              <p className="text-slate-400 leading-relaxed mb-8 text-lg">
                Send money to unregistered users safely. Novus locks funds in escrow and generates a secure claim link. If untouched for 7 days, funds auto-refund instantly.
              </p>
            </div>
            {/* Background graphic */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5" className="transform translate-x-1/4 translate-y-1/4">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Small Feature Card 1: Cashtags */}
          <div className="bg-gradient-to-b from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-colors group">
            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6 border border-teal-500/20">
              <span className="text-2xl font-black text-teal-400">$</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Universal Routing</h4>
            <p className="text-slate-400 leading-relaxed">
              Move money instantly via unique $cashtags or scan a peer's QR code. The ledger routes it flawlessly.
            </p>
          </div>

          {/* Small Feature Card 2: Security */}
          <div className="bg-gradient-to-b from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-colors group">
             <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h4 className="text-xl font-bold text-white mb-3">ACID Architecture</h4>
            <p className="text-slate-400 leading-relaxed">
              Postgres transactions guarantee absolute mathematical finality. Double-spending is structurally impossible.
            </p>
          </div>

          {/* Medium Feature Card (Spans 2 columns) */}
          <div className="md:col-span-2 bg-[#635BFF] rounded-3xl p-10 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden group">
            <div className="relative z-10 mb-6 sm:mb-0 text-center sm:text-left">
              <h4 className="text-3xl font-bold text-white mb-2 tracking-tight">Ready to move money?</h4>
              <p className="text-indigo-200 max-w-md text-lg">Deploy your wallet in seconds and join the modern economy.</p>
            </div>
            <Link href="/register" className="relative z-10 w-full sm:w-auto px-8 py-4 bg-white text-[#635BFF] font-bold rounded-xl shadow-2xl hover:scale-105 transition-transform text-center">
              Start Building Free
            </Link>
            
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white opacity-20 rounded-full blur-[80px] pointer-events-none group-hover:opacity-30 transition-opacity duration-500" />
          </div>

        </div>
      </section>
    </div>
  );
}