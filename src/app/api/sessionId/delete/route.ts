import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/connectDB';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  try {
    const database = (await connectDB).db('session');
    try {
      await database.collection('session').deleteOne({ sessionId });
      return NextResponse.json({ message: '값을 삭제하였습니다', sessionId });
    } catch (error) {
      return NextResponse.json({ message: '값을 찾을 수 없습니다' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ message: '데이터 베이스 연결에 실패하였습니다' }, { status: 500 });
  }
}
