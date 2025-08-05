'use client';
import { useState } from 'react';
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
import { Camera, Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(email, password, name);
      toast({
        title: 'Registration Successful',
        description: 'You can now log in with your new account.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
          <UserPlus className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold">Create an Account</CardTitle>
        <CardDescription>
          Enter your details to get started with VisageID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full !mt-6" size="lg" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm">
          <p>Already have an account? <Link href="/login" className="text-primary hover:underline">Log In</Link></p>
      </CardFooter>
    </Card>
  );
}
