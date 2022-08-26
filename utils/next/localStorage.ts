export const getFromLocalStorage = <StoredValue>(
  key: string,
  defaultValue: StoredValue,
): StoredValue => {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) {
      return JSON.parse(value);
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

export const writeToLocalStorage = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};
