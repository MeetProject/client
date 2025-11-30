import { useEffect, useRef } from 'react';

const useShortcutKey = (combination: string[], callback: () => void) => {
	const isTrigger = useRef<boolean>(false);
	const keyPressed = useRef<Record<string, boolean>>({});

	useEffect(() => {
		if (combination.length === 0) {
			return;
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			const { key } = e;
			keyPressed.current[key] = false;
			if (combination.includes(key) && isTrigger.current) {
				isTrigger.current = false;
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const { key } = e;
			keyPressed.current[key] = true;
			const isTriggerCombi = combination.every((k) => keyPressed.current[k] === true);
			if (!isTrigger.current && isTriggerCombi) {
				e.preventDefault();
				isTrigger.current = true;
				callback();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [callback, combination]);
};

export default useShortcutKey;
