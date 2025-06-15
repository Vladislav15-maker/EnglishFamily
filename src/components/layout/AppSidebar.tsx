'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, Users, BookOpen, CheckSquare, Award, BarChart3 } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('teacher' | 'student')[];
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Главная', icon: Home, roles: ['teacher', 'student'] },
  { href: '/dashboard/units', label: 'Юниты', icon: BookOpen, roles: ['student'] },
  { href: '/dashboard/student/offline-tests', label: 'Оффлайн Тесты', icon: Award, roles: ['student'] },
  { href: '/dashboard/teacher/students', label: 'Ученики', icon: Users, roles: ['teacher'] },
  { href: '/dashboard/teacher/offline-tests', label: 'Оффлайн Тесты', icon: CheckSquare, roles: ['teacher'] },
  { href: '/dashboard/teacher/progress-overview', label: 'Общий Прогресс', icon: BarChart3, roles: ['teacher'] },
];

export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null; // Should not happen if DashboardLayout protects routes

  // This component is now only for desktop view, mobile is handled in AppHeader
  // The filtering logic for navItems is now also in AppHeader for the mobile sheet.
  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));


  return (
    <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r md:sticky md:block bg-card text-card-foreground">
      <ScrollArea className="h-full py-6 pr-6 lg:py-8">
        <nav className="space-y-2 px-4">
          {filteredNavItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'secondary' : 'ghost'}
              className="w-full justify-start text-base"
            >
              <Link href={item.href}>
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
