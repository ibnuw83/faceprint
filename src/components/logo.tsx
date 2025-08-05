import { Camera } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/dashboard"
      className={cn('flex items-center gap-2 group', className)}
    >
      <div className="bg-primary text-primary-foreground p-2 rounded-lg transition-transform group-hover:scale-110">
        <Camera className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-bold text-foreground hidden sm:inline-block">
        VisageID
      </h1>
    </Link>
  );
}
