import Link from 'next/link';

import { AddNewMeetingButton, ParticipateMeetingForm, Header } from './component';

export default function Page() {
	return (
		<div className='flex size-full flex-col'>
			<Header />
			<div className='relative flex flex-1 items-center justify-center'>
				<div className='max-w-[655px] shrink px-[3em] py-[1em]'>
					<div className='pb-2 font-googleSans text-4.5xl font-normal leading-[3.25rem]'>
						모든 사용자를 위한 영상 통화 및 화상 회의
					</div>
					<div className='max-w-[480px] pb-8 font-googleSans text-1.5xl font-normal leading-7 text-gray-600'>
						Project Meet로 어디서나 연결하고 공동작업하고 기념일을 축하할 수 있습니다.
					</div>
					<div className='flex flex-wrap items-center gap-6'>
						<AddNewMeetingButton />
						<ParticipateMeetingForm />
					</div>
					<div className='mt-8 w-full border-t border-solid border-[#747775] pt-4 text-xs'>
						Project Meet에 관해{' '}
						<Link
							href='https://github.com/armd482/meetproejct'
							className='border-solid border-[#0B57D5] text-[#0B57D5] hover:border-b'
						>
							자세히 알아보세요.
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
