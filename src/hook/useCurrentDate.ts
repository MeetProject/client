'use client';

import { useState, useEffect, useRef } from 'react';

const useCurrentDate = () => {
  const [time, setTime] = useState<Date | null>(null);
  const timerReference = useRef<NodeJS.Timeout | null>(null);
  const intervalReference = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currenTime = new Date();
    setTime(currenTime);

    const updateTime = () => {
      setTime(new Date());
    };

    timerReference.current = setTimeout(
      () => {
        updateTime();
        intervalReference.current = setInterval(updateTime, 60000);
      },
      60000 - (currenTime.getTime() % 60000),
    );

    return () => {
      if (timerReference.current) {
        clearTimeout(timerReference.current);
      }

      if (intervalReference.current) {
        clearInterval(intervalReference.current);
      }
    };
  }, []);

  return time;
};

export default useCurrentDate;
