import { useAuth } from '@/contexts/AuthContext';

export const useLogout = () => {
  const { logout } = useAuth();
  return { logout };
};
