'use client';

import { useCurrentDate } from '@/hook';
import { formatTime, formatDate } from '@/lib/formatDate';

export default function CurrentDate() {
  const time = useCurrentDate();
  if (!time) {
    return <div />;
  }
  return (
    <div className='max-[472px]:hidden flex items-center gap-2 p-3 text-lg font-medium text-gray-500'>
      <p>{formatTime(time)}</p>
      <span>•</span>
      <p>{formatDate(time)}</p>
    </div>
  );
}
