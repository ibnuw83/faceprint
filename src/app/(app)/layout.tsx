
'use client';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  Loader2,
  Menu,
  Building2,
  Settings,
  User as UserIcon,
  Home,
  Bell,
  Search,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from '@/lib/utils';
import { LiveClock } from '@/components/live-clock';

function Header() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
        <div className='flex items-center gap-6'>
            <Logo />
        </div>
      
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
            <LiveClock />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                     <AvatarImage
                        src={user?.faceprint || undefined}
                      />
                    <AvatarFallback>
                         {loading ? <Loader2 className="animate-spin h-4 w-4" /> : user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <p className="font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                        {user?.email}
                    </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                     <Link href="/profile" className="cursor-pointer">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>Profil Saya</span>
                        </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                        <Link href="/attendance" className="cursor-pointer">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Absensi Karyawan</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/employees" className="cursor-pointer">
                            <Users className="mr-2 h-4 w-4" />
                            <span>Manajemen Karyawan</span>
                        </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/departments" className="cursor-pointer">
                            <Building2 className="mr-2 h-4 w-4" />
                            <span>Departemen</span>
                        </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/leaves" className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Cuti & Izin</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Pengaturan</span>
                        </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
      </div>
    </header>
  );
}

function BottomNavBar() {
    const pathname = usePathname();
    const navItems = [
        { href: '/dashboard', label: 'Beranda', icon: Home },
        { href: '#', label: 'Cari', icon: Search },
        { href: '#', label: 'Notifikasi', icon: Bell },
        { href: '/profile', label: 'Akun', icon: UserIcon },
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t shadow-inner">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors gap-1">
                           <div className={cn(
                               "p-2 rounded-full transition-colors",
                               isActive ? "bg-primary/10" : ""
                           )}>
                             <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "")} />
                           </div>
                           <span className={cn(
                               "text-xs font-medium",
                               isActive ? "text-primary" : ""
                           )}>{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}


export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user && user.role === 'employee' && !user.isProfileComplete && pathname !== '/employees/new') {
        router.replace('/employees/new');
      }
    }
  }, [isAuthenticated, user, loading, router, pathname]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role === 'employee' && !user.isProfileComplete) {
    return <main>{children}</main>;
  }

  // Admin layout remains with sidebar-like functionality via header dropdown
  if (user.role === 'admin') {
      return (
         <div className="flex min-h-screen w-full flex-col">
          <Header />
          <main className="flex flex-1 flex-col bg-muted/40 pt-16">
            <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
              {children}
            </div>
          </main>
        </div>
      )
  }

  // New Employee layout with bottom navigation
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 bg-background pb-16 md:pb-0">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
