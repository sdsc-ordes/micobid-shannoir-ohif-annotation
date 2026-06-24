import { useEffect, useMemo, useRef, useState } from 'react'
import {
  examById, userById, projectById, STATUS, STATUS_ORDER,
  ohifAnnotateUrl, ohifViewUrl, shanoirExamUrl,
  timestampToken, renderFilename, segFilename, formatBytes,
} from '../data/mockData'

function useCopy() {
  const [copied, setCopied] = useState(null)
  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 1200)
    })
  }
  return [copied, copy]
}

function LabelCard({ label, copied, onCopy }) {
  const snippet = `${label.name}\t${label.color}`
  return (
    <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100">
        <span className="w-4 h-4 rounded-sm border border-slate-300 shrink-0" style={{ backgroundColor: label.color }} />
        <span className="text-[13px] font-medium text-slate-900 flex-1">{label.name}</span>
        <span className="font-mono text-[11px] text-slate-500 num">{label.color}</span>
      </div>
      <div className="flex items-stretch">
        <pre className="flex-1 px-3 py-1.5 font-mono text-[11px] text-slate-700 bg-slate-50 m-0 overflow-x-auto">{snippet}</pre>
        <button
          onClick={() => onCopy(snippet, `lbl-${label.name}`)}
          className="px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l border-slate-200 transition-colors"
        >
          {copied === `lbl-${label.name}` ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function CopyRow({ label, value, copied, onCopy, k }) {
  return (
    <div className="flex items-stretch border border-slate-200 rounded-md overflow-hidden bg-white">
      <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 bg-slate-50 border-r border-slate-200 flex items-center min-w-[110px]">
        {label}
      </div>
      <code className="flex-1 px-3 py-2 font-mono text-[12px] text-slate-800 overflow-x-auto whitespace-nowrap">{value}</code>
      <button
        onClick={() => onCopy(value, k)}
        className="px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l border-slate-200 transition-colors shrink-0"
      >
        {copied === k ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function AnnotateModal({
  task, project, template, currentUser, onClose, onSaveWork, onStatusChange,
}) {
  const [copied, copy] = useCopy()
  const [stagedFiles, setStagedFiles] = useState([])
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const segInputRef = useRef(null)
  const pngInputRef = useRef(null)

  useEffect(() => {
    setAnswers(task?.answers ? { ...task.answers } : {})
    setStagedFiles([])
  }, [task])

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const filenameContext = useMemo(() => {
    if (!task) return null
    return { exam: examById(task.examId), annotator: userById(task.assigneeId) || currentUser, ts: timestampToken() }
  }, [task, currentUser])

  if (!task || !project) return null

  const exam     = examById(task.examId)
  const assignee = userById(task.assigneeId)
  const isManager = currentUser.role === 'manager'
  const isAssigned = task.assigneeId === currentUser.id
  const canWork = isManager || isAssigned          // do the annotation work + save
  const isText  = project.type === 'text'
  const locked  = task.status === 'accepted'       // accepted work is read-only to annotators

  // segmentation snippets
  const labelsBlock = template ? template.labels.map(l => `${l.name}\t${l.color}`).join('\n') : ''
  const screenshotFilename = template ? renderFilename(template.screenshotPattern, filenameContext) : ''
  const segDefaultFilename = template ? segFilename(screenshotFilename) : ''

  const onFilePick = (kind) => (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setStagedFiles(prev => [
      ...prev,
      ...files.map(f => ({ kind, filename: f.name, size: f.size, uploadedAt: new Date().toISOString().slice(0, 10) })),
    ])
    e.target.value = ''
  }
  const removeStaged = (idx) => setStagedFiles(prev => prev.filter((_, i) => i !== idx))

  const answersDirty = isText && JSON.stringify(answers) !== JSON.stringify(task.answers || {})
  const hasWork = stagedFiles.length > 0 || answersDirty

  const handleSave = () => {
    setSaving(true)
    onSaveWork(task.id, {
      addFiles: stagedFiles,
      answers: isText ? answers : null,
    })
    setTimeout(() => { setSaving(false); onClose() }, 150)
  }

  const segCount = stagedFiles.filter(f => f.kind === 'seg').length + task.submissions.filter(f => f.kind === 'seg').length
  const pngCount = stagedFiles.filter(f => f.kind === 'screenshot').length + task.submissions.filter(f => f.kind === 'screenshot').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative w-[920px] max-w-[96vw] max-h-[92vh] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col animate-riseIn">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: project.color }} />
              <span className="label">{project.name}</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 tracking-wide">
                {isText ? 'text' : 'segmentation'}
              </span>
            </div>
            <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">
              {isText ? 'Annotate' : 'Annotate'} subject <span className="font-mono num">{exam.subjectId}</span>
              <span className="text-slate-400 font-normal"> · exam </span>
              <a href={shanoirExamUrl(exam.examId)} target="_blank" rel="noreferrer" className="link num font-mono">#{exam.examId}</a>
            </h3>
            <div className="caption mt-1">
              {exam.date} · {exam.series.length} series · assigned to{' '}
              <span className="text-slate-800">{assignee?.handle || '—'}</span>
              {!canWork && <span className="text-amber-700"> · view only (not your task)</span>}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* ① Instructions */}
          <section>
            <div className="label mb-2">① Instructions</div>
            <pre className="font-sans text-[13px] text-slate-800 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-md px-4 py-3 leading-relaxed">{project.instructions}</pre>
          </section>

          {isText ? (
            /* ───────── TEXT ANNOTATION ───────── */
            <section>
              <div className="label mb-2">② Your annotation</div>
              <div className="space-y-4">
                {project.fields.map(field => (
                  <div key={field.id}>
                    <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-800 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.kind === 'long' ? (
                      <textarea
                        value={answers[field.id] || ''}
                        onChange={e => setAnswers(a => ({ ...a, [field.id]: e.target.value }))}
                        disabled={!canWork || locked}
                        rows={4}
                        placeholder={canWork ? `Write the ${field.label.toLowerCase()}…` : ''}
                        className="field w-full resize-y leading-relaxed disabled:bg-slate-50 disabled:text-slate-500"
                        style={{ height: 'auto', minHeight: '92px' }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={answers[field.id] || ''}
                        onChange={e => setAnswers(a => ({ ...a, [field.id]: e.target.value }))}
                        disabled={!canWork || locked}
                        placeholder={canWork ? `${field.label}…` : ''}
                        className="field w-full disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="caption mt-2">
                Want to view the images while writing?{' '}
                <a href={ohifViewUrl(exam.studyInstanceUID)} target="_blank" rel="noreferrer" className="link">Open OHIF viewer</a>
              </div>
            </section>
          ) : (
            /* ───────── SEGMENTATION ───────── */
            <>
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="label">② Segmentation labels — copy into OHIF</div>
                  <button onClick={() => copy(labelsBlock, 'all-labels')} className="btn btn-sm btn-secondary">
                    {copied === 'all-labels' ? '✓ Copied all' : `Copy all (${template?.labels.length || 0})`}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {template?.labels.map(l => <LabelCard key={l.name} label={l} copied={copied} onCopy={copy} />)}
                </div>
                <div className="caption mt-1.5">
                  Format <code className="font-mono text-slate-700">{`{label}\\t{hex}`}</code> — paste into OHIF's segmentation editor.
                </div>
              </section>

              <section>
                <div className="label mb-2">③ Screenshot &amp; DICOM-SEG file names</div>
                <div className="space-y-2">
                  <CopyRow label="Screenshot" value={screenshotFilename} copied={copied} onCopy={copy} k="ss-name" />
                  <CopyRow label="DICOM-SEG"  value={segDefaultFilename} copied={copied} onCopy={copy} k="seg-name" />
                </div>
                <div className="caption mt-1.5">Use these exact names — username + timestamp keep submissions traceable.</div>
              </section>

              <section>
                <div className="label mb-2">④ Open OHIF</div>
                <div className="flex items-center gap-2">
                  <a
                    href={ohifAnnotateUrl(exam.studyInstanceUID)}
                    target="_blank" rel="noreferrer"
                    className="btn btn-primary"
                  >
                    Open segmentation editor →
                  </a>
                  <a href={ohifViewUrl(exam.studyInstanceUID)} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    View only
                  </a>
                  <span className="caption ml-auto">UID <code className="font-mono text-slate-700">{exam.studyInstanceUID}</code></span>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="label">⑤ Upload annotation files</div>
                  <div className="caption">{segCount} SEG · {pngCount} screenshot</div>
                </div>
                {canWork && !locked && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-dashed border-slate-300 rounded-md p-3 hover:border-brand-600 transition-colors">
                      <div className="text-[13px] font-medium text-slate-900 mb-1">DICOM-SEG (.dcm)</div>
                      <div className="caption mb-2">From OHIF "Download DICOM SEG".</div>
                      <input type="file" ref={segInputRef} accept=".dcm,application/dicom" multiple onChange={onFilePick('seg')} className="hidden" />
                      <button onClick={() => segInputRef.current?.click()} className="btn btn-sm btn-secondary w-full">+ Add DICOM-SEG</button>
                    </div>
                    <div className="border border-dashed border-slate-300 rounded-md p-3 hover:border-brand-600 transition-colors">
                      <div className="text-[13px] font-medium text-slate-900 mb-1">Screenshots (.png / .jpg)</div>
                      <div className="caption mb-2">For visual review. Optional.</div>
                      <input type="file" ref={pngInputRef} accept="image/png,image/jpeg" multiple onChange={onFilePick('screenshot')} className="hidden" />
                      <button onClick={() => pngInputRef.current?.click()} className="btn btn-sm btn-secondary w-full">+ Add screenshots</button>
                    </div>
                  </div>
                )}

                {(task.submissions.length > 0 || stagedFiles.length > 0) && (
                  <div className="mt-3 space-y-1">
                    {task.submissions.map((f, i) => (
                      <div key={`old-${i}`} className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[12px]">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{f.kind === 'seg' ? 'SEG' : 'IMG'}</span>
                        <span className="font-mono text-slate-800 truncate flex-1">{f.filename}</span>
                        <span className="caption num">{formatBytes(f.size)}</span>
                        <span className="caption">· {f.uploadedAt}</span>
                      </div>
                    ))}
                    {stagedFiles.map((f, i) => (
                      <div key={`new-${i}`} className="flex items-center gap-3 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-[12px]">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">{f.kind === 'seg' ? 'SEG' : 'IMG'}</span>
                        <span className="font-mono text-slate-900 truncate flex-1">{f.filename}</span>
                        <span className="caption num">{formatBytes(f.size)}</span>
                        <span className="text-emerald-700 text-[11px] font-medium">staged</span>
                        <button onClick={() => removeStaged(i)} className="text-slate-400 hover:text-red-600 text-sm leading-none">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            {isManager ? (
              <label className="flex items-center gap-2">
                <span className="label">Status</span>
                <select
                  value={task.status}
                  onChange={e => onStatusChange(task.id, e.target.value)}
                  className="select select-arrow field-sm pr-7"
                  style={{ color: STATUS[task.status].bar }}
                >
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s} className="text-slate-900">{STATUS[s].label}</option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="mark">
                <span className="mark-dot" style={{ backgroundColor: STATUS[task.status].bar }} />
                {STATUS[task.status].label}
              </span>
            )}
            <span className="caption">· updated {task.updatedAt}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn btn-ghost">Close</button>
            {canWork && !locked && (
              <button onClick={handleSave} disabled={saving || !hasWork} className="btn btn-primary">
                {saving ? 'Saving…' : isText ? 'Save annotation' : `Save${stagedFiles.length ? ` (${stagedFiles.length})` : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
