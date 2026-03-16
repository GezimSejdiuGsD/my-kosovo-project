"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GlobalNavbar from '@/components/GlobalNavbar';
import { Plus, Trash2, MapPin } from 'lucide-react';

interface Service {
  id?: string;
  name: string;
  price: string;
}

// Configuration for locations
const locations = {
 "Kosovë": [
    "Prishtinë", "Prizren", "Pejë", "Gjilan", "Gjakovë", "Mitrovicë", "Ferizaj", 
    "Vushtrri", "Podujevë", "Rahovec", "Fushë Kosovë", "Suharekë", "Kaçanik", 
    "Shtime", "Lipjan", "Obiliq", "Gllogoc (Drenas)", "Istog", "Klinë", "Skënderaj", 
    "Dragash", "Leposaviq", "Zveçan", "Zubin Potok", 
    "Junik", "Hani i Elezit", "Graçanicë", "Ranillug", "Partesh", "Kllokot", 
    "Malishevë", "Novobërdë", "Shtërpcë", "Viti", "Deçan", "Kamenicë"
  ],
  "Shqipëri": [
    "Tiranë", "Durrës", "Vlorë", "Shkodër", "Fier", "Korçë", "Elbasan", "Berat", 
    "Lushnjë", "Kavajë", "Pogradec", "Laç", "Gjirokastër", "Patos", "Krujë", 
    "Kuçovë", "Kukës", "Lezhë", "Sarandë", "Peshkopi", "Burrel", "Cërrik", 
    "Çorovodë", "Shijak", "Librazhd", "Tepelenë", "Gramsh", "Poliçan", "Bulqizë", 
    "Përmet", "Fushë-Arrëz", "Bajram Curri", "Rrëshen", "Koplik", "Peqin", 
    "Bilisht", "Krumë", "Libohovë", "Konispol", "Vorë", "Kamëz", "Himarë"
  ],
  "Maqedoni e Veriut": [
    "Shkup", "Tetovë", "Gostivar", "Kumanovë", "Strugë", "Ohër", "Prilep", 
    "Manastir (Bitola)", "Veles", "Shtip", "Strumicë", "Kavadar", "Kërçovë", 
    "Kriva Pallankë", "Radovish", "Gjevgjeli", "Dibër", "Sveti Nikollë", 
    "Probishtip", "Vinicë", "Dellçevë", "Resnjë", "Berovë", "Kratovë", 
    "Bogdancë", "Krushevë", "Makedonska Kamenica", "Vallandovë", "Demir Kapi", "Demir Hisar"
  ]
};

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    business_name: '',
    phone_number: '',
    slug: '',
    country: '', // Added
    city: '',    // Added
  });
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({ name: '', price: '' });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('business_name, phone_number, slug, country, city')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile({
            business_name: profileData.business_name || '',
            phone_number: profileData.phone_number || '',
            slug: profileData.slug || '',
            country: profileData.country || '',
            city: profileData.city || '',
          });
        }

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('profile_id', user.id);
        
        if (servicesData) setServices(servicesData);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user?.id);
    
    if (error) alert("Gabim: " + error.message);
    else alert("Profili u përditësua me sukses!");
    setSaving(false);
  };

  const addService = async () => {
    if (!newService.name || !newService.price) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('services')
      .insert([{ name: newService.name, price: newService.price, profile_id: user?.id }])
      .select().single();

    if (!error && data) {
      setServices([...services, data]);
      setNewService({ name: '', price: '' });
    }
  };

  const handleRemoveService = async (id: string) => {
    if (deletingId === id) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (!error) {
        setServices(services.filter(s => s.id !== id));
        setDeletingId(null);
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white italic font-black text-blue-600 tracking-widest animate-pulse">
      DUKE NGARKUAR...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <GlobalNavbar />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-tight">Cilësimet</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Përditëso të dhënat dhe shërbimet</p>
        </header>

        {/* PROFILE & LOCATION SECTION */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6 ml-2 text-blue-600">
            <MapPin size={16} strokeWidth={3} />
            <h2 className="text-xs font-black uppercase tracking-widest">Lokacioni & Profili</h2>
          </div>
          
          <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
            <div className="space-y-6">
              {/* Slug */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Linku Publik</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">rezervo.shop/</span>
                  <input 
                    type="text" 
                    value={profile.slug}
                    onChange={(e) => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className="w-full p-5 pl-[6.5rem] rounded-2xl bg-gray-50 border-none font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Business Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Emri i Biznesit</label>
                  <input 
                    type="text" 
                    value={profile.business_name}
                    onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-gray-50 border-none font-bold outline-none focus:ring-2 ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Telefoni</label>
                  <input 
                    type="text" 
                    value={profile.phone_number}
                    onChange={(e) => setProfile({...profile, phone_number: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-gray-50 border-none font-bold outline-none focus:ring-2 ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Country & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Shteti</label>
                  <select 
                    value={profile.country}
                    onChange={(e) => setProfile({...profile, country: e.target.value, city: ''})}
                    className="w-full p-5 rounded-2xl bg-gray-50 border-none font-bold outline-none focus:ring-2 ring-blue-500/20 appearance-none"
                  >
                    <option value="">Zgjidh Shtetin</option>
                    <option value="Kosovë">Kosovë</option>
                    <option value="Shqipëri">Shqipëri</option>
                    <option value="Maqedoni e Veriut">Maqedoni e Veriut</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Qyteti</label>
                  <select 
                    value={profile.city}
                    disabled={!profile.country}
                    onChange={(e) => setProfile({...profile, city: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-gray-50 border-none font-bold outline-none focus:ring-2 ring-blue-500/20 appearance-none disabled:opacity-50"
                  >
                    <option value="">Zgjidh Qytetin</option>
                    {profile.country && locations[profile.country as keyof typeof locations].map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-5 bg-gray-900 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-lg disabled:opacity-50">
              {saving ? 'Duke u ruajtur...' : 'Përditëso Profilin'}
            </button>
          </form>
        </section>

        {/* SERVICES SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-6 ml-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Shërbimet</h2>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
            <div className="space-y-4 mb-10">
              {services.length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                   <p className="text-gray-400 font-bold text-sm uppercase">Nuk ka shërbime</p>
                </div>
              )}
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                  <div>
                    <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{service.name}</p>
                    <p className="text-blue-600 font-black text-sm mt-1">{service.price}€</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveService(service.id!)}
                    className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      deletingId === service.id ? "bg-red-500 text-white animate-pulse" : "text-gray-300 hover:text-red-500"
                    }`}
                  >
                    {deletingId === service.id ? "Konfirmo?" : <Trash2 size={18} />}
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2rem]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Shërbimi" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} className="p-5 rounded-2xl bg-white border-none font-bold outline-none focus:ring-2 ring-blue-500/20" />
                <input type="number" placeholder="Çmimi" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} className="p-5 rounded-2xl bg-white border-none font-bold outline-none focus:ring-2 ring-blue-500/20" />
              </div>
              <button onClick={addService} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 flex items-center justify-center gap-3">
                <Plus size={18} strokeWidth={3} /> Shto Shërbim
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}