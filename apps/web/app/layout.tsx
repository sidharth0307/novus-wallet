import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar"; 
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Novus | The modern ledger.",
  description: "Secure peer-to-peer payments and programmable money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F6F9FC] min-h-screen flex flex-col`}>
        
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>

        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0A2540', 
              color: '#fff',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              fontWeight: '500',
              fontSize: '14px',
              padding: '12px 20px',
            },
            success: {
              iconTheme: {
                primary: '#10B981', 
                secondary: '#0A2540',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444', 
                secondary: '#0A2540',
              },
            },
          }}
        />
      </body>
    </html>
  );
}