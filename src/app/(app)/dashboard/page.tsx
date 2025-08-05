'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Clock, UserCheck, UserX } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'in' | 'out' | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
      setDate(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    setStatus('in');
    toast({
      title: 'Clock In Successful',
      description: `Welcome, ${user?.name}! Your attendance has been logged at ${new Date().toLocaleTimeString()}.`,
    });
  };

  const handleClockOut = () => {
    setStatus('out');
    toast({
      title: 'Clock Out Successful',
      description: `Goodbye, ${user?.name}! Your departure has been logged at ${new Date().toLocaleTimeString()}.`,
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Camera className="text-primary" />
              Face Authentication
            </CardTitle>
            <CardDescription>Position your face within the frame to clock in or out.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed">
              <Image src="https://placehold.co/600x400" alt="Camera feed placeholder" layout="fill" objectFit="cover" data-ai-hint="camera feed" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <p className="text-white/90 font-semibold text-lg backdrop-blur-sm p-2 rounded-md">Camera View</p>
              </div>
            </div>
            <div className="flex gap-4 w-full">
              <Button onClick={handleClockIn} size="lg" className="flex-1" disabled={status === 'in'}>
                <UserCheck className="mr-2" /> Clock In
              </Button>
              <Button onClick={handleClockOut} size="lg" className="flex-1" variant="secondary" disabled={status !== 'in'}>
                <UserX className="mr-2" /> Clock Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock /> Current Time</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-primary">{time || '...'}</p>
              <p className="text-muted-foreground">{date || '...'}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-xl">
             <CardHeader>
                <CardTitle>Attendance Status</CardTitle>
             </CardHeader>
             <CardContent>
                {status === 'in' ? (
                    <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                        <UserCheck className="h-8 w-8"/>
                        <div>
                            <p className="font-bold text-lg">Clocked In</p>
                            <p className="text-sm text-muted-foreground">You are currently on the clock.</p>
                        </div>
                    </div>
                ) : status === 'out' ? (
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <UserX className="h-8 w-8"/>
                        <div>
                            <p className="font-bold text-lg">Clocked Out</p>
                            <p className="text-sm text-muted-foreground">You have completed your shift.</p>
                        </div>
                    </div>
                ) : (
                     <p className="text-muted-foreground">You have not clocked in today.</p>
                )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
