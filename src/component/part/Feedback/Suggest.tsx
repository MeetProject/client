import { useState, useEffect, useRef, ChangeEvent } from 'react';

import * as Icon from '@/asset/icon';
import ButtonTag from '@/component/ButtonTag';

import { CaptureButton, StyleLink } from './index';

interface SuggestProperties {
	onComplete: (value: boolean) => void;
	onVisible: (value: boolean) => void;
}

export default function Suggest({ onComplete, onVisible }: SuggestProperties) {
	const textareaReference = useRef<HTMLTextAreaElement>(null);
	const [text, setText] = useState<string>('');
	const [imgSource, setImgSource] = useState<string | null>(null);
	const [isChecked, setIsChecked] = useState(false);

	const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setText(e.target.value);
		if (e.target.value.length > 2) {
			onComplete(true);
		} else {
			onComplete(false);
		}
	};

	const handleImageChange = (value: null | string) => {
		setImgSource(value);
	};

	const handleCheckButtonClick = () => {
		setIsChecked((previous) => !previous);
	};

	useEffect(() => {
		if (!textareaReference.current) {
			return;
		}
		textareaReference.current.style.height = 'auto';
		textareaReference.current.style.height = `${textareaReference.current.scrollHeight}px`;
	}, [text]);

	return (
		<div className='flex h-full flex-col gap-5 overflow-auto py-[10px] font-googleSans'>
			<div className='flex flex-col gap-[10px]'>
				<p className='text-sm text-custom-gray'>제안사항 설명</p>
				<textarea
					value={text}
					onChange={handleTextChange}
					ref={textareaReference}
					placeholder='제품을 개선하는 데 도움이 될 만한 의견을 알려주세요'
					className='min-h-[122px] resize-none overflow-hidden rounded border border-solid border-[#444746] p-[15px] text-custom-gray outline-none placeholder:text-custom-gray'
				/>
				<div className='mt-[-2px] flex items-center gap-2'>
					<p className='text-xs text-[#444746]'>민간함 정보는 포함하지 마세요.</p>
					<ButtonTag
						style={{
							height: '64px',
							left: '-30px',
							padding: '8px',
							top: '100%',
							width: '294px',
						}}
						instant
						name='민감한 정보는 보호되어야 하는 모든 데이터를 의미합니다. 예를 들어 비밀번호, 신용카드 번호, 세부적인 개인 정보를 포함하지 마세요.'
					>
						<Icon.Help width={16} height={16} fill='#444746' className='group' />
					</ButtonTag>
				</div>
			</div>
			<CaptureButton imgSrc={imgSource} onVisible={onVisible} onImageChange={handleImageChange} />
			<div className='flex items-center gap-4 px-[6px] pt-[10px]'>
				<button
					type='button'
					onClick={handleCheckButtonClick}
					className={`flex size-[18px] items-center justify-center rounded-sm ${isChecked ? 'bg-[#0B57D0]' : 'border-2 border-solid border-[#41474B]'}`}
				>
					<Icon.Check width={18} height={18} fill='#ffffff' />
				</button>

				<p className='text-sm text-[#444746]'>추가 정보와 최신 소식이 담긴 이메일 전송에 동의</p>
			</div>
			<div className='mt-2'>
				<p className='text-xs text-[#444746]'>
					일부 <StyleLink>계정 및 시스템 정보</StyleLink>가 Google에 전송될 수 있습니다. 이 정보는{' '}
					<StyleLink>개인정보처리방침</StyleLink> 및 <StyleLink>서비스 약관</StyleLink>에 따라 문제를 해결하고 서비스를
					개선하는 데 사용됩니다. 이메일로 추가 정보와 소식을 전달해 드릴 수 있습니다. 법적인 이유로 콘텐츠 변경을
					요청하려면 <StyleLink>법률 정보 고객센터</StyleLink>로 이동하세요.
				</p>
			</div>
		</div>
	);
}
