import React from 'react';

export const UserList: React.FC = () => {
  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-200 mb-2">User Directory</h3>
      <p className="text-xs text-gray-400">Manage analysts, administrators and viewer roles.</p>
    </div>
  );
};
export default UserList;
