import { useEffect, useState } from 'react';

/**
 * Consume a function that returns a promise and return it's value with a loading status
 */
export const usePromise = <T>(func: () => Promise<T>, defaultValue: T) => {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolvePromise = async () => {
      setData(await func());
      setLoading(false);
    };
    resolvePromise();
  }, [func]);

  return { data, loading };
};
