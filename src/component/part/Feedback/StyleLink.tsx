import Link from 'next/link';
import { PropsWithChildren } from 'react';

export default function StyleLink({ children }: PropsWithChildren) {
	return (
		<Link className='text-[#0B57D0] underline' href='https://github.com/armd482/meetproejct'>
			{children}
		</Link>
	);
}
