'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, initFromStorage } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initFromStorage();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, mounted]);

  // Connect WebSocket for the current user
  useWebSocket(user?.id);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
