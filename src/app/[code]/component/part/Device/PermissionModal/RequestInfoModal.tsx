import Image from 'next/image';

import * as Icon from '@/asset/icon';
import { permissionCommon } from '@/asset/image';
import { ButtonTag } from '@/component';

interface RequestInfoModalProperties {
	onClose: () => void;
}

export default function RequestInfoModal({ onClose }: RequestInfoModalProperties) {
	return (
		<div className='relative flex w-full max-w-[789px] items-center rounded-[28px] bg-white px-8 pb-10 pt-[30px] lg:flex-col'>
			<div className='absolute right-2 top-2 rounded-full hover:bg-[#F0F1F1] active:bg-[#DEDFDF]'>
				<ButtonTag name='대화상자 닫기' position='bottom'>
					<button className='flex  size-12 items-center justify-center' type='button' onClick={onClose}>
						<Icon.Delete fill='#444746' height={24} width={24} />
					</button>
				</ButtonTag>
			</div>
			<Image alt='permission' className='size-[322.5px] lg:size-[175px]' src={permissionCommon} />
			<div className='px-10 pt-5 font-googleSans'>
				<h1 className='mb-[15px] text-left text-[22px] text-[#444746]'>Meet에서 마이크 및 카메라 사용이 차단됨</h1>
				<ol className='list-decimal'>
					<li>
						<span className='inline'>
							브라우저의 주소 표시줄에서
							<span className='mx-1 inline-block align-middle'>
								<Icon.PermissionSetting height={25} width={25} />
							</span>
							설정 아이콘을 클릭합니다.
						</span>
					</li>
					<li className='my-[15px]'>
						<span className='inline'>차단된 마이크 및 카메라 권한을 허용합니다.</span>
					</li>
				</ol>
			</div>
		</div>
	);
}
