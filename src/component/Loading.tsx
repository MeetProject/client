import Image from 'next/image';

import * as image from '@/asset/image';

interface LoadingProperties {
	isPending: boolean;
}

export default function Loading({ isPending }: LoadingProperties) {
	if (!isPending) {
		return null;
	}
	return (
		<div
			className='fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center'
			style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
		>
			<Image alt='loading' className='animate-spin' height={24} src={image.loading} width={24} />
		</div>
	);
}
