import { createContext, PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { PanelType } from '@/type/menuType';

interface PanelContextType {
	panelType: null | PanelType;
	isOpen: boolean;
	handlePanelType: (value: null | PanelType) => void;
	handleOpenStatus: (value: boolean) => void;
}

export const PanelContext = createContext<PanelContextType>({
	handleOpenStatus: () => {},
	handlePanelType: () => {},
	isOpen: false,
	panelType: null,
});

export function PanelContextProvider({ children }: PropsWithChildren) {
	const [panelType, setPanelType] = useState<null | PanelType>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const handlePanelType = useCallback((value: null | PanelType) => {
		setPanelType(value);
	}, []);

	const handleOpenStatus = useCallback((value: boolean) => {
		setIsOpen(value);
	}, []);

	const value = useMemo(
		() => ({
			handleOpenStatus,
			handlePanelType,
			isOpen,
			panelType,
		}),
		[panelType, isOpen, handlePanelType, handleOpenStatus],
	);

	return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}
