'use client';

import { ChangeEvent, useState } from 'react';

import * as Icon from '@/asset/icon';
import { UserListType } from '@/type/participantType';

import UserList from './UserList';

interface UserPanelProperties {
  userList: UserListType[];
}

export default function UserPanel({ userList }: UserPanelProperties) {
  const [filterName, setFilterName] = useState('');

  const handleFilterNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilterName(e.target.value);
  };

  return (
    <div className='flex select-none flex-col overflow-hidden' style={{ height: 'calc(100% - 64px)' }}>
      {/* <div className='px-[10px]'>
        <button
          type='button'
          className='flex h-12 w-fit items-center gap-2 rounded-full bg-[#C2E7FF] pl-4 pr-6 text-[#001D35]'
        >
          <Icon.InviteUser width={24} height={24} fill='#001D35' />
          <p>사용자 추가</p>
        </button>
      </div> */}
      <div className='size-full overflow-auto px-[10px] py-[15px]'>
        <div className='relative w-full'>
          <Icon.Search width={24} height={24} fill='#5F6368' className='absolute left-4 top-1/2 -translate-y-1/2' />
          <input
            value={filterName}
            onChange={handleFilterNameChange}
            placeholder='사용자 검색'
            className='h-12 w-full rounded-[8px] border border-solid border-[#DFE1E4] pl-12 text-[#28292C] outline-[#1A73E8] hover:border-[#9AA0A6]'
          />
        </div>
        <div className='w-full'>
          <p className='my-[9.13px] pl-[14px] text-xs font-medium text-[#5F5A5E]'>참석 중인 사용자</p>
          <UserList userList={userList} filterValue={filterName} />
        </div>
      </div>
    </div>
  );
}
