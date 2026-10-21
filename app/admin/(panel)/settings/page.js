import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  requireAdmin();

  let settings = null;
  let error = '';
  try {
    settings = await getSettings();
  } catch (e) {
    error = (e && e.message) || 'Could not load settings.';
  }

  return (
    <div className="stack">
      <h1 className="page-title">Settings</h1>
      {error ? <div className="notice notice-err">{error}</div> : null}
      {settings ? <SettingsForm settings={settings} /> : null}
    </div>
  );
}
