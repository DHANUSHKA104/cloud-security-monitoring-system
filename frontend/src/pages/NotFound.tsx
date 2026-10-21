import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.constants';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-950">
      <div className="text-6xl font-black text-gray-700 mb-2">404</div>
      <h2 className="text-xl font-bold text-gray-100">Page Not Found</h2>
      <p className="text-xs text-gray-400 mt-2 max-w-sm mb-6">
        The requested operations console view does not exist or you do not have permission to view it.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};
export default NotFound;
