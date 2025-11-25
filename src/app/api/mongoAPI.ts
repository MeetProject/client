import { ParticipantDataType } from '@/type/participantType';

export const postSessionId = async (sessionId: string) => {
  const response = await fetch('/api/sessionId', {
    body: JSON.stringify({ sessionId }),
    method: 'POST',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message);
  }
};

export const deleteSessionId = async (sessionId: string) => {
  const response = await fetch(`/api/sessionId/delete?sessionId=${sessionId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message);
  }
};

export const getParticipant = async (sessionId: string): Promise<ParticipantDataType[]> => {
  const response = await fetch(`/api/participant?sessionId=${sessionId}`, {
    cache: 'no-cache',
    method: 'GET',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message);
  }
  const { data } = await response.json();
  return data;
};

export const postParticipant = async (sessionId: string, userId: string, userName: string, color: string) => {
  const response = await fetch('/api/participant', {
    body: JSON.stringify({ color, sessionId, userId, userName }),
    method: 'POST',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message);
  }
};

export const deleteParticipant = async (sessionId: string, userId: string) => {
  const response = await fetch('/api/participant/delete', {
    body: JSON.stringify({ sessionId, userId }),
    method: 'POST',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message);
  }
};

export const postCheckSessionId = async (sessionId: string) => {
  const response = await fetch(`/api/sessionId/check?sessionId=${sessionId}`, {
    cache: 'no-cache',
    method: 'POST',
  });
  const result = await response.json();
  return result.data;
};
