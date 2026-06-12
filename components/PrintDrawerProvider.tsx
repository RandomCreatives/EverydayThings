'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Photograph } from '@/lib/types';
import { PrintDrawer } from './PrintDrawer';

type PrintDrawerContextValue = {
  selectedPhoto: Photograph | null;
  openPrintDrawer: (photo: Photograph) => void;
  closePrintDrawer: () => void;
};

const PrintDrawerContext = createContext<PrintDrawerContextValue | null>(null);

export function PrintDrawerProvider({ children }: { children: React.ReactNode }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photograph | null>(null);

  const openPrintDrawer = useCallback((photo: Photograph) => {
    if (!photo.isPrintAvailable) return;
    setSelectedPhoto(photo);
  }, []);

  const closePrintDrawer = useCallback(() => setSelectedPhoto(null), []);

  const value = useMemo(
    () => ({ selectedPhoto, openPrintDrawer, closePrintDrawer }),
    [selectedPhoto, openPrintDrawer, closePrintDrawer]
  );

  return (
    <PrintDrawerContext.Provider value={value}>
      {children}
      <PrintDrawer />
    </PrintDrawerContext.Provider>
  );
}

export function usePrintDrawer() {
  const context = useContext(PrintDrawerContext);
  if (!context) {
    throw new Error('usePrintDrawer must be used inside PrintDrawerProvider');
  }
  return context;
}
