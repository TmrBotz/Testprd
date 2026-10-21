import { notFound } from 'next/navigation';
import { getSettingsSafe } from '@/lib/settings';
import PublicShell from '@/components/PublicShell';

export const dynamic = 'force-dynamic';

const TITLES = {
  terms: 'Terms and Conditions',
  refund: 'Refund Policy',
  contact: 'Contact',
};

export function generateMetadata({ params }) {
  return { title: TITLES[params.type] || 'Legal' };
}

export default async function LegalPage({ params }) {
  const type = params.type;
  if (!Object.prototype.hasOwnProperty.call(TITLES, type)) notFound();

  const settings = await getSettingsSafe();
  const email = settings.supportEmail;
  const wa = String(settings.supportWhatsapp || '').replace(/\D/g, '');

  return (
    <PublicShell settings={settings}>
      <div className="card stack">
        <h1 className="page-title">{TITLES[type]}</h1>
        {type === 'terms' ? <p className="pre">{settings.termsText}</p> : null}
        {type === 'refund' ? <p className="pre">{settings.refundText}</p> : null}
        {type === 'contact' ? (
          <div className="stack">
            {!email && !wa ? <div className="hint">Contact details have not been added yet.</div> : null}
            {email ? (
              <div>
                <div className="label">Email</div>
                <a href={'mailto:' + email}>{email}</a>
              </div>
            ) : null}
            {wa ? (
              <div>
                <div className="label">WhatsApp</div>
                <a href={'https://wa.me/' + wa} target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </a>
              </div>
            ) : null}
            <div className="hint">When you write to us, include your UTR number and order ID.</div>
          </div>
        ) : null}
      </div>
    </PublicShell>
  );
}
