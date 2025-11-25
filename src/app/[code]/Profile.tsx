import Link from 'next/link';

import * as Icon from '@/asset/icon';

import { Device, NameForm } from './component';

export default function Profile() {
  return (
    <div className='flex h-screen w-screen flex-col bg-white'>
      <header className='relative p-4'>
        <Link href='/' className='flex items-center gap-2 whitespace-nowrap'>
          <Icon.Logo width={36} height={36} />
          <p className='text-1.5xl font-semibold text-gray-600'>Project</p>
          <p className='text-1.5xl font-medium text-gray-600'>Meet</p>
        </Link>
      </header>
      <div className='flex flex-1 items-center justify-center lg:flex-col'>
        <Device />
        <div className='flex w-full max-w-[448px] flex-col items-center p-4 font-googleSans'>
          <p className='text-2xl'>이름이 무엇인가요?</p>
          <NameForm />
          {/* <EntirePeople /> */}
        </div>
      </div>
      <footer className='flex items-center justify-center p-2 text-center text-xs text-[#5F6368]'>
        가입하면 서비스 약관 및 개인정보처리방침에 동의하게 됩니다. 봇이 아닌 실제 사용자인지 확인하기 위해 시스템
        정보가 전송됩니다.
      </footer>
    </div>
  );
}
