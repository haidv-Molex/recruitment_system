import { useState } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import Button from '@/components/common/Button';
import Modal from '@/components/ui/Modal';
import {
  requestOutlookLoginApi,
  verifyOutlookLoginApi,
  type OutlookSession,
} from '@/services/emailApi';

interface OutlookLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (session: OutlookSession) => void;
}

export default function OutlookLoginModal({ isOpen, onClose, onVerified }: OutlookLoginModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const requestCode = async () => {
    setLoading(true);
    setMessage('');
    try {
      await requestOutlookLoginApi(email);
      setStep('code');
      setMessage('Verification code sent to your Outlook inbox.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setMessage('');
    try {
      const session = await verifyOutlookLoginApi(email, code);
      onVerified(session);
      onClose();
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.message || 'Failed to verify Outlook login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login With Outlook" maxWidthClass="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={step === 'code'}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
          />
        </div>

        {step === 'code' && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={6}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        )}

        {message && <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {step === 'email' ? (
            <Button type="button" icon={<Mail size={16} />} isLoading={loading} disabled={!email.trim()} onClick={requestCode}>
              Send Code
            </Button>
          ) : (
            <Button type="button" icon={<ShieldCheck size={16} />} isLoading={loading} disabled={code.trim().length !== 6} onClick={verifyCode}>
              Verify
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
