import { useState, useEffect } from 'react';
import { storageService } from '@/services/storage/storageService';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storageService.get<T>(key, initialValue);
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    storageService.set<T>(key, value);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(storageService.get<T>(key, initialValue));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue];
}
