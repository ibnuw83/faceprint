
'use client';

import { useState, useEffect } from 'react';

export function LiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}));
      setDate(now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }));
    };

    updateDateTime();
    const timerId = setInterval(updateDateTime, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-4 text-sm font-medium text-right">
        <div className='flex flex-col'>
            <p className="font-bold text-base text-primary">{time}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
        </div>
    </div>
  );
}
