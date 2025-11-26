import { createContext, PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { ToggleStatusType, ToggleType } from '@/type/toggleType';

interface ToggleContextType {
	toggleStatus: ToggleStatusType;
	isVisibleToggle: boolean;
	handleToggleStatus: (key: ToggleType, value?: boolean | 'disable') => void;
	handleVisibleToggle: () => void;
}

export const ToggleContext = createContext<ToggleContextType>({
	handleToggleStatus: () => {},
	handleVisibleToggle: () => {},
	isVisibleToggle: true,
	toggleStatus: { caption: false, emoji: false, handsUp: false, screen: false },
});

export function ToggleContextProvider({ children }: PropsWithChildren) {
	const [toggleStatus, setToggleStatus] = useState<ToggleStatusType>({
		caption: false,
		emoji: false,
		handsUp: false,
		screen: false,
	});
	const [isVisibleToggle, setIsVisibleTogle] = useState<boolean>(true);

	const handleToggleStatus = useCallback((key: ToggleType, value?: boolean | 'disable') => {
		setToggleStatus((previous) => ({ ...previous, [key]: value ?? !previous[key] }));
	}, []);

	const handleVisibleToggle = useCallback(() => {
		setIsVisibleTogle((previous) => !previous);
	}, []);

	const value = useMemo(
		() => ({
			handleToggleStatus,
			handleVisibleToggle,
			isVisibleToggle,
			toggleStatus,
		}),
		[toggleStatus, isVisibleToggle, handleToggleStatus, handleVisibleToggle],
	);

	return <ToggleContext.Provider value={value}>{children}</ToggleContext.Provider>;
}
