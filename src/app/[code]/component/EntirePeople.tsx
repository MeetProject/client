'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';

import { getParticipant } from '@/app/api/mongoAPI';
import { ParticipantDataType } from '@/type/participantType';

const MAX_NUM = 4;

export default function EntirePeople() {
  const [data, setData] = useState<ParticipantDataType[]>([]);
  const sessionId = usePathname().slice(1);

  useLayoutEffect(() => {
    const getData = async () => {
      if (!sessionId) {
        return;
      }
      const userData = await getParticipant(sessionId);
      setData(userData);
    };
    getData();
  }, [sessionId]);
  return (
    <div className='flex flex-col items-center justify-center pt-2'>
      <div
        className='relative flex items-center'
        style={{ width: data.length ? `${24 + 12 * (Math.min(data.length, 4) - 1)}px` : '0px' }}
      >
        {data.slice(0, MAX_NUM).map((user, index) => (
          <div key={user._id} className='relative' style={{ left: index === 0 ? '0px' : `${-12 * index}px` }}>
            <div
              className='flex size-6 items-center justify-center truncate rounded-full text-sm font-bold text-white'
              style={{ backgroundColor: user.color }}
            >
              {user.userName.slice(0, 3)}
            </div>
          </div>
        ))}
      </div>
      {data.length > 0 && <p className='mt-1'>{`총 ${data.length}명`}</p>}
    </div>
  );
}
