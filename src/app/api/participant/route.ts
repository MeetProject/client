import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/connectDB';
import { ErrorResponse } from '@/type/errorType';

export async function POST(request: Request) {
  const { color, sessionId, userId, userName } = await request.json();
  if (!sessionId || !userId || !userName || !color) {
    return NextResponse.json(
      { message: '넣으려는 값에 필수적인 값(sessionId, userId, userName, color)이 빠져있습니다' },
      { status: 400 },
    );
  }
  try {
    const database = (await connectDB).db('session');
    try {
      await database.collection('participant').insertOne({ _id: new ObjectId(), color, sessionId, userId, userName });
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
    return NextResponse.json({
      data: { sessionId, userName },
      message: '값이 저장되었습니다',
    });
  } catch {
    return NextResponse.json({ message: '데이터 베이스 연결에 실패하였습니다' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ message: '찾으려는 sessionID의 값이 필요합니다' }, { status: 404 });
  }
  try {
    const database = (await connectDB).db('session');
    try {
      const result = await database.collection('participant').find({ sessionId }).toArray();
      return NextResponse.json({ data: result });
    } catch (error) {
      return NextResponse.json({ message: '값을 찾을 수 없습니다' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ message: '데이터 베이스 연결에 실패하였습니다' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
