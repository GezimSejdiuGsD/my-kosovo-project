"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]); // To populate the dropdown
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  
  const [filterMode, setFilterMode] = useState<'all' | 'custom'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  const router = useRouter();

  const monthNames = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  // --- FILTER LOGIC ---
  const filteredAppointments = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_time);
      
      // 1. Search Match
      const matchesSearch = apt.client_name.toLowerCase().includes(searchLower) || 
                            apt.client_phone.includes(searchTerm);

      // 2. Service Match
      const matchesService = selectedServiceId === 'all' || apt.service_id === selectedServiceId;

      // 3. Date Match
      let matchesDate = true;
      if (filterMode === 'custom') {
        const yearMatches = aptDate.getFullYear() === selectedYear;
        const monthMatches = selectedMonths.length === 0 || selectedMonths.includes(aptDate.getMonth());
        matchesDate = yearMatches && monthMatches;
      }

      return matchesSearch && matchesService && matchesDate;
    });
  }, [appointments, searchTerm, selectedServiceId, filterMode, selectedYear, selectedMonths]);

  const totalEarnings = useMemo(() => {
    return filteredAppointments.reduce((sum, apt) => sum + (apt.services?.price || 0), 0);
  }, [filteredAppointments]);

  // --- PDF GENERATION ---
  const generatePDF = () => {
    const doc = new jsPDF();
    const activeServiceName = services.find(s => s.id === selectedServiceId)?.name || 'Të Gjitha';
    
    const filterText = filterMode === 'all' 
      ? `Filtri: Të Gjitha` 
      : `Viti: ${selectedYear} | Muajt: ${selectedMonths.length > 0 ? selectedMonths.map(m => monthNames[m]).join(', ') : 'Të Gjithë'}`;

    doc.setFontSize(18);
    doc.text('Raporti i Rezervimeve dhe Financave', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${filterText} | Shërbimi: ${activeServiceName} | Data: ${new Date().toLocaleDateString('sq-AL')}`, 14, 28);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0); 
    doc.text(`Fitimi Total: ${totalEarnings}€`, 14, 36);
    doc.setTextColor(0); 

    autoTable(doc, {
      startY: 42,
      head: [['Klienti', 'Shërbimi', 'Çmimi', 'Data/Ora', 'Telefoni']],
      body: filteredAppointments.map(a => [
        a.client_name, 
        a.services?.name, 
        `${a.services?.price}€`,
        a.appointment_time.replace('T', ' ').substring(0, 16), 
        a.client_phone
      ]),
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Raporti_${new Date().getTime()}.pdf`);
  };

  const triggerCancelModal = (appointment: any) => {
    setAppointmentToCancel(appointment);
    setIsModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (!appointmentToCancel) return;
    const { error } = await supabase.from('appointments').delete().eq('id', appointmentToCancel.id);
    if (!error) {
      setAppointments(appointments.filter(apt => apt.id !== appointmentToCancel.id));
      setIsModalOpen(false);
    }
  };

useEffect(() => {
  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: aptData, error: aptError } = await supabase
      .from('appointments')
      .select('*, services ( name, price )')
      .eq('business_id', user.id) 
      .order('appointment_time', { ascending: true });

    if (aptError) console.error(aptError);
    else setAppointments(aptData || []);

    // 2. Fetch ONLY services belonging to this user
    const { data: srvData } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', user.id) // <--- FILTER SERVICES TOO
      .order('name');
      
    setServices(srvData || []);
    setLoading(false);
  }

  fetchData();
}, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <DashboardNav />

        <header className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Paneli i Menaxhimit</h1>
              <p className="text-gray-500 text-sm">Menaxho rezervimet dhe financat.</p>
            </div>
            
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold border border-green-200 shadow-sm">
                {totalEarnings}€
              </span>
              <button onClick={generatePDF} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-md">
                Gjenero PDF
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                <button 
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Të Gjitha
                </button>
                <button 
                  onClick={() => setFilterMode('custom')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filterMode === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Specifike
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Service Dropdown */}
                <select 
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="all">Të gjitha shërbimet</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {/* Search Bar */}
                <div className="relative flex-1 md:w-64">
                  <input 
                    type="text"
                    placeholder="Kërko klientin..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
            </div>

            {filterMode === 'custom' && (
              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="p-2 rounded-xl border border-gray-200 text-sm font-bold bg-gray-50 outline-none h-fit"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                
                <div className="flex flex-wrap gap-1.5">
                  {monthNames.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => setSelectedMonths(prev => prev.includes(i) ? prev.filter(m => m !== i) : [...prev, i])}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${selectedMonths.includes(i) ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}
                    >
                      {name.substring(0, 3)}
                    </button>
                  ))}
                  {selectedMonths.length > 0 && <button onClick={() => setSelectedMonths([])} className="text-[10px] text-red-500 font-bold px-2 underline">Pastro</button>}
                </div>
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <p className="text-center py-10 text-gray-500 animate-pulse">Duke u ngarkuar...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-gray-400 text-xs uppercase">Klienti</th>
                    <th className="p-4 font-bold text-gray-400 text-xs uppercase">Shërbimi</th>
                    <th className="p-4 font-bold text-gray-400 text-xs uppercase">Data / Ora</th>
                    <th className="p-4 font-bold text-gray-400 text-xs uppercase text-right">Veprime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.map((apt) => {
                    const aptDate = new Date(apt.appointment_time);
                    return (
                      <tr key={apt.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{apt.client_name}</p>
                          <a href={`tel:${apt.client_phone}`} className="text-xs text-blue-500">{apt.client_phone}</a>
                        </td>
                        <td className="p-4 text-gray-600 text-sm">
                          <span className="block font-medium">{apt.services?.name}</span>
                          <span className="text-green-600 font-bold text-xs">{apt.services?.price}€</span>
                        </td>
                        <td className="p-4 text-gray-600">
                          <div className="text-sm">
                            <span className="font-bold text-gray-800">{aptDate.toLocaleTimeString('sq-AL', {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="block text-[10px] text-gray-400 uppercase">{aptDate.toLocaleDateString('sq-AL')}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => triggerCancelModal(apt)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredAppointments.length === 0 && <div className="p-12 text-center text-gray-400 italic text-sm">Nuk u gjet asnjë rezervim.</div>}
          </div>
        )}
      </div>

      {/* Cancellation Modal stays same as before... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Anulo Termin</h3>
              <p className="text-gray-500 text-sm mt-2">Klienti <strong>{appointmentToCancel?.client_name}</strong> do të hiqet.</p>
            </div>
            <textarea className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm mb-6" rows={3} placeholder="Arsyeja..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Mbyll</button>
              <button onClick={confirmCancellation} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg">Anuloje</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}