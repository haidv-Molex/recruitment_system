export interface ParsedCVDisplayProps {
  parsedData: any;
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className={`text-sm font-medium mt-1 ${value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
        {value || 'N/A'}
      </div>
    </div>
  );
}

export default function ParsedCVDisplay({ parsedData }: ParsedCVDisplayProps) {
  const links = parsedData.links || {};
  const otherLinks: string[] = links.other || [];
  const workExperienceDetails: any[] = parsedData.work_experience_details || [];
  const educationDetails: any[] = parsedData.education_details || [];
  const languageDetails: any[] = parsedData.language_details || [];
  const certifications: string[] = parsedData.certifications || [];
  const extractionWarnings: string[] = parsedData.extraction_warnings || [];
  const fieldConfidences: Record<string, number> = parsedData.field_confidences || {};
  const hasLinks = links.github || links.linkedin || links.portfolio || otherLinks.length > 0;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Professional Summary</label>
        {parsedData.summary
          ? <p className="text-sm text-slate-700 leading-relaxed">{parsedData.summary}</p>
          : <p className="text-sm text-slate-400 italic">N/A</p>
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Name</label>
          <div className="text-sm font-semibold text-slate-800 mt-1">{parsedData.name || 'N/A'}</div>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Current Position</label>
          <div className="text-sm font-semibold text-slate-800 mt-1">{parsedData.current_position || 'N/A'}</div>
        </div>
        <InfoCard label="Email Address" value={parsedData.email} />
        <InfoCard label="Phone Number" value={parsedData.phone} />
        <InfoCard label="Gender" value={parsedData.gender} />
        <InfoCard label="Date of Birth" value={parsedData.date_of_birth} />
        <InfoCard label="Location" value={parsedData.location} />
        <InfoCard label="Nationality" value={parsedData.nationality} />
        <InfoCard label="National ID" value={parsedData.national_id} />
        <InfoCard label="Years of Experience" value={parsedData.experience_years} />
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Links</label>
        {hasLinks ? (
          <div className="flex flex-wrap gap-2">
            {links.github && (
              <a href={links.github} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-white text-xs font-semibold rounded-full hover:bg-slate-700 transition-colors">
                GitHub
              </a>
            )}
            {links.linkedin && (
              <a href={links.linkedin} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors">
                LinkedIn
              </a>
            )}
            {links.portfolio && (
              <a href={links.portfolio} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full hover:bg-purple-700 transition-colors">
                Portfolio
              </a>
            )}
            {otherLinks.map((url: string, idx: number) => {
              let hostname = url;
              try { hostname = new URL(url).hostname; } catch { /* keep full url */ }
              return (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-200 transition-colors max-w-[200px] truncate"
                  title={url}>
                  {hostname}
                </a>
              );
            })}
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">None</span>
        )}
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Skills</label>
        <div className="flex flex-wrap gap-1.5">
          {parsedData.skills && parsedData.skills.length > 0 ? (
            parsedData.skills.map((skill: string, idx: number) => (
              <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">None mentioned</span>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Languages</label>
        <div className="flex flex-wrap gap-1.5">
          {languageDetails.length > 0 ? (
            languageDetails.map((lang: any, idx: number) => (
              <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                {lang.language}{lang.proficiency ? ` · ${lang.proficiency}` : ''}
              </span>
            ))
          ) : parsedData.languages && parsedData.languages.length > 0 ? (
            parsedData.languages.map((lang: string, idx: number) => (
              <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                {lang}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">None mentioned</span>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Certifications</label>
        {certifications.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {certifications.map((cert: string, idx: number) => (
              <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
                {cert}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">None mentioned</span>
        )}
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Education</label>
        {educationDetails.length > 0 ? (
          <div className="space-y-2">
            {educationDetails.map((edu: any, idx: number) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="font-semibold text-sm text-slate-800">
                  {edu.institution || edu.degree || 'Unknown Institution'}
                </div>
                {edu.degree && edu.degree !== edu.institution && (
                  <div className="text-xs text-slate-600 mt-0.5">{edu.degree}</div>
                )}
                {edu.field && (
                  <div className="text-xs text-slate-500 mt-0.5">{edu.field}</div>
                )}
                {(edu.start_date || edu.end_date) && (
                  <div className="text-xs text-slate-400 mt-1">
                    {edu.start_date}{edu.start_date && edu.end_date ? ' – ' : ''}{edu.end_date}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : parsedData.education ? (
          <p className="text-sm text-slate-700">{parsedData.education}</p>
        ) : (
          <span className="text-sm text-slate-400 italic">None mentioned</span>
        )}
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Work Experience</label>
        {workExperienceDetails.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {workExperienceDetails.map((exp: any, idx: number) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{exp.title || 'Unknown Role'}</div>
                    {exp.company && <div className="text-xs text-slate-500 mt-0.5">{exp.company}</div>}
                  </div>
                  {(exp.start_date || exp.end_date || exp.is_current) && (
                    <div className="flex-shrink-0 text-xs text-slate-400 whitespace-nowrap">
                      {exp.start_date}
                      {exp.start_date && (exp.end_date || exp.is_current) ? ' – ' : ''}
                      {exp.is_current ? 'Hiện tại' : exp.end_date}
                    </div>
                  )}
                </div>
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.responsibilities.map((responsibility: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-600 flex gap-1.5">
                        <span className="shrink-0 w-1 h-1 rounded-full bg-slate-400 mt-1.5"></span>
                        {responsibility}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : parsedData.work_experience ? (
          <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {parsedData.work_experience}
            </p>
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">None mentioned</span>
        )}
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
        <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Extraction Warnings</label>
        {extractionWarnings.length > 0 ? (
          <ul className="space-y-0.5">
            {extractionWarnings.map((warning: string, idx: number) => (
              <li key={idx} className="text-xs text-amber-700 flex gap-1.5">
                <span>⚠</span>
                {warning}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-amber-600 italic">None</span>
        )}
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Extraction Confidence</label>
        {Object.keys(fieldConfidences).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
            {Object.entries(fieldConfidences).map(([field, confidence]) => (
              <div key={field} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 capitalize truncate">{field.replace(/_/g, ' ')}</div>
                  <div className="mt-0.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${confidence >= 0.8 ? 'bg-emerald-400' : confidence >= 0.5 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.round(confidence * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600 tabular-nums">{Math.round(confidence * 100)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">No confidence data</span>
        )}
      </div>
    </div>
  );
}