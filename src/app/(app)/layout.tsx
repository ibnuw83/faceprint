'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems =
    user.role === 'admin'
      ? [
          { href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard },
          { href: '/attendance', label: 'Absensi', icon: ClipboardList },
          { href: '/employees', label: 'Karyawan', icon: Users },
          { href: '/reports', label: 'Laporan', icon: FileText },
        ]
      : [{ href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard }];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex w-full items-center justify-between">
              <Logo />
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-3 rounded-lg border p-2 shadow-sm">
              <Avatar>
                <AvatarImage data-ai-hint="person avatar" src={`https://i.pravatar.cc/150?u=${user.email}`} />
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto shrink-0"
                onClick={handleLogout}
                aria-label="Keluar"
              >
                <LogOut />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
