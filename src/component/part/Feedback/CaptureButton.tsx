import Image from 'next/image';
import { useState } from 'react';

import * as Icon from '@/asset/icon';
import ButtonTag from '@/component/ButtonTag';

interface CaptureButtonProperties {
	imgSrc: null | string;
	onImageChange: (value: null | string) => void;
	onVisible: (value: boolean) => void;
}

export default function CaptureButton({ imgSrc, onImageChange, onVisible }: CaptureButtonProperties) {
	const [isClicked, setIsClicked] = useState(false);

	const handleCaptureButtonClick = async () => {
		setIsClicked(true);
		onVisible(false);
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				preferCurrentTab: true,
				video: {
					displaySurface: 'browser',
				},
			} as DisplayMediaStreamOptions);

			const video = document.createElement('video');
			video.srcObject = stream;
			video.autoplay = true;
			video.playsInline = true;

			video.onplay = () => {
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d');

				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;

				context?.drawImage(video, 0, 0, canvas.width, canvas.height);

				const capturedImage = canvas.toDataURL('image/png');
				onImageChange(capturedImage);

				video.remove();
				canvas.remove();
				stream?.getTracks().forEach((track) => track.stop());
				onVisible(true);
			};
		} catch {
			return;
		} finally {
			onVisible(true);
			setIsClicked(false);
		}
	};

	const handleRemoveButtonClick = () => {
		onImageChange(null);
	};

	return (
		<div className='relative flex flex-col gap-[10px]'>
			{imgSrc ? (
				<>
					<p>첨부된 스크린샷</p>
					<div className='overflow-hidden rounded border border-solid border-[#757575]'>
						<Image alt='capturedImage' height={240} src={imgSrc} width={372} />
					</div>
					<div />
					<div className='absolute right-0 top-6'>
						<ButtonTag instant={true} name='스크린샷 삭제' style={{ left: 'auto', right: '-45px' }}>
							<button
								className='flex size-12 items-center justify-center rounded-full bg-white hover:bg-[#FCF7F6] active:bg-[#F5E5E4]'
								style={{ boxShadow: '0 1px 3px 0 rgba(48,48,48,0.302),0 4px 8px 3px rgba(48,48,48,0.149)' }}
								type='button'
								onClick={handleRemoveButtonClick}
							>
								<Icon.Remove fill='#B3261E' height={24} width={24} />
							</button>
						</ButtonTag>
					</div>
				</>
			) : (
				<>
					<p>스크린샷을 주시면 문제를 더 정확하게 파악하는 데 도움이 됩니다.(선택사항)</p>
					<button
						className='flex h-9 w-full items-center justify-center gap-2 rounded border border-solid border-[#ABABAB] pl-[11px] pr-[15px] hover:bg-[#F5F8FD] active:bg-[#E1EAF9]'
						disabled={isClicked}
						type='button'
						onClick={handleCaptureButtonClick}
					>
						<Icon.Capture fill='#0B57D0' height={18} width={18} />
						<p className='text-sm text-[#0B57D0]'>스크린샷 캡처</p>
					</button>
				</>
			)}
		</div>
	);
}
