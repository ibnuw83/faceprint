'use client';

import { getMotivationalQuote } from '@/ai/flows/motivation-generator';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MotivationalQuote() {
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const result = await getMotivationalQuote();
        setQuote(result.quote);
      } catch (error) {
        console.error('Failed to fetch motivational quote:', error);
        // Set a default quote on error
        setQuote('Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();

    // Fetch a new quote every hour
    const intervalId = setInterval(fetchQuote, 3600000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-primary to-accent p-3 rounded-lg shadow-md overflow-hidden border border-primary/20">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
            <Lightbulb className="text-white h-5 w-5" />
        </div>
        <div className="flex-1 overflow-hidden">
            {loading && !quote ? (
                 <div className="flex items-center gap-2 text-primary-foreground/80">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>Memuat kutipan motivasi...</span>
                 </div>
            ) : (
                 <div className="relative flex overflow-x-hidden">
                    <p className="animate-marquee whitespace-nowrap text-sm font-medium text-white">
                       {quote}
                    </p>
                    <p className="absolute top-0 animate-marquee2 whitespace-nowrap text-sm font-medium text-white">
                       {quote}
                    </p>
                </div>
            )}
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
