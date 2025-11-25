import { deleteSessionId, postSessionId } from '@/app/api/mongoAPI';
import { postCreateSession } from '@/app/api/sessionAPI';

import { getSessionId } from './getRandomId';

const createSessionId = async (count: number): Promise<null | string> => {
  if (count === 0) {
    return null;
  }
  try {
    const key = getSessionId();
    await postSessionId(key);
    return key;
  } catch {
    return createSessionId(count - 1);
  }
};

export const createSession = async (count: number) => {
  const key = await createSessionId(count);
  if (!key) {
    return false;
  }

  try {
    await postCreateSession(key);
    return key;
  } catch {
    await deleteSessionId(key);
    return false;
  }
};
