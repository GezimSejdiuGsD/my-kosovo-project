"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // Import Link for navigation

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setNeedsVerification(true);
      } else {
        alert(error.message);
      }
    } else {
      window.location.href = '/dashboard';
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error) {
      alert("Gabim: " + error.message);
    } else {
      alert("Email-i i verifikimit u dërgua përsëri! Kontrolloni spam-in.");
      setNeedsVerification(false);
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-2xl p-8 border border-gray-100">
        <h1 className="text-2xl font-black text-center mb-6 text-gray-900">Kyçu në Panel</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="input-field" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Fjalëkalimi" 
            className="input-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          
          <button 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            {loading ? "Duke u kyçur..." : "Identifikohu"}
          </button>
        </form>

        {/* --- REGISTER SECTION --- */}
        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter mb-3">Nuk keni llogari?</p>
          <Link 
            href="/register" 
            className="inline-block w-full py-3 border-2 border-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 hover:border-gray-200 transition"
          >
            Regjistrohu Tani
          </Link>
        </div>

        {/* RESEND SECTION */}
        {needsVerification && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center animate-in fade-in zoom-in duration-200">
            <p className="text-amber-700 text-xs font-bold mb-3">
              Email-i juaj nuk është verifikuar ende.
            </p>
            <button 
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="text-amber-800 text-xs font-black underline uppercase hover:text-amber-900"
            >
              {resendLoading ? "Duke u dërguar..." : "Dërgo email-in përsëri"}
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.9rem 1.25rem;
          border-radius: 1rem;
          border: 1px solid #f1f1f1;
          outline: none;
          font-size: 0.875rem;
          font-weight: 600;
          background-color: #fbfbfb;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: #2563eb;
          background-color: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.05);
        }
      `}</style>
    </div>
  );
}