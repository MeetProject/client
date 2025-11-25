import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/connectDB';

/* 해당 세션 있는 지 여부 확인 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ message: 'sessionId를 입력해주세요' }, { status: 400 });
  }

  try {
    const database = (await connectDB).db('session');
    const result = await database.collection('session').findOne({ sessionId });
    if (result) {
      return NextResponse.json({ data: true });
    }
    return NextResponse.json({ data: false });
  } catch {
    return NextResponse.json({ message: '데이터 베이스 연결에 실패하였습니다' }, { status: 500 });
  }
}
