
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" width="1em" height="1em" {...props}>
    <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#34A853" d="M43.611 20.083H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FBBC05" d="M6.306 14.691L12.96 19.838C14.655 13.596 20.251 9.99 24 9.99c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#EA4335" d="M24 44c5.166 0 9.86-1.977 13.412-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appName, setAppName] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
        setLoadingSettings(true);
        const brandingRef = doc(db, 'settings', 'branding');
        const brandingSnap = await getDoc(brandingRef);
        const name = brandingSnap.exists() ? brandingSnap.data().appName : 'VisageID';
        setAppName(name || 'VisageID');
        document.title = `Login | ${name || 'VisageID'}`;
        setLoadingSettings(false);
    }
    fetchBranding();

    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Gagal Masuk',
        description: 'Silakan periksa kembali email dan kata sandi Anda.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Gagal Masuk dengan Google',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !isSubmitting) {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <Logo className="justify-center" showTitle={false} />
        {loadingSettings ? (
          <Skeleton className="h-9 w-1/2 mx-auto" />
        ) : (
          <CardTitle className="text-3xl font-bold">{appName}</CardTitle>
        )}
        <CardDescription>
          Masuk ke akun Anda untuk melanjutkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="karyawan@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full !mt-6" size="lg" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Masuk dengan Email
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Atau lanjutkan dengan
            </span>
          </div>
        </div>

        <Button onClick={handleGoogleLogin} variant="outline" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
          Google
        </Button>
      </CardContent>
       <CardFooter className="flex flex-col gap-4 text-center text-sm">
          <p>Belum punya akun? <Link href="/register" className="text-primary hover:underline">Daftar</Link></p>
          <Separator />
          <Link href="/" className="text-muted-foreground hover:text-primary hover:underline">Kembali ke Halaman Utama</Link>
      </CardFooter>
    </Card>
  );
}
