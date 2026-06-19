import { useState } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/common/Button';
import { requestOutlookLoginApi, verifyOutlookLoginApi, type OutlookSession } from '@/services/emailApi';

export interface OutlookLoginModalProps {
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

  const handleRequestCode = async () => {
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

  const handleVerifyCode = async () => {
    setLoading(true);
    setMessage('');
    try {
      const session = await verifyOutlookLoginApi(email, code);
      onVerified(session);
      onClose();
      setCode('');
      setStep('email');
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.message || 'Failed to verify Outlook login.');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      {step === 'email' ? (
        <Button onClick={handleRequestCode} isLoading={loading} disabled={!email.trim()} icon={<Mail size={16} />}>
          Send Code
        </Button>
      ) : (
        <Button onClick={handleVerifyCode} isLoading={loading} disabled={!code.trim()} icon={<ShieldCheck size={16} />}>
          Verify
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login With Outlook" footer={footer} maxWidthClass="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Outlook Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={step === 'code'}
            placeholder="name@molex.com"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
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
              placeholder="000000"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            {message}
          </div>
        )}
      </div>
    </Modal>
  );
}