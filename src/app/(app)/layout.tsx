
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
import EmployeeDashboard from '@/components/employee-dashboard';

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
                 <DropdownMenuItem asChild>
                    <Link href="/leaves" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Cuti & Izin</span>
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


export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user && user.role === 'employee' && !user.isProfileComplete && pathname !== '/profile') {
        router.replace('/profile');
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

  // If user is employee but profile is not complete, show only the completion page.
  // This check is primarily for users who register themselves.
  if (user.role === 'employee' && !user.isProfileComplete) {
    // We render the children, which should be the Profile page in this specific redirect case.
    return <main>{children}</main>;
  }


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col bg-muted/40 pt-16">
        <div className="flex-1 space-y-4 p-4 md:space-y-8 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}

    