'use client';

import { PropsWithChildren } from 'react';

import { PanelContextProvider, ToggleContextProvider } from '@/context';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <PanelContextProvider>
      <ToggleContextProvider>{children}</ToggleContextProvider>
    </PanelContextProvider>
  );
}
