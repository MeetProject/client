import Image from 'next/image';

import { permissionRequest } from '@/asset/image';

export default function InitialRequestModal() {
	return (
		<div className='rounded-[28px] bg-white px-8 pb-10 pt-[30px]'>
			<div className='flex w-full items-center justify-center'>
				<Image src={permissionRequest} alt='허용 클릭' width={230} height={230} />
			</div>
			<div className='px-10 pt-5 font-googleSans text-[#444746]'>
				<h1 className='mb-4 text-center text-2xl'>
					<span className='font-semibold'>허용</span> 클릭
				</h1>
				<p>회의 중에 언제든지 마이크 및 카메라를 끌 수 있습니다</p>
			</div>
		</div>
	);
}
