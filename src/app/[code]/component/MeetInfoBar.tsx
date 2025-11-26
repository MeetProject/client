'use client';

import { usePathname } from 'next/navigation';

import { useCurrentDate } from '@/hook';
import { formatTime } from '@/lib/date';

export default function MeetInfoBar() {
  const code = usePathname().slice(1);
  const date = useCurrentDate();

  if (!date) {
    return <div />;
  }

  return (
    <div className='flex flex-1 items-center gap-3 truncate sm-md:hidden'>
      <p>{formatTime(date)}</p>
      <div className='h-4 border-r border-solid border-white' />
      <p className='truncate'>{code}</p>
    </div>
  );
}
