
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
  X,
  Building2,
  Settings,
  User as UserIcon,
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
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems =
    user?.role === 'admin'
      ? [
          { href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard },
          { href: '/attendance', label: 'Absensi', icon: ClipboardList },
          { href: '/employees', label: 'Karyawan', icon: Users },
          { href: '/departments', label: 'Departemen', icon: Building2 },
          { href: '/leaves', label: 'Cuti & Izin', icon: FileText },
          { href: '/settings', label: 'Pengaturan', icon: Settings },
        ]
      : [{ href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard }];

  const desktopNav = (
     <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'transition-colors hover:text-foreground',
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                ? 'text-foreground font-semibold'
                : ''
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
  )

  const mobileNav = (
     <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Logo />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                    "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                    pathname === item.href ? "text-foreground" : ""
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className='flex items-center gap-6'>
            <Logo />
            {desktopNav}
        </div>
      
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
            {mobileNav}
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
      } else if (user && user.role === 'employee' && !user.isProfileComplete && pathname !== '/employees/new') {
        // Redirect employees with incomplete profiles to the profile completion page.
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

  // A non-admin user with an incomplete profile will see the profile completion page.
  // This layout ensures they don't see the header.
  if (user.role === 'employee' && !user.isProfileComplete) {
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
