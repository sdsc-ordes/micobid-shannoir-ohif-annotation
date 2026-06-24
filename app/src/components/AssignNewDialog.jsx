import { useEffect, useState } from 'react'
import { EXAMINATIONS, annotators, examById } from '../data/mockData'

export default function AssignNewDialog({ open, allTasks, templates, onClose, onCreate }) {
  const [picked, setPicked] = useState({})       // examId -> bool
  const [assignees, setAssignees] = useState({}) // userId -> bool
  const [tpl, setTpl] = useState(templates[0]?.id || '')
  const [strategy, setStrategy] = useState('all')

  useEffect(() => {
    if (!open) {
      setPicked({}); setAssignees({}); setTpl(templates[0]?.id || ''); setStrategy('all')
    }
  }, [open, templates])

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  const pickedExams = Object.entries(picked).filter(([, v]) => v).map(([k]) => k)
  const pickedUsers = Object.entries(assignees).filter(([, v]) => v).map(([k]) => k)

  const subjects = {}
  EXAMINATIONS.forEach(e => { (subjects[e.subjectId] = subjects[e.subjectId] || []).push(e) })

  const existingByExam = allTasks.reduce((acc, t) => {
    acc[t.examId] = (acc[t.examId] || 0) + 1
    return acc
  }, {})

  const willCreate = strategy === 'all'
    ? pickedExams.length * pickedUsers.length
    : pickedExams.length

  const canCreate = pickedExams.length > 0 && pickedUsers.length > 0 && tpl

  const handleCreate = () => {
    onCreate({
      examIds: pickedExams,
      assigneeIds: pickedUsers,
      templateId: tpl,
      strategy,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />

      <div className="relative w-[820px] max-w-[94vw] max-h-[88vh] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col animate-riseIn">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="label">New assignments</div>
            <h3 className="text-[18px] font-semibold text-slate-900 mt-0.5">Create annotation tasks</h3>
            <div className="caption mt-1">Pick examinations + annotators + a template.</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 divide-x divide-slate-200">
          {/* EXAMINATIONS */}
          <div className="p-5">
            <div className="label mb-3">① Examinations</div>
            <div className="space-y-3.5">
              {Object.entries(subjects).map(([subjectId, list]) => {
                const allPicked = list.every(e => picked[e.examId])
                return (
                  <div key={subjectId}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="label">Subject</span>
                        <span className="font-mono text-[13px] text-slate-900 num">{subjectId}</span>
                      </div>
                      <button
                        className="caption hover:text-brand-700 hover:underline"
                        onClick={() => {
                          const next = { ...picked }
                          list.forEach(e => { next[e.examId] = !allPicked })
                          setPicked(next)
                        }}
                      >
                        {allPicked ? 'Deselect' : 'Select all'}
                      </button>
                    </div>
                    <div className="space-y-1 pl-3 border-l-2 border-slate-100">
                      {list.map(e => (
                        <label key={e.examId} className="flex items-center gap-2 py-1 cursor-pointer hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={!!picked[e.examId]}
                            onChange={ev => setPicked({ ...picked, [e.examId]: ev.target.checked })}
                          />
                          <span className="font-mono text-[12px] text-slate-800 num">#{e.examId}</span>
                          <span className="caption">
                            {e.date} · {e.series.length} series
                            {existingByExam[e.examId] && ` · ${existingByExam[e.examId]} existing`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ANNOTATORS + STRATEGY + TEMPLATE */}
          <div className="p-5 space-y-5">
            <div>
              <div className="label mb-3">② Annotators</div>
              <div className="space-y-1">
                {annotators().map(u => (
                  <label key={u.id} className="flex items-center gap-2.5 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={!!assignees[u.id]}
                      onChange={e => setAssignees({ ...assignees, [u.id]: e.target.checked })}
                    />
                    <span className={`avatar avatar-sm avatar-${u.tone}`}>{u.initials}</span>
                    <span className="text-[13px] text-slate-800">{u.handle}</span>
                    <span className="caption">{u.email}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="label mb-3">③ Strategy</div>
              <div className="space-y-2">
                <label className="flex items-baseline gap-2.5 cursor-pointer">
                  <input type="radio" checked={strategy === 'all'} onChange={() => setStrategy('all')} className="mt-1" />
                  <div>
                    <div className="text-[13px] text-slate-900">Everyone annotates every examination</div>
                    <div className="caption mt-0.5">N annotators × M exams = N×M tasks (replicas)</div>
                  </div>
                </label>
                <label className="flex items-baseline gap-2.5 cursor-pointer">
                  <input type="radio" checked={strategy === 'split'} onChange={() => setStrategy('split')} className="mt-1" />
                  <div>
                    <div className="text-[13px] text-slate-900">Split across annotators (round-robin)</div>
                    <div className="caption mt-0.5">Each exam goes to one annotator, balanced</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <div className="label mb-2">④ Template</div>
              <select
                value={tpl}
                onChange={e => setTpl(e.target.value)}
                className="select select-arrow w-full"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.labels.length} label{t.labels.length !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="caption">
            {canCreate
              ? <>Will create <span className="font-medium text-slate-900 num">{willCreate}</span> task{willCreate !== 1 ? 's' : ''}</>
              : 'Pick at least one examination and one annotator'}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleCreate} disabled={!canCreate} className="btn btn-primary">
              Create tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
