'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems, type NavItem } from './AppSidebar'; // Assuming export from AppSidebar
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredNavItems = user ? navItems.filter(item => item.roles.includes(user.role)) : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Открыть меню">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 pt-6 bg-card text-card-foreground">
                <div className="mb-6 px-4">
                   <SheetClose asChild>
                     <Link href="/dashboard" className="text-2xl font-bold font-headline text-primary">
                        EnglishCourse
                      </Link>
                   </SheetClose>
                </div>
                <nav className="space-y-2 px-4">
                  {filteredNavItems.map((item) => (
                     <SheetClose asChild key={item.href}>
                        <Button
                          asChild
                          variant={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'secondary' : 'ghost'}
                          className="w-full justify-start text-base"
                        >
                          <Link href={item.href}>
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                          </Link>
                        </Button>
                     </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Logo */}
          <Link href="/dashboard" className="hidden md:block text-2xl font-bold font-headline text-primary">
            EnglishCourse
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name  || 'User Avatar'} data-ai-hint="profile avatar"/>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.role === 'teacher' ? 'Учитель' : 'Ученик'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
