"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav'

// 1. Interface to handle Profile data and the new closed_days array
interface Profile {
  business_name: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
  closed_days: number[]; 
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Specific Date Exception States
  const [exceptionDate, setExceptionDate] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [specialStart, setSpecialStart] = useState('09:00');
  const [specialEnd, setSpecialEnd] = useState('17:00');
  const [savingException, setSavingException] = useState(false);
  const [exceptions, setExceptions] = useState<any[]>([]);

  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    start_time: '10:00',
    end_time: '19:00',
    slot_duration: 30,
    closed_days: [] 
  });

  const router = useRouter();

  const daysOfWeek = [
    { id: 1, name: 'Hënë' },
    { id: 2, name: 'Martë' },
    { id: 3, name: 'Mërkurë' },
    { id: 4, name: 'Enjte' },
    { id: 5, name: 'Premte' },
    { id: 6, name: 'Shtunë' },
    { id: 0, name: 'Diell' },
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch Profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profData) {
        setProfile({
          ...profData,
          closed_days: profData.closed_days || []
        });
      }

      // Fetch Exceptions
      fetchExceptions();
      setLoading(false);
    }
    fetchData();
  }, [router]);

  const fetchExceptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('profile_id', user?.id)
      .order('date', { ascending: true });
    setExceptions(data || []);
  };

  // Handler for General Settings (including Weekly Closed Days)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        business_name: profile.business_name,
        start_time: profile.start_time,
        end_time: profile.end_time,
        slot_duration: Number(profile.slot_duration),
        closed_days: profile.closed_days, // This sends the [0, 6] array
      })
      .eq('id', user.id);

    if (profileError) {
      console.error("Update Error:", profileError);
      alert("Gabim: " + profileError.message);
    } else {
      alert("Cilësimet u përditësuan!");
    }
    setUpdating(false);
  };

  // Handler for Specific Date Exceptions
  const saveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionDate) return alert("Ju lutem zgjidhni një datë.");
    
    setSavingException(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('availability_exceptions')
      .upsert({
        profile_id: user?.id,
        date: exceptionDate,
        is_closed: isClosed,
        start_time: isClosed ? null : specialStart,
        end_time: isClosed ? null : specialEnd
      });

    if (error) {
      alert("Gabim: " + error.message);
    } else {
      alert("Orari specifik u ruajt!");
      fetchExceptions();
    }
    setSavingException(false);
  };

  const deleteException = async (id: string) => {
    const { error } = await supabase
      .from('availability_exceptions')
      .delete()
      .eq('id', id);
    
    if (!error) fetchExceptions();
  };

  if (loading) return <p className="p-10 text-center">Duke u ngarkuar...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <DashboardNav />
        <h1 className="text-3xl font-bold text-gray-800">Cilësimet e Biznesit</h1>
        
        {/* FORM 1: GENERAL SETTINGS & WEEKLY RECURRING CLOSURES */}
        <form onSubmit={handleUpdate} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-700">Orari i rregullt</h2>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-600">Emri i Biznesit</label>
            <input 
              type="text" 
              value={profile.business_name}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setProfile({...profile, business_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-600">Hapet në</label>
              <input 
                type="time" 
                value={profile.start_time}
                className="w-full p-3 border rounded-xl bg-gray-50"
                onChange={(e) => setProfile({...profile, start_time: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-600">Mbyllet në</label>
              <input 
                type="time" 
                value={profile.end_time}
                className="w-full p-3 border rounded-xl bg-gray-50"
                onChange={(e) => setProfile({...profile, end_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-600">Kohëzgjatja (Minuta)</label>
            <select 
              value={profile.slot_duration}
              className="w-full p-3 border rounded-xl bg-gray-50"
              onChange={(e) => setProfile({...profile, slot_duration: parseInt(e.target.value)})}
            >
              <option value="15">15 minuta</option>
              <option value="30">30 minuta</option>
              <option value="45">45 minuta</option>
              <option value="60">60 minuta</option>
            </select>
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-bold mb-4 text-gray-600">Ditët e Mbyllura (Çdo javë)</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => {
                const isSelected = profile.closed_days?.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      // Convert ID to number to ensure DB compatibility
                      const dayId = Number(day.id); 
                      let newClosedDays = [...(profile.closed_days || [])];
                      
                      if (newClosedDays.includes(dayId)) {
                        newClosedDays = newClosedDays.filter(d => d !== dayId);
                      } else {
                        newClosedDays.push(dayId);
                      }
                      
                      // Update state locally
                      setProfile({ ...profile, closed_days: newClosedDays });
                    }}
                    className={`px-4 py-2 rounded-xl font-bold border transition ${
                      isSelected 
                      ? 'bg-red-500 text-white border-red-600 shadow-md' 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {day.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            disabled={updating}
            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
          >
            {updating ? 'Duke i ruajtur...' : 'Ruaj Ndryshimet'}
          </button>
        </form>

        <hr className="border-gray-200" />

        {/* SECTION 2: SPECIFIC DATE EXCEPTIONS (PUSHIME OSE ORAR NDRYSHE) */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Orari Specifik & Pushimet</h2>
            <p className="text-sm text-gray-500">Përdoreni këtë për ditë specifike kur jeni mbyllur ose keni orar tjetër.</p>
          </div>

          <form onSubmit={saveException} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Zgjidhni Datën</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setExceptionDate(e.target.value)}
                />
              </div>

              <div className="flex items-end pb-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={isClosed}
                    onChange={(e) => setIsClosed(e.target.checked)}
                  />
                  <span className="font-bold text-gray-700 group-hover:text-blue-600 transition">Mbyllur (Pushim)</span>
                </label>
              </div>
            </div>

            {!isClosed && (
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-600">Hapet në</label>
                  <input 
                    type="time" 
                    value={specialStart}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    onChange={(e) => setSpecialStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-600">Mbyllet në</label>
                  <input 
                    type="time" 
                    value={specialEnd}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    onChange={(e) => setSpecialEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button 
              disabled={savingException}
              className="w-full bg-gray-800 text-white p-4 rounded-xl font-bold hover:bg-black transition disabled:opacity-50 shadow-md"
            >
              {savingException ? 'Duke ruajtur...' : 'Shto Përjashtimin Specifik'}
            </button>
          </form>

          {/* LIST OF BLOCKED DATES / EXCEPTIONS */}
          {exceptions.length > 0 && (
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Përjashtimet e regjistruara:</h3>
              {exceptions.map((ex) => (
                <div key={ex.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <span className="font-bold text-gray-700">{new Date(ex.date).toLocaleDateString('sq-AL')}</span>
                    {ex.is_closed ? 
                      <span className="ml-2 text-red-600 text-xs font-black uppercase"> — MBYLLUR</span> : 
                      <span className="ml-2 text-blue-600 text-xs font-bold"> — ({ex.start_time.slice(0,5)} - {ex.end_time.slice(0,5)})</span>
                    }
                  </div>
                  <button 
                    onClick={() => deleteException(ex.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}