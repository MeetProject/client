'use client';

import { useContext } from 'react';

import { ToggleContext } from '@/context/ToggleContext';
import { EmojiType } from '@/type/reactionType';

import { Caption, Emoji } from './part/Toggle';

interface ToggleProperties {
	onClickEmojiButton: (value: EmojiType) => void;
}

export default function Toggle({ onClickEmojiButton }: ToggleProperties) {
	const { toggleStatus } = useContext(ToggleContext);
	return (
		<div>
			{toggleStatus.caption && <Caption />}
			{toggleStatus.emoji && <Emoji onClickEmojiButton={onClickEmojiButton} />}
		</div>
	);
}
