
'use client';

import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Megaphone, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
        const announcementRef = doc(db, 'settings', 'announcement');
        try {
            const docSnap = await getDoc(announcementRef);
            if (docSnap.exists()) {
                const text = docSnap.data()?.text;
                setAnnouncement(text || null);
            } else {
                setAnnouncement(null);
            }
        } catch (error) {
            console.error("Failed to fetch announcement:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchAnnouncement();
  }, []);

  if (loading) {
     return (
        <div className="w-full bg-gradient-to-r from-primary to-accent p-3 rounded-lg shadow-md overflow-hidden border border-primary/20">
            <div className="flex items-center gap-3 text-primary-foreground/80">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>Memuat pengumuman...</span>
            </div>
        </div>
    )
  }

  if (!announcement) {
    return null; // Don't render anything if there's no announcement
  }

  return (
    <div className="w-full bg-gradient-to-r from-primary to-accent p-3 rounded-lg shadow-md overflow-hidden border border-primary/20">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
            <Megaphone className="text-white h-5 w-5" />
        </div>
        <div className="flex-1 overflow-hidden">
             <div className="relative flex overflow-x-hidden">
                <p className="animate-marquee whitespace-nowrap text-sm font-medium text-white">
                   {announcement}
                </p>
                <p className="absolute top-0 animate-marquee2 whitespace-nowrap text-sm font-medium text-white">
                   {announcement}
                </p>
            </div>
        </div>
      </div>
       <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes marquee2 {
           0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
         .animate-marquee2 {
          animation: marquee2 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
