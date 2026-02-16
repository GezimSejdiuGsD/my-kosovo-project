"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Redirect to login after signing out
  };

  const links = [
    { name: 'Terminet', href: '/dashboard', icon: '📅' },
    { name: 'Cilësimet', href: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <nav className="flex items-center justify-between mb-8 bg-white p-2 rounded-xl shadow-sm border w-full">
      <div className="flex space-x-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {link.icon} {link.name}
            </Link>
          );
        })}
      </div>

      <button 
        onClick={handleSignOut}
        className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
      >
        Dalja (Sign Out)
      </button>
    </nav>
  );
}