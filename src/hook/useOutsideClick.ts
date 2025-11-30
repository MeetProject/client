import { useRef, useEffect } from 'react';

const useOutsideClick = <T extends HTMLElement>(callback: () => void) => {
	const targetReference = useRef<T>(null);
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const { target } = e;
			if (targetReference.current && !targetReference.current.contains(target as Node)) {
				callback();
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [callback]);

	return { targetRef: targetReference };
};

export default useOutsideClick;
