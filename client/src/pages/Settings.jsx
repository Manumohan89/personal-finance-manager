import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Spinner from '../components/Spinner';
import PlansSection from '../components/PlansSection';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', currency: user?.currency || 'INR' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    setProfileForm({ name: user?.name || '', currency: user?.currency || 'INR' });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await userService.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="card p-5">
        <h2 className="font-medium mb-4">Profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input opacity-60" value={user?.email} disabled />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={profileForm.currency} onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? <Spinner size={16} className="text-white" /> : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="font-medium mb-4">Theme</h2>
        <div className="flex gap-2">
          {['light', 'dark', 'system'].map((t) => (
            <button key={t} className={`btn-secondary capitalize ${theme === t ? '!bg-primary-600 !text-white' : ''}`} onClick={() => setTheme(t)}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-medium mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {pwError && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{pwError}</div>}
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPw}>
            {savingPw ? <Spinner size={16} className="text-white" /> : 'Update Password'}
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="font-medium mb-4">Financial Plans</h2>
        <PlansSection currency={user?.currency} />
      </section>
    </div>
  );
};

export default Settings;
