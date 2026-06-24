import { useEffect, useState } from 'react';
import { Code2, Eye, FileText, Lock, LogOut, Mail, Send } from 'lucide-react';
import Button from '@/components/common/Button';
import ToastContainer from '@/components/common/Toast';
import OutlookLoginModal from '@/components/email/OutlookLoginModal';
import { useHeader } from '@/contexts/HeaderContext';
import { useToast } from '@/hooks/useToast';
import {
  fetchEmailTemplatesApi,
  getOutlookSessionApi,
  logoutOutlookApi,
  sendEmailApi,
  type EmailTemplate,
  type OutlookSession,
} from '@/services/emailApi';

type OfferLetterFields = {
  candidate_name: string;
  position: string;
  start_date: string;
  offer_date: string;
  date_of_birth: string;
  id_number: string;
  id_issue_date: string;
  id_issue_place: string;
  address: string;
  mobile: string;
  email: string;
  salutation: string;
  department: string;
  basic_salary: string;
  basic_salary_text: string;
  probation_days: string;
};

const emptyOfferLetterFields: OfferLetterFields = {
  candidate_name: '',
  position: '',
  start_date: '',
  offer_date: '',
  date_of_birth: '',
  id_number: '',
  id_issue_date: '',
  id_issue_place: '',
  address: '',
  mobile: '',
  email: '',
  salutation: '',
  department: '',
  basic_salary: '',
  basic_salary_text: '',
  probation_days: '',
};

const renderOfferTemplate = (value: string, fields: OfferLetterFields) =>
  value.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key: keyof OfferLetterFields) => fields[key] || '');

const getDateOfBirthPdfPassword = (dateOfBirth: string) => {
  const dateMatch = dateOfBirth.match(/^(\d{4})-(\d{2})/);
  return dateMatch ? `${dateMatch[1]}${dateMatch[2]}` : '';
};

export function EmailPage() {
  const { toasts, removeToast, toast } = useToast();
  const [session, setSession] = useState<OutlookSession | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [offerFields, setOfferFields] = useState<OfferLetterFields>(emptyOfferLetterFields);

  const renderedSubject = renderOfferTemplate(subject, offerFields);
  const renderedHtml = renderOfferTemplate(html, offerFields);
  const isVietnamTemplate = selectedTemplateId === 'offer-letter-vietnam';
  const generatedPdfPassword = getDateOfBirthPdfPassword(offerFields.date_of_birth);
  const hasValidPdfPassword = Boolean(generatedPdfPassword);

  const loadEmailData = async () => {
    setLoading(true);
    try {
      const [sessionResult, templateResult] = await Promise.all([
        getOutlookSessionApi(),
        fetchEmailTemplatesApi(),
      ]);
      setSession(sessionResult);
      setTemplates(templateResult);
      if (templateResult.length === 1) {
        applyTemplate(templateResult[0]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load email page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailData();
  }, []);

  useHeader({
    title: 'Email',
    subTitle: 'Send candidate emails with Outlook relay and offer letter templates.',
    actions: session ? (
      <Button
        variant="secondary"
        icon={<LogOut size={16} />}
        onClick={async () => {
          await logoutOutlookApi();
          setSession(null);
          toast.success('Outlook session cleared.');
        }}
      >
        Logout Outlook
      </Button>
    ) : (
      <Button icon={<Mail size={16} />} onClick={() => setShowLogin(true)}>
        Login With Outlook
      </Button>
    ),
  }, [session]);

  const applyTemplate = (template: EmailTemplate) => {
    setSelectedTemplateId(template.id);
    setSubject(template.subject);
    setHtml(template.html);
    setOfferFields(emptyOfferLetterFields);
  };

  const updateOfferField = (field: keyof OfferLetterFields, value: string) => {
    setOfferFields((current) => ({ ...current, [field]: value }));
  };

  const handleSend = async () => {
    if (!session) {
      setShowLogin(true);
      return;
    }

    setSending(true);
    try {
      await sendEmailApi({
        to,
        subject: renderedSubject,
        html: `
          <p>Dear ${offerFields.candidate_name || 'Candidate'},</p>
          <p>Please find your password-protected offer letter attached as a PDF file.</p>
          <p>Best regards,<br />Molex Recruitment Team</p>
        `,
        offerLetterPdf: {
          candidateName: offerFields.candidate_name,
          position: offerFields.position,
          startDate: offerFields.start_date,
          templateId: selectedTemplateId,
          password: generatedPdfPassword,
          offerDate: offerFields.offer_date,
          dateOfBirth: offerFields.date_of_birth,
          idNumber: offerFields.id_number,
          idIssueDate: offerFields.id_issue_date,
          idIssuePlace: offerFields.id_issue_place,
          address: offerFields.address,
          mobile: offerFields.mobile,
          email: offerFields.email || to,
          salutation: offerFields.salutation,
          department: offerFields.department,
          basicSalary: offerFields.basic_salary,
          basicSalaryText: offerFields.basic_salary_text,
          probationDays: offerFields.probation_days,
        },
      });
      toast.success('Protected PDF offer letter sent successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Outlook Account</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {loading ? 'Loading...' : session?.email || 'Not connected'}
            </div>
          </div>
          {!session && (
            <Button icon={<Mail size={16} />} onClick={() => setShowLogin(true)}>
              Login With Outlook
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Offer Letter Template</h2>
          <div className="mt-4 space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                  selectedTemplateId === template.id
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileText size={16} />
                  {template.name}
                </div>
                <div className="mt-1 text-xs text-slate-500">{renderOfferTemplate(template.subject, offerFields)}</div>
              </button>
            ))}
            {!loading && templates.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No templates found.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">To</label>
              <input
                type="email"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="candidate@example.com"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Subject</label>
              <input
                type="text"
                value={renderedSubject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Offer Letter"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Candidate Name</label>
              <input
                type="text"
                value={offerFields.candidate_name}
                onChange={(event) => updateOfferField('candidate_name', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Position</label>
              <input
                type="text"
                value={offerFields.position}
                onChange={(event) => updateOfferField('position', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Start Date</label>
              <input
                type="date"
                value={offerFields.start_date}
                onChange={(event) => updateOfferField('start_date', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {isVietnamTemplate && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-800">Vietnam Offer Details</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Offer Date</label>
                  <input type="date" value={offerFields.offer_date} onChange={(event) => updateOfferField('offer_date', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Salutation</label>
                  <input type="text" value={offerFields.salutation} onChange={(event) => updateOfferField('salutation', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Department</label>
                  <input type="text" value={offerFields.department} onChange={(event) => updateOfferField('department', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Date of Birth</label>
                  <input type="date" value={offerFields.date_of_birth} onChange={(event) => updateOfferField('date_of_birth', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">ID Number</label>
                  <input type="text" value={offerFields.id_number} onChange={(event) => updateOfferField('id_number', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">ID Issue Date</label>
                  <input type="date" value={offerFields.id_issue_date} onChange={(event) => updateOfferField('id_issue_date', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">ID Issue Place</label>
                  <input type="text" value={offerFields.id_issue_place} onChange={(event) => updateOfferField('id_issue_place', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Mobile</label>
                  <input type="text" value={offerFields.mobile} onChange={(event) => updateOfferField('mobile', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Candidate Email</label>
                  <input type="email" value={offerFields.email} onChange={(event) => updateOfferField('email', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Address</label>
                  <input type="text" value={offerFields.address} onChange={(event) => updateOfferField('address', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Basic Salary</label>
                  <input type="text" value={offerFields.basic_salary} onChange={(event) => updateOfferField('basic_salary', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Salary in Words</label>
                  <input type="text" value={offerFields.basic_salary_text} onChange={(event) => updateOfferField('basic_salary_text', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Probation Days</label>
                  <input type="text" value={offerFields.probation_days} onChange={(event) => updateOfferField('probation_days', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <Lock size={16} />
              PDF Protection
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-emerald-700">Generated PDF Password</label>
                <input
                  type="text"
                  value={generatedPdfPassword || 'YYYYMM'}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none"
                />
              </div>
              <div className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-sm">
                Uses candidate birth year and month.
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Offer Letter</label>
              <Button
                type="button"
                variant="secondary"
                icon={showHtmlSource ? <Eye size={16} /> : <Code2 size={16} />}
                onClick={() => setShowHtmlSource((current) => !current)}
              >
                {showHtmlSource ? 'View Template' : 'Edit HTML'}
              </Button>
            </div>

            {showHtmlSource ? (
              <textarea
                value={html}
                onChange={(event) => setHtml(event.target.value)}
                rows={12}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            ) : (
              <div className="min-h-[360px] rounded-lg border border-slate-200 bg-slate-50 p-4">
                {html.trim() ? (
                  <iframe
                    title="Offer letter preview"
                    srcDoc={renderedHtml}
                    className="h-[620px] w-full rounded-lg bg-white shadow-sm"
                  />
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                    Select an offer letter template to preview it here.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSend}
              isLoading={sending}
              disabled={
                !to.trim() ||
                !renderedSubject.trim() ||
                !renderedHtml.trim() ||
                !offerFields.candidate_name.trim() ||
                !offerFields.position.trim() ||
                !offerFields.start_date.trim() ||
                !hasValidPdfPassword
              }
              icon={<Send size={16} />}
            >
              Send Protected PDF
            </Button>
          </div>
        </div>
      </div>

      <OutlookLoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onVerified={(newSession) => {
          setSession(newSession);
          toast.success('Outlook login successful.');
        }}
      />
    </div>
  );
}

export default EmailPage;
