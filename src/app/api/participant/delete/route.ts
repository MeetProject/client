import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/connectDB';

export async function POST(request: Request) {
  const { sessionId, userId } = await request.json();
  if (!sessionId || !userId) {
    return NextResponse.json({ message: '삭제하려는 세션ID와 userName값이 필요합니다' }, { status: 400 });
  }
  try {
    const database = (await connectDB).db('session');
    try {
      const result = await database.collection('participant').deleteOne({ sessionId, userId });
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { message: '해당 sessionId와 userId를 갖는 데이터가 존재하지 않습니다' },
          { status: 404 },
        );
      }
      return NextResponse.json({ message: '값이 성공적으로 삭제되었습니다' });
    } catch (error) {
      return NextResponse.json({ message: '값을 삭제할 수 없습니다' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ message: '데이터 베이스 연결에 실패하였습니다' }, { status: 500 });
  }
}
