'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Camera, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function NewEmployeePage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Employee Enrolled',
      description: 'The new employee has been successfully added to the system.',
    });
    router.push('/employees');
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="text-primary" />
            Enroll New Employee
          </CardTitle>
          <CardDescription>
            Enter the employee's details and capture their face for biometric authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="e.g., John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" placeholder="e.g., EMP12345" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="e.g., Engineering" required />
              </div>
            </div>
            <div className="space-y-4 flex flex-col">
              <Label>Face Enrollment</Label>
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed flex items-center justify-center">
                <Image src="https://placehold.co/400x400" alt="Face capture placeholder" layout="fill" objectFit="cover" data-ai-hint="person face" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <p className="text-white/90 font-semibold backdrop-blur-sm p-2 rounded-md">Face Capture Area</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1">
                  <Camera className="mr-2" /> Use Camera
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  <Upload className="mr-2" /> Upload Photo
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="lg" className="w-full !mt-4">
                Enroll Employee
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
