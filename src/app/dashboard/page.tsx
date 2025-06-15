'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'teacher') {
        router.replace('/dashboard/teacher/students');
      } else if (user.role === 'student') {
        router.replace('/dashboard/units');
      }
    } else if (!isLoading && !user) {
        router.replace('/');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-xl text-muted-foreground">Загрузка...</p>
    </div>
  );
}
