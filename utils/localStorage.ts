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

export const writeToLocalStorage = <StoredValue>(key: string, value: StoredValue) => {
  localStorage.setItem(key, JSON.stringify(value));
};
