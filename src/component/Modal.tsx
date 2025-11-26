'use client';

import { PropsWithChildren, useState, useEffect, ReactNode, JSX } from 'react';
import ReactDOM from 'react-dom';

import { useOutsideClick } from '@/hook';

interface ModalProperties {
  children: ReactNode;
  isOpen: boolean;
  onCloseModal: () => void;
}

function ModalPortal({ children }: PropsWithChildren) {
  const [portalElement, setPortalElement] = useState<Element | null>(null);

  useEffect(() => {
    setPortalElement(document.getElementById('modal'));
  }, []);

  if (!portalElement) {
    return null;
  }

  return ReactDOM.createPortal(children, portalElement) as JSX.Element;
}

export default function Modal({ children, isOpen, onCloseModal }: ModalProperties) {
  const { targetRef } = useOutsideClick<HTMLDivElement>(onCloseModal);
  if (!isOpen) {
    return null;
  }

  return (
    <ModalPortal>
      <div
        className='fixed z-[2101] flex h-screen w-screen items-center justify-center'
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        <div ref={targetRef}>{children}</div>
      </div>
    </ModalPortal>
  );
}
