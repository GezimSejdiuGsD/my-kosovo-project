import { supabase } from '@/lib/supabase';
import BookingForm from '@/components/BookingForm';
import { notFound } from 'next/navigation';

// 1. Note the 'Promise' type in the arguments
export default async function BusinessPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  
  // 2. UNWRAP THE PARAMS (This fixes your error)
  const { slug } = await params;

  // 3. Query the database using the unwrapped slug
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single();

  // If there's an error or no profile, show 404
  if (profileError || !profile) {
    console.error("Database error or profile not found:", profileError);
    return notFound();
  }

  // 4. Fetch the services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('profile_id', profile.id);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          {profile.business_name}
        </h1>
        <p className="text-lg text-gray-600">
          Rezervoni terminin tuaj online në pak sekonda.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <BookingForm 
          key={`${profile.id}-${profile.slot_duration}`} // This forces a reset when duration changes
          businessId={profile.id} 
          services={services || []} 
          startTime={profile.start_time}
          endTime={profile.end_time}
          slotDuration={Number(profile.slot_duration)} // Ensure it's a number
          closedDays={profile.closed_days || []}
        />
      </div>
    </main>
  );
}