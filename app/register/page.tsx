"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const locationData: Record<string, string[]> = {
  "Kosovë": ["Prishtinë", "Prizren", "Pejë", "Gjilan", "Gjakovë", "Mitrovicë", "Ferizaj"],
  "Shqipëri": ["Tiranë", "Durrës", "Vlorë", "Shkodër", "Fier", "Korçë", "Elbasan"],
  "Maqedoni e Veriut": ["Shkup", "Tetovë", "Gostivar", "Kumanovë", "Strugë", "Ohër"]
};

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showTooltip, setShowTooltip] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    slug: '',
    whatsapp_number: '',
    country: 'Kosovë',
    city: '',
    email: '',
    password: '',
    confirmPassword: '',
    start_time: '10:00',
    end_time: '19:00',
    slot_duration: 30,
    closed_days: [0] 
  });

  // Password Validation Logic
  const checks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    symbol: /[^A-Za-z0-9]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.confirmPassword !== ''
  };

  const isPasswordValid = checks.length && checks.uppercase && checks.number && checks.symbol;
  const canSubmit = isPasswordValid && checks.match && slugStatus === 'available' && !loading;

  useEffect(() => {
    const checkSlug = async () => {
      if (formData.slug.length < 3) {
        setSlugStatus('idle');
        return;
      }
      setSlugStatus('checking');
      const { data } = await supabase
        .from('profiles')
        .select('slug')
        .eq('slug', formData.slug.toLowerCase())
        .single();
      
      setSlugStatus(data ? 'taken' : 'available');
    };

    const timeoutId = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.slug]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      alert(authError.message);
    } else if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          business_name: formData.business_name,
          slug: formData.slug.toLowerCase(),
          whatsapp_number: formData.whatsapp_number,
          start_time: formData.start_time,
          end_time: formData.end_time,
          slot_duration: formData.slot_duration,
          closed_days: formData.closed_days
        }
      ]);

      if (profileError) {
        alert("Gabim në profil: " + profileError.message);
      } else {
        alert("Rregjistrimi u krye! Kontrolloni email-in për verifikim.");
        router.push('/login');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-xl w-full rounded-[2rem] shadow-2xl p-8 border border-gray-100 my-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Krijo Llogarinë</h1>
          <p className="text-gray-500 mt-2 font-medium">Plotësoni të dhënat për biznesin tuaj</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Business Name */}
            <div className="md:col-span-2">
              <label className="label-style">Emri i Biznesit</label>
              <input type="text" placeholder="Emri i Biznesit" required className="input-field" 
                onChange={e => setFormData({...formData, business_name: e.target.value})} />
            </div>

            {/* Slug */}
            <div className="md:col-span-2 relative">
              <div className="flex items-center gap-1 ml-2 mb-1">
                <label className="label-style !mb-0">Linku Unik (Slug)</label>
                <div className="relative">
                   <button type="button" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} className="text-gray-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                   </button>
                   {showTooltip && (
                     <div className="absolute z-10 left-6 -top-2 w-48 bg-gray-800 text-white text-[10px] p-2 rounded-lg shadow-xl font-medium">
                       Ky link do të përdoret nga klientët tuaj për rezervime online.
                     </div>
                   )}
                </div>
              </div>
              <input type="text" placeholder="psh: barber-dali" required 
                className={`input-field lowercase ${slugStatus === 'taken' ? 'border-red-500' : ''}`} 
                onChange={e => setFormData({...formData, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})} 
              />
              <p className="text-[11px] font-bold text-gray-400 mt-1 ml-2">
                URL: <span className="text-blue-500 font-mono">rezervo.com/{formData.slug || '...'}</span>
              </p>
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="label-style">Numri i Telefonit (WhatsApp)</label>
              <input type="tel" placeholder="+383 49 123 456" required className="input-field" 
                onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} />
            </div>

            {/* Country/City */}
            <div>
              <label className="label-style">Shteti</label>
              <select className="input-field" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value, city: ''})}>
                {Object.keys(locationData).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-style">Qyteti</label>
              <select className="input-field" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                <option value="">Zgjidh...</option>
                {locationData[formData.country].map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            {/* Auth */}
            <div className="md:col-span-2">
              <label className="label-style">Email-i</label>
              <input type="email" placeholder="biznesi@email.com" required className="input-field" 
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            {/* Password Validation UI */}
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-style">Fjalëkalimi</label>
                  <input type="password" placeholder="••••••••" required className="input-field" 
                    onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div>
                  <label className="label-style">Konfirmo Fjalëkalimin</label>
                  <input type="password" placeholder="••••••••" required 
                    className={`input-field ${formData.confirmPassword && !checks.match ? 'border-red-500' : ''}`}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-2">
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.length ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.length ? '✓' : '○'} 8+ Karaktere
                </p>
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.uppercase ? '✓' : '○'} Shkronjë e madhe
                </p>
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.number ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.number ? '✓' : '○'} Një Numër
                </p>
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.symbol ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.symbol ? '✓' : '○'} Simbol (@#$%!)
                </p>
                <p className={`text-[10px] font-bold col-span-2 flex items-center gap-1 ${checks.match ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.match ? '✓' : '○'} Fjalëkalimet përputhen
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={!canSubmit}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition disabled:opacity-30 disabled:grayscale shadow-xl shadow-blue-100 mt-4"
          >
            {loading ? "Duke u procesuar..." : "Rregjistrohu"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs font-bold mt-8 uppercase tracking-tighter">
          Keni llogari? <Link href="/login" className="text-blue-600 hover:underline ml-1">Kyçu këtu</Link>
        </p>
      </div>

      <style jsx>{`
        .label-style {
          font-size: 0.7rem;
          font-weight: 800;
          color: #9ca3af;
          text-transform: uppercase;
          margin-left: 0.5rem;
          margin-bottom: 0.25rem;
          display: block;
        }
        .input-field {
          width: 100%;
          padding: 0.9rem 1.25rem;
          border-radius: 1rem;
          border: 1px solid #f1f1f1;
          outline: none;
          font-size: 0.875rem;
          font-weight: 600;
          background-color: #fbfbfb;
          transition: all 0.2s ease-in-out;
        }
        .input-field:focus {
          border-color: #2563eb;
          background-color: white;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </div>
  );
}