import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HeaderState {
  title: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
  actions?: React.ReactNode;
}

export interface HeaderContextType {
  headerState: HeaderState;
  setHeaderState: (state: HeaderState) => void;
  clearHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [headerState, setHeaderState] = useState<HeaderState>({ title: '' });

  const clearHeader = () => setHeaderState({ title: '' });

  return (
    <HeaderContext.Provider value={{ headerState, setHeaderState, clearHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = (state: HeaderState, deps: any[] = []) => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }

  useEffect(() => {
    context.setHeaderState(state);
    return () => {
      context.clearHeader();
    };
  }, deps);
};

export default HeaderContext;
