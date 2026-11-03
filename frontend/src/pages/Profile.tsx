import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/formatters/dateFormatter';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useAppStore();
  const { theme, setTheme } = useTheme();

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
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('New password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(newPassword)) {
      setPasswordError('New password must contain at least one special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
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
      setPasswordError(apiErr.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const openEnableMfaModal = async () => {
    try {
      setMfaError(null);
      setMfaCode('');
      setMfaModalOpen(true);
      await apiClient.post('/api/auth/mfa/enable', { code: '000000' }).catch(() => {
        // Triggers secret generation in development
      });
    } catch {
      // Ignore
    }
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setMfaError('Code must be 6 digits');
      return;
    }

    try {
      setMfaLoading(true);
      setMfaError(null);
      await apiClient.post(API_ENDPOINTS.AUTH.MFA_ENABLE, { code: mfaCode });
      setMfaEnabledState(true);
      setMfaModalOpen(false);
      setMfaCode('');
      addToast({
        type: 'success',
        message: 'Two-factor authentication enabled successfully',
      });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setMfaError(apiErr.message || 'Invalid verification code');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) {
      return;
    }

    try {
      setMfaLoading(true);
      await apiClient.post(API_ENDPOINTS.AUTH.MFA_DISABLE);
      setMfaEnabledState(false);
      addToast({
        type: 'warning',
        message: 'Two-factor authentication disabled',
      });
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
                  {mfaEnabledState
                    ? 'Account secured with multi-factor authentication'
                    : 'Add a secondary verification layer during sign-in'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                    mfaEnabledState
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {mfaEnabledState ? 'ACTIVE' : 'DISABLED'}
                </span>
                {mfaEnabledState ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisableMfa}
                    loading={mfaLoading}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openEnableMfaModal}
                    loading={mfaLoading}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 rounded bg-gray-950 border border-gray-800">
              <div className="font-medium text-gray-200">Role Authority</div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Role elevation and Squad Lead assignments are governed by the Lead Administrator in accordance with SOC compliance policies.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader title="Change Password" />
          <CardBody>
            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
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

        {/* Display & Interface Preferences Card */}
        <Card>
          <CardHeader title="Interface & Theme Preferences" />
          <CardBody className="space-y-4 text-xs">
            <p className="text-gray-400">
              Customize your command center appearance. Switch seamlessly between dark twilight defense mode and high-contrast light mode.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-purple-500 bg-purple-950/40 text-purple-200 ring-1 ring-purple-500 shadow-sm'
                    : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-gray-100">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Dark Mode
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Deep twilight, optimal for SOC night ops and low eye strain.</div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500 shadow-sm'
                    : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-gray-100">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Light Mode
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Crisp high-contrast day palette for bright daytime rooms.</div>
              </button>
            </div>
          </CardBody>
        </Card>
      </div>

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
