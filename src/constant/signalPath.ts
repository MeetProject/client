export const APP_PATH = {
  ANSWER: '/app/signal/answer',
  CHAT: '/app/chat/send',
  DEVICE: '/app/device',
  EMOJI: '/app/emoji',
  HAND_UP: '/app/handUp',
  ICE: '/app/signal/ice',
  JOIN: '/app/signal/join',
  LEAVE: '/app/signal/leave',
  OFFER: '/app/signal/offer',
  SCREEN: '/app/signal/screen',
};

export const USER_PATH = {
  ANSWER: '/user/queue/signal/answer',
  ERROR: '/user/queue/signal/error',
  ICE: '/user/queue/signal/ice',
  JOIN: '/user/queue/signal/join',
  OFFER: '/user/queue/signal/offer',
  SCREEN: '/user/queue/signal/screen',
};

export const TOPIC_PATH = {
  ROOM: (roomId: string) => ({
    CHAT: `/topic/room/${roomId}/chat`,
    DEVICE: `/topic/room/${roomId}/device`,
    EMOJI: `/topic/room/${roomId}/emoji`,
    HANDUP: `/topic/room/${roomId}/handup`,
    LEAVE: `/topic/room/${roomId}/leave`,
  }),
}