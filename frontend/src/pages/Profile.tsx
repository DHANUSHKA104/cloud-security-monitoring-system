import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/formatters/dateFormatter';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useAppStore();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // MFA state
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaEnabledState, setMfaEnabledState] = useState<boolean>(!!user?.mfaEnabled);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (newPassword.length < 10) {
      setPasswordError('New password must be at least 10 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await apiClient.put('/api/auth/password', {
        currentPassword,
        newPassword,
      });

      addToast({
        type: 'success',
        message: 'Password changed successfully',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setPasswordError(apiErr.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const openEnableMfaModal = async () => {
    try {
      setMfaError(null);
      setMfaCode('');
      setMfaModalOpen(true);
      // Backend triggers secret generation and dev code logging
      await apiClient.post('/api/auth/mfa/enable', { code: '000000' }).catch(() => {
        // Will fail code validation if not supplied, but triggers secret setup
      });
    } catch {
      // Ignore
    }
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length !== 6) {
      setMfaError('Enter the 6-digit verification code from server logs / authenticator');
      return;
    }

    try {
      setMfaLoading(true);
      setMfaError(null);
      await apiClient.post('/api/auth/mfa/enable', { code: mfaCode });
      addToast({
        type: 'success',
        message: 'Multi-Factor Authentication enabled',
      });
      setMfaEnabledState(true);
      setMfaModalOpen(false);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setMfaError(apiErr.message || 'Verification failed. Check the code and try again.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    try {
      setMfaLoading(true);
      await apiClient.post('/api/auth/mfa/disable');
      addToast({
        type: 'success',
        message: 'Multi-Factor Authentication disabled',
      });
      setMfaEnabledState(false);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      addToast({
        type: 'error',
        message: apiErr.message || 'Failed to disable MFA',
      });
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Analyst Profile & Security</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your account credentials, security preferences and operational status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */}
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

        {/* Security & Authentication */}
        <Card>
          <CardHeader title="Multi-Factor Authentication" />
          <CardBody className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded bg-gray-950 border border-gray-800">
              <div>
                <div className="font-medium text-gray-200">TOTP Two-Factor</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  RFC 6238 6-digit TOTP verification on login
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    mfaEnabledState
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {mfaEnabledState ? 'ENABLED' : 'DISABLED'}
                </span>
                {mfaEnabledState ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleDisableMfa}
                    loading={mfaLoading}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button size="sm" onClick={openEnableMfaModal}>
                    Enable
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 rounded bg-gray-950 border border-gray-800">
              <div className="font-medium text-gray-200">Role Authority</div>
              <p className="text-[11px] text-gray-400 mt-1">
                Roles follow strict hierarchy: ADMIN &gt; ANALYST &gt; VIEWER. Modifying roles requires an Administrator.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card>
        <CardHeader title="Change Password" />
        <CardBody>
          <form onSubmit={handlePasswordChange} className="space-y-3 max-w-lg text-xs">
            {passwordError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
                {passwordError}
              </div>
            )}

            <Input
              id="current-password"
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              id="new-password"
              label="New Password"
              type="password"
              placeholder="Minimum 10 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              id="confirm-new-password"
              label="Confirm New Password"
              type="password"
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" loading={passwordLoading} size="sm">
                Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Enable MFA Modal */}
      <Modal
        open={mfaModalOpen}
        onClose={() => setMfaModalOpen(false)}
        title="Activate Multi-Factor Authentication"
      >
        <div className="text-xs text-gray-400 mb-3">
          Check the backend console log for your dev OTP code, then enter it below to confirm activation.
        </div>
        <form onSubmit={handleConfirmMfa} className="space-y-3">
          {mfaError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
              {mfaError}
            </div>
          )}

          <Input
            id="mfa-verify-code"
            label="6-Digit Verification Code"
            placeholder="123456"
            maxLength={6}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMfaModalOpen(false)}
              disabled={mfaLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={mfaLoading}>
              Confirm & Enable
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Profile;
