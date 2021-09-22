import React, { useContext, useState } from 'react';

const STORAGE_KEY = 'data-manager-ui-colourScheme';

type Scheme = 'light' | 'dark';
interface ColorScheme {
  version: 1;
  scheme: Scheme;
}

interface ColorSchemeState {
  scheme: ColorScheme;
  setScheme: (scheme: Scheme) => void;
}

function getFromLocalStorage<StoredValue>(key: string, defaultValue: StoredValue) {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value !== null) {
      return JSON.parse(value);
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

const initialScheme: ColorScheme = getFromLocalStorage(STORAGE_KEY, {
  version: 1,
  scheme: 'light',
});

const initialState: ColorSchemeState = {
  scheme: initialScheme,
  setScheme: () => {
    // Do nothing
  },
};

export const ColorSchemeContext = React.createContext<ColorSchemeState>(initialState);

export const ColorSchemeProvider: React.FC = ({ children }) => {
  const [scheme, setScheme] = useState(initialScheme);

  return (
    <ColorSchemeContext.Provider
      value={{
        scheme,
        setScheme: (scheme) => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, scheme }));
          setScheme({ version: 1, scheme });
        },
      }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
};

export const useColorScheme = () => {
  const { scheme, setScheme } = useContext(ColorSchemeContext);
  return [scheme.scheme, setScheme] as const;
};
