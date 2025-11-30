'use client';

import { PropsWithChildren, useState, useEffect, JSX } from 'react';
import ReactDOM from 'react-dom';

import { BaseContent, Header, Report, Suggest } from './part/Feedback';

interface FeedBackProperties {
	isOpen: boolean;
	onClose: () => void;
}

function FeedBackPortal({ children }: PropsWithChildren) {
	const [portalElement, setPortalElement] = useState<Element | null>(null);

	useEffect(() => {
		setPortalElement(document.getElementById('feedback'));
	}, []);

	if (!portalElement) {
		return null;
	}

	return ReactDOM.createPortal(children, portalElement) as JSX.Element;
}

export default function Feedback({ isOpen, onClose }: FeedBackProperties) {
	const [category, setCategory] = useState<null | 'report' | 'suggest'>(null);
	const [isCompletedForm, setIsCompletedForm] = useState(false);
	const [isVisible, setIsVisible] = useState(true);

	const handleClose = () => {
		setCategory(null);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	const handleButtonClick = (value: null | 'report' | 'suggest') => {
		setCategory(value);
	};

	const handleCompleteForm = (value: boolean) => {
		setIsCompletedForm(value);
	};

	const handleVisible = (value: boolean) => {
		setIsVisible(value);
	};

	return (
		<FeedBackPortal>
			<div
				className={`${isVisible ? 'visible' : 'invisible'} fixed z-[2101] flex h-screen w-screen`}
				style={{
					backgroundColor: 'rgba(128, 134, 139, 0.5)',
				}}
			>
				<div
					className='absolute right-0 top-0 h-full w-[412px] overflow-hidden rounded-l-lg bg-white'
					style={{ boxShadow: '0 1px 3px 0 rgba(48,48,48,0.302),0 4px 8px 3px rgba(48,48,48,0.149)' }}
				>
					{!category ? (
						<BaseContent onClick={handleButtonClick} onClose={handleClose} />
					) : (
						<div className='flex size-full flex-col'>
							<Header type={category} onClick={handleButtonClick} onClose={handleClose} />
							<div className='overflow-auto' style={{ height: 'calc(100vh - 132px)' }}>
								<div className='w-full p-4'>
									{category === 'report' ? (
										<Report onComplete={handleCompleteForm} onVisible={handleVisible} />
									) : (
										<Suggest onComplete={handleCompleteForm} onVisible={handleVisible} />
									)}
								</div>
							</div>

							<div className='flex justify-end bg-white p-5 pb-4' style={{ boxShadow: '0 -1px 4px rgba(48,48,48,.3)' }}>
								<button
									className={`h-9 rounded px-6 font-googleSans text-sm ${isCompletedForm ? 'bg-[#0B57D0] text-white' : 'bg-[#E4E4E4] text-[#555555]'}`}
									disabled={!isCompletedForm}
									type='button'
								>
									보내기
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</FeedBackPortal>
	);
}
