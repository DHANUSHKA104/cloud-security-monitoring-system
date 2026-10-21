import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { formatDateTime } from '@/utils/formatters/dateFormatter';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Analyst Profile & Security</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your account credentials, security preferences and operational status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Account Details" />
          <CardBody className="space-y-4 text-xs">
            <div>
              <span className="text-gray-400 block mb-0.5">Full Name</span>
              <span className="text-gray-100 font-medium">{user?.fullName}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Email Address</span>
              <span className="text-gray-100 font-mono">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Assigned Role</span>
              <span className="inline-block px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono text-[10px] uppercase">
                {user?.role}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Account Created</span>
              <span className="text-gray-300">{formatDateTime(user?.createdAt)}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Security & Authentication" />
          <CardBody className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded bg-gray-950 border border-gray-800">
              <div>
                <div className="font-medium text-gray-200">Two-Factor Authentication</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Require 6-digit TOTP code on login
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  user?.mfaEnabled
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {user?.mfaEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <div className="p-3 rounded bg-gray-950 border border-gray-800">
              <div className="font-medium text-gray-200">Password Requirements</div>
              <p className="text-[11px] text-gray-400 mt-1">
                BCrypt-hashed passwords must be at least 10 characters and cannot match your email.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
export default Profile;
