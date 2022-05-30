import { createContext, useContext, useState } from "react";

import { COLOUR_SCHEME_STORAGE_KEY } from "../constants";
import { getFromLocalStorage, writeToLocalStorage } from "../utils/localStorage";

type Scheme = "light" | "dark";
interface ColorScheme {
  version: 1; // State saved to localStorage so we need to know if its old data if we update logic here
  scheme: Scheme;
}

interface ColorSchemeState {
  scheme: ColorScheme;
  setScheme: (scheme: Scheme) => void;
}

const defaultColorSchemePayload: ColorScheme = {
  version: 1,
  scheme: "light",
};

const initialScheme = getFromLocalStorage(COLOUR_SCHEME_STORAGE_KEY, defaultColorSchemePayload);

const initialState: ColorSchemeState = {
  scheme: initialScheme,
  setScheme: () => {
    // Do nothing
  },
};

export const ColorSchemeContext = createContext<ColorSchemeState>(initialState);

export const ColorSchemeProvider: React.FC = ({ children }) => {
  const [scheme, setScheme] = useState(initialScheme);

  return (
    <ColorSchemeContext.Provider
      value={{
        scheme,
        setScheme: (scheme) => {
          writeToLocalStorage(COLOUR_SCHEME_STORAGE_KEY, { version: 1, scheme });
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
