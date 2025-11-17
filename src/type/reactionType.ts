import { EmojiType } from './toggleType';

export interface ChatResponseType {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
}

export interface EmojiResponseType {
  id: string;
  userId: string;
  emoji: EmojiType;
  timestamp: string;
}

export interface ChatType extends ChatResponseType {
  userName: string;
  header?: boolean;
}
