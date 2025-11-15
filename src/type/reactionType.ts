import { EmojiType } from './toggleType';

export interface ChatResponseType {
  userId: string;
  message: string;
  timestamp: string;
}

export interface EmojiResponseType {
  userId: string;
  emoji: EmojiType;
}
