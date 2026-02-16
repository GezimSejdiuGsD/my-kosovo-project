"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import React from 'react';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface BookingFormProps {
  businessId: string;
  services: Service[];
  startTime: string; 
  endTime: string; 
  slotDuration: number; 
  closedDays: number[]; 
}

export default function BookingForm({ 
  businessId, 
  services, 
  startTime, 
  endTime, 
  slotDuration,
  closedDays = [] 
}: BookingFormProps) {
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [dayException, setDayException] = useState<{is_closed: boolean, start: string, end: string} | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    serviceId: services[0]?.id || '',
  });

  // Helper to get business phone number if you have it, or use a default
  // For now, we redirect the client to their own booking confirmation 
  // or a specific business number if you provide one.

  const isDayOfWeekClosed = useMemo(() => {
    if (!selectedDate) return false;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNumber = date.getDay();
    return closedDays.map(Number).includes(dayNumber);
  }, [selectedDate, closedDays]);

  useEffect(() => {
    async function checkAvailability() {
      if (!selectedDate || !businessId) return;

      const { data: exceptionData } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('profile_id', businessId)
        .eq('date', selectedDate)
        .maybeSingle();

      if (exceptionData) {
        setDayException({
          is_closed: exceptionData.is_closed,
          start: exceptionData.start_time?.substring(0, 5) || startTime,
          end: exceptionData.end_time?.substring(0, 5) || endTime
        });
      } else {
        setDayException(null);
      }

      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .gte('appointment_time', `${selectedDate}T00:00:00`)
        .lte('appointment_time', `${selectedDate}T23:59:59`);

      if (appointments) {
        const taken = appointments.map(app => {
          const timePart = app.appointment_time.includes('T') 
            ? app.appointment_time.split('T')[1] 
            : app.appointment_time.split(' ')[1];
          return timePart.substring(0, 5);
        });
        setBookedSlots(taken);
      }
    }
    checkAvailability();
  }, [selectedDate, businessId, startTime, endTime]);

  const timeSlots = useMemo(() => {
    const specificDateIsClosed = dayException?.is_closed;
    const isRegularClosedDay = isDayOfWeekClosed && !dayException;
    if (specificDateIsClosed || isRegularClosedDay) return []; 

    const slots = [];
    const finalStart = dayException?.start || startTime;
    const finalEnd = dayException?.end || endTime;
    const start = new Date(`2026-01-01T${finalStart}:00`);
    const end = new Date(`2026-01-01T${finalEnd}:00`);
    let current = new Date(start);

    while (current < end) {
      slots.push(current.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', hour12: false }));
      current.setMinutes(current.getMinutes() + Number(slotDuration));
    }
    return slots;
  }, [startTime, endTime, slotDuration, dayException, isDayOfWeekClosed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return alert("Ju lutem zgjidhni një orar.");

    setLoading(true);
    const appointmentDateTime = `${selectedDate}T${selectedSlot}:00`;
    const selectedService = services.find(s => s.id === formData.serviceId);

    const { error } = await supabase
      .from('appointments')
      .insert([{
        service_id: formData.serviceId,
        client_name: formData.name,
        client_phone: formData.phone,
        appointment_time: appointmentDateTime,
      }]);

    if (error) {
      if (error.code === '23505') alert("Ky orar sapo u rezervua.");
      else alert("Gabim: " + error.message);
      setLoading(false);
    } else {
      // 1. Prepare message
      const message = `Përshëndetje! Unë jam ${formData.name}. Sapo bëra një rezervim:%0A%0A🗓 Data: ${selectedDate}%0A⏰ Ora: ${selectedSlot}%0A💇 Shërbimi: ${selectedService?.name}`;
      const whatsappUrl = `https://wa.me/?text=${message}`;
      
      // 2. Set submitted first (so they see the success screen if they come back)
      setSubmitted(true);
      setLoading(false);

      // 3. Attempt to open WhatsApp
      window.open(whatsappUrl, '_blank');
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-10 bg-green-50 rounded-3xl border border-green-200">
        <h3 className="text-2xl font-bold text-green-800 mb-2">Rezervimi u Ruajt! ✅</h3>
        <p className="text-green-700 text-sm mb-6">
          Termini juaj është regjistruar në sistemin tonë.
        </p>
        
        {/* Fallback button if the popup was blocked */}
        <a 
          href={`https://wa.me/?text=Konfirmim për rezervimin tim në datë ${selectedDate}`}
          target="_blank"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-green-700 transition mb-4"
        >
          Dërgo njoftimin në WhatsApp
        </a>

        <button onClick={() => window.location.reload()} className="block mx-auto mt-4 text-gray-500 text-xs underline">
          Kthehu prapa
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-2xl space-y-6 border border-gray-100">
      {/* ... (Rest of your form JSX remains exactly the same as you provided) ... */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Shërbimi</label>
        <select 
          className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-blue-500 outline-none transition appearance-none"
          value={formData.serviceId}
          onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
        >
          {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.price}€</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Zgjidhni Datën</label>
        <input 
          type="date" 
          required
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-blue-500 outline-none"
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedSlot(''); 
          }}
        />
      </div>

      {selectedDate && (
        <div className="mt-4">
          {(dayException?.is_closed || (isDayOfWeekClosed && !dayException)) ? (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
              <h3 className="text-red-800 font-bold text-lg">Më vjen keq!</h3>
              <p className="text-red-600 text-sm mt-1">Biznesi është i mbyllur në këtë datë.</p>
            </div>
          ) : (
            <>
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">Orari i Lirë</label>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(slot => {
                    const isTaken = bookedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isTaken}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 text-sm font-bold rounded-xl border transition-all ${
                          isTaken 
                            ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed line-through'
                            : selectedSlot === slot 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:text-blue-600'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 italic p-4 text-sm">Nuk u gjetën orare të lira.</p>
              )}
            </>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Emri Juaj</label>
            <input 
              type="text" 
              required
              placeholder="Filan Fisteku"
              className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nr. Telefonit</label>
            <input 
              type="tel" 
              required
              placeholder="044 123 456"
              className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:border-blue-500 outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-black text-white p-5 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? 'Duke rezervuar...' : 'Rezervo Tani'}
          </button>
        </div>
      )}
    </form>
  );
}