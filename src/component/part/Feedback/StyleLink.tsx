import Link from 'next/link';
import { PropsWithChildren } from 'react';

export default function StyleLink({ children }: PropsWithChildren) {
  return (
    <Link href='https://github.com/armd482/meetproejct' className='text-[#0B57D0] underline'>
      {children}
    </Link>
  );
}
