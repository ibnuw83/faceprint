
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
  Building2
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
import { cn } from '@/lib/utils';

function Sidebar() {
  const { user, logout } = useAuth();
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
          { href: '/reports', label: 'Laporan', icon: FileText },
        ]
      : [{ href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard }];

  const navLinks = (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'bg-muted text-primary' : ''
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X /> : <Menu />}
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Sidebar Content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-background transition-transform duration-300 md:flex md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-6">
            <Logo />
          </div>
          <div className="flex-1 overflow-auto py-2 px-4">{navLinks}</div>
          <div className="mt-auto p-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 px-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage
                        data-ai-hint="person avatar"
                        src={`https://i.pravatar.cc/150?u=${user?.email}`}
                        />
                        <AvatarFallback>
                        {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate max-w-[150px]">
                            {user?.email}
                        </p>
                    </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    Akun Saya
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
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
      } else if (user && user.role !== 'admin' && !user.isProfileComplete && pathname !== '/employees/new') {
        // Only redirect non-admins to complete their profile
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

  // Hide sidebar and force layout for profile completion page for employees only
  if (user.role === 'employee' && !user.isProfileComplete) {
    return <main>{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8 md:pl-72">
        {/* Add a spacer for the mobile header */}
        <div className="h-12 md:hidden" />
        {children}
      </main>
    </div>
  );
}

