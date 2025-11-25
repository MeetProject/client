import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/connectDB';
import { ErrorResponse } from '@/type/errorType';

/* 세션 생성 */
export async function POST(request: Request) {
  const { sessionId } = await request.json();
  try {
    const database = (await connectDB).db('session');
    try {
      await database.collection('session').insertOne({ _id: new ObjectId(), sessionId });
    } catch (error) {
      const e = error as ErrorResponse;
      if (e.code === 121) {
        return NextResponse.json({ message: e.errmsg }, { status: 400 });
      }
      if (e.code === 11000) {
        return NextResponse.json({ message: '중복된 키 값 저장' }, { status: 400 });
      }
      return NextResponse.json({ message: '값을 넣을 수 없습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '값이 저장되었습니다', sessionId });
  } catch {
    return NextResponse.json({ message: '데이터 베이스 연결에 실패하였습니다' }, { status: 500 });
  }
}

/* 해당 세션 삭제 */
export async function DELETE(request: Request) {
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
