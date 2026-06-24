import { useEffect } from 'react'
import {
  examById, userById, STATUS,
  ohifAnnotateUrl, ohifViewUrl, shanoirExamUrl, formatBytes,
} from '../data/mockData'

export default function ReviewDrawer({ review, allTasks, projectsById, onClose, onStatusChange }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  if (!review) return null

  const { examId, projectId } = review
  const exam    = examById(examId)
  const project = projectsById[projectId]
  const isText  = project?.type === 'text'
  const tasks   = allTasks.filter(t => t.examId === examId && t.projectId === projectId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />

      <div className="relative w-[680px] max-w-[94vw] bg-white border-l border-slate-200 shadow-xl overflow-y-auto animate-riseIn">
        <div className="px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: project?.color }} />
                <div className="label">Review · {project?.name}</div>
              </div>
              <h3 className="text-[18px] font-semibold text-slate-900 mt-0.5">Compare annotations</h3>
              <div className="caption mt-1">
                Subject <span className="font-mono text-slate-700 num">{exam.subjectId}</span>
                {' · '}
                <a href={shanoirExamUrl(examId)} target="_blank" rel="noreferrer" className="link num">exam #{examId}</a>
                {' · '}{exam.date} · {exam.series.length} series
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
          </div>

          {!isText && (
            <div className="mt-4 flex items-center gap-2">
              <a href={ohifViewUrl(exam.studyInstanceUID)} target="_blank" rel="noreferrer" className="btn btn-primary">View in OHIF</a>
              <a href={ohifAnnotateUrl(exam.studyInstanceUID)} target="_blank" rel="noreferrer" className="btn btn-secondary">Segmentation editor</a>
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-3">
          {tasks.length === 0 && <div className="caption">No annotators assigned.</div>}

          {tasks.map(t => {
            const u = userById(t.assigneeId)
            const s = STATUS[t.status]
            const segs = t.submissions.filter(f => f.kind === 'seg')
            const pngs = t.submissions.filter(f => f.kind === 'screenshot')
            return (
              <article key={t.id} className="card p-4">
                <header className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`avatar avatar-${u?.tone || 'ink'}`}>{u?.initials || '?'}</span>
                    <div className="leading-tight">
                      <div className="text-[13px] font-medium text-slate-900">{u?.handle}</div>
                      <div className="caption">{u?.role} · updated {t.updatedAt}</div>
                    </div>
                  </div>
                  <span className="mark"><span className="mark-dot" style={{ backgroundColor: s.bar }} />{s.label}</span>
                </header>

                {isText ? (
                  /* text answers */
                  Object.values(t.answers || {}).some(v => v && v.trim()) ? (
                    <div className="space-y-2.5 mb-3">
                      {project.fields.map(f => (
                        <div key={f.id}>
                          <div className="label mb-0.5">{f.label}</div>
                          <div className="text-[13px] text-slate-800 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded px-3 py-2 leading-relaxed">
                            {t.answers?.[f.id]?.trim() || <span className="italic text-slate-400">— empty —</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="caption italic mb-3">No answers yet.</div>
                ) : (
                  /* seg files */
                  t.submissions.length === 0 ? <div className="caption italic mb-3">No files uploaded yet.</div> : (
                    <div className="space-y-1 mb-3">
                      {[...segs, ...pngs].map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11.5px]">
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{f.kind === 'seg' ? 'SEG' : 'IMG'}</span>
                          <span className="font-mono text-slate-800 truncate flex-1">{f.filename}</span>
                          <span className="caption num">{formatBytes(f.size)}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  {t.status === 'submitted' && (
                    <>
                      <button className="btn btn-sm btn-secondary" onClick={() => onStatusChange(t.id, 'accepted')}>✓ Accept</button>
                      <button className="btn btn-sm btn-danger" onClick={() => onStatusChange(t.id, 'revisions')}>Request revisions</button>
                    </>
                  )}
                  {t.status === 'accepted'  && <span className="caption text-emerald-700">✓ Accepted</span>}
                  {t.status === 'revisions' && <span className="caption text-red-700">Revisions requested</span>}
                  {(t.status === 'todo' || t.status === 'in_progress') && (
                    <button className="btn btn-sm btn-secondary" onClick={() => onStatusChange(t.id, 'submitted')}>Mark submitted</button>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <div className="px-6 py-3 caption border-t border-slate-200">esc to close</div>
      </div>
    </div>
  )
}
