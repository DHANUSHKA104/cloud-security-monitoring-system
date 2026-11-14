import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Always allow viewing Login and SignUp pages even if authenticated
  return <>{children}</>;
};
export default PublicRoute;
