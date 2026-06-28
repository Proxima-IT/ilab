import { createContext, useContext, ReactNode } from 'react';
import { t } from '@/lib/translations';

interface LanguageContextType {
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const translate = (key: string) => t(key);

  return (
    <LanguageContext.Provider value={{ t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
