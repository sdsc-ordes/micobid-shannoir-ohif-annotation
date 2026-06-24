import { useEffect, useMemo, useState } from 'react'
import {
  examById, userById, STATUS, STATUS_ORDER, isDone,
  ohifViewUrl, ohifAnnotateUrl, shanoirExamUrl, formatBytes,
} from '../data/mockData'
import ProjectEditor from './ProjectEditor'

/* ── shared atoms ─────────────────────────────────────────────────────── */

function Chevron({ open }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}>
      <path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniBar({ tasks, className = '' }) {
  if (!tasks.length) return <div className={`h-1.5 bg-slate-100 rounded-sm ${className}`} />
  const sorted = [...tasks].sort((a, b) => STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status))
  return (
    <div className={`h-1.5 flex rounded-sm overflow-hidden bg-slate-100 ${className}`}>
      {sorted.map(t => <div key={t.id} className="flex-1" style={{ backgroundColor: STATUS[t.status].bar }} title={STATUS[t.status].label} />)}
    </div>
  )
}

const StatusMark = ({ status, sm }) => (
  <span className={`mark ${sm ? 'text-[11px]' : ''}`}>
    <span className="mark-dot" style={{ backgroundColor: STATUS[status].bar }} />
    <span className="text-slate-700">{STATUS[status].label}</span>
  </span>
)

const pct = (tasks) => tasks.length ? Math.round(tasks.filter(t => isDone(t.status)).length / tasks.length * 100) : 0

/* ── pane 1 — tree nav ─────────────────────────────────────────────────── */

function TreePane({ projects, tasksOf, selectedProjectId, selectedTaskId, onSelectProject, onSelectTask, collapsed, onExpand }) {
  const [expanded, setExpanded] = useState(() => new Set())
  const [expandedSamples, setExpandedSamples] = useState(() => new Set())

  const toggle = (set, setSet, id) => {
    const next = new Set(set); next.has(id) ? next.delete(id) : next.add(id); setSet(next)
  }

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-2">
        <button onClick={onExpand} title="Expand outline" className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <svg width="13" height="13" viewBox="0 0 14 14"><path d="M2 3h6M2 7h10M2 11h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
        <div className="w-6 border-t border-slate-200" />
        {projects.map(p => (
          <button key={p.id} onClick={() => onSelectProject(p.id)} title={p.name}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-bold transition-transform hover:scale-105 ${p.id === selectedProjectId ? 'ring-2 ring-offset-1 ring-brand-600' : ''}`}
            style={{ backgroundColor: p.color }}>
            {p.type === 'text' ? 'T' : 'S'}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="w-56 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
      <div className="label px-3 pt-4 pb-2">Outline</div>
      <div className="pb-4">
        {projects.map(p => {
          const pTasks = tasksOf(p.id)
          const open = expanded.has(p.id)
          const isSel = p.id === selectedProjectId
          return (
            <div key={p.id}>
              <div className={`flex items-center gap-1.5 px-2 py-1.5 mx-1 rounded cursor-pointer text-[12.5px] ${isSel ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-50 text-slate-700'}`}>
                <button onClick={() => toggle(expanded, setExpanded, p.id)} className="text-slate-400 p-0.5"><Chevron open={open} /></button>
                <button onClick={() => onSelectProject(p.id)} className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="ml-auto text-[10px] tabular-nums text-slate-400">{pTasks.length}</span>
                </button>
              </div>

              {open && p.sampleExamIds.map(examId => {
                const exam = examById(examId)
                const sTasks = pTasks.filter(t => t.examId === examId)
                const sOpen = expandedSamples.has(p.id + examId)
                return (
                  <div key={examId}>
                    <div className="flex items-center gap-1.5 pl-7 pr-2 py-1 mx-1 rounded hover:bg-slate-50 text-[12px] text-slate-600 cursor-pointer">
                      <button onClick={() => toggle(expandedSamples, setExpandedSamples, p.id + examId)} className="text-slate-400 p-0.5"><Chevron open={sOpen} /></button>
                      <span className="font-mono num">#{examId}</span>
                      <span className="text-slate-400 truncate">{exam.subjectId}</span>
                      <span className="ml-auto"><MiniBar tasks={sTasks} className="w-8" /></span>
                    </div>
                    {sOpen && sTasks.map(t => {
                      const u = userById(t.assigneeId)
                      return (
                        <button
                          key={t.id}
                          onClick={() => onSelectTask(p.id, t.id)}
                          className={`flex items-center gap-2 pl-12 pr-2 py-1 mx-1 rounded w-[calc(100%-0.5rem)] text-left text-[12px] ${t.id === selectedTaskId ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="mark-dot" style={{ backgroundColor: STATUS[t.status].bar }} />
                          <span className={`avatar avatar-sm avatar-${u?.tone}`} style={{ width: 16, height: 16, fontSize: 8 }}>{u?.initials}</span>
                          <span className="truncate">{u?.handle}</span>
                        </button>
                      )
                    })}
                    {sOpen && sTasks.length === 0 && <div className="pl-12 py-1 caption italic">no tasks</div>}
                  </div>
                )
              })}
            </div>
          )
        })}
        {projects.length === 0 && <div className="px-3 caption italic">No projects</div>}
      </div>
    </div>
  )
}

/* ── pane 2 — project browser (list / card) ────────────────────────────── */

function ProjectBrowser({ projects, tasksOf, selectedProjectId, onSelect, isManager, onNew, collapsed, onExpand }) {
  const [mode, setMode] = useState('card') // 'card' | 'list'

  if (collapsed) {
    return (
      <div className="w-14 shrink-0 bg-slate-50/40 border-r border-slate-200 flex flex-col items-center py-3 gap-2 overflow-y-auto">
        <button onClick={onExpand} title="Expand projects" className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <svg width="13" height="13" viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor"/></svg>
        </button>
        <div className="w-7 border-t border-slate-200" />
        {projects.map(p => {
          const t = tasksOf(p.id)
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} title={`${p.name} · ${pct(t)}%`}
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-white text-[9px] font-bold transition-transform hover:scale-105 ${p.id === selectedProjectId ? 'ring-2 ring-offset-1 ring-brand-600' : ''}`}
              style={{ backgroundColor: p.color }}>
              {p.type === 'text' ? 'TXT' : 'SEG'}
              <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-full px-1 leading-tight num">{pct(t)}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-72 shrink-0 bg-slate-50/40 border-r border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-white">
        <span className="label">Projects · {projects.length}</span>
        <div className="flex items-center gap-1">
          <div className="flex border border-slate-300 rounded overflow-hidden">
            <button onClick={() => setMode('card')} title="Cards"
              className={`px-1.5 py-1 ${mode === 'card' ? 'bg-brand-700 text-white' : 'bg-white text-slate-500 hover:text-slate-800'}`}>
              <svg width="13" height="13" viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor"/></svg>
            </button>
            <button onClick={() => setMode('list')} title="List"
              className={`px-1.5 py-1 border-l border-slate-300 ${mode === 'list' ? 'bg-brand-700 text-white' : 'bg-white text-slate-500 hover:text-slate-800'}`}>
              <svg width="13" height="13" viewBox="0 0 14 14"><rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor"/><rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor"/><rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
      </div>

      {isManager && (
        <div className="px-3 py-2 border-b border-slate-200 bg-white">
          <button onClick={onNew} className="btn btn-sm btn-primary w-full">+ New project</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {projects.map(p => {
          const t = tasksOf(p.id)
          const sel = p.id === selectedProjectId
          if (mode === 'list') {
            return (
              <button key={p.id} onClick={() => onSelect(p.id)}
                className={`w-full text-left px-2.5 py-2 rounded-md border transition-colors ${sel ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-[13px] font-medium text-slate-900 truncate flex-1">{p.name}</span>
                  <span className="text-[11px] font-semibold text-brand-700 num">{pct(t)}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <MiniBar tasks={t} className="flex-1" />
                  <span className="caption num">{t.length}</span>
                </div>
              </button>
            )
          }
          return (
            <button key={p.id} onClick={() => onSelect(p.id)}
              className={`w-full text-left p-3 rounded-md border transition-colors ${sel ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center" style={{ backgroundColor: p.color }}>
                  <span className="text-white text-[9px] font-bold">{p.type === 'text' ? 'TXT' : 'SEG'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-slate-900 leading-tight">{p.name}</div>
                  <div className="caption mt-0.5">{p.sampleExamIds.length} samples · {p.memberIds.length} annotators</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <MiniBar tasks={t} className="flex-1" />
                <span className="text-[11px] font-semibold text-brand-700 num">{pct(t)}%</span>
              </div>
              <div className="flex items-center -space-x-1.5 mt-2">
                {p.memberIds.map(id => { const u = userById(id); return <span key={id} className={`avatar avatar-sm avatar-${u?.tone} ring-2 ring-white`} title={u?.handle}>{u?.initials}</span> })}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── pane 3 — task list of the selected project ────────────────────────── */

function TaskListPane({ project, tasks, selectedTaskId, onSelectTask, isManager, onEdit }) {
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-center">
        <div>
          <div className="text-slate-500 text-[14px] font-medium">Select a project</div>
          <div className="caption mt-1">Pick a project from the tree or the list to see its tasks.</div>
        </div>
      </div>
    )
  }

  // group by sample
  const bySample = {}
  project.sampleExamIds.forEach(id => { bySample[id] = [] })
  tasks.forEach(t => { (bySample[t.examId] = bySample[t.examId] || []).push(t) })

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: project.color }} />
            <h2 className="text-[15px] font-semibold text-slate-900 truncate">{project.name}</h2>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{project.type === 'text' ? 'text' : 'seg'}</span>
          </div>
          <div className="caption mt-0.5">{tasks.length} tasks · {pct(tasks)}% accepted</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-28"><MiniBar tasks={tasks} /></div>
          {isManager && <button onClick={() => onEdit(project)} className="btn btn-sm btn-secondary">Edit</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {project.sampleExamIds.map(examId => {
          const exam = examById(examId)
          const sTasks = bySample[examId] || []
          return (
            <div key={examId}>
              <div className="flex items-center gap-2 px-1 mb-1.5">
                <a href={shanoirExamUrl(examId)} target="_blank" rel="noreferrer" className="link num font-mono text-[12px]">#{examId}</a>
                <span className="caption">subj {exam.subjectId} · {exam.date} · {exam.series.length} series</span>
                <div className="flex-1" />
                <span className="caption num">{sTasks.filter(t => isDone(t.status)).length}/{sTasks.length} done</span>
              </div>
              <div className="space-y-1">
                {sTasks.length === 0 && <div className="caption italic px-1 py-1.5">no tasks for this sample</div>}
                {sTasks.map(t => {
                  const u = userById(t.assigneeId)
                  const sel = t.id === selectedTaskId
                  const isText = project.type === 'text'
                  const answers = Object.values(t.answers || {}).filter(v => v && v.trim()).length
                  return (
                    <button key={t.id} onClick={() => onSelectTask(t.id)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md border transition-colors ${sel ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <span className={`avatar avatar-sm avatar-${u?.tone}`}>{u?.initials}</span>
                      <span className="text-[13px] text-slate-800 w-28 truncate">{u?.handle}</span>
                      <StatusMark status={t.status} />
                      <span className="caption ml-auto">
                        {isText ? `${answers}/${project.fields?.length || 0} fields`
                                : (t.submissions.length ? `${t.submissions.length} file${t.submissions.length !== 1 ? 's' : ''}` : '—')}
                      </span>
                      <span className="text-slate-300">›</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── pane 4 — preview of the selected task (or project overview) ───────── */

function PreviewPane({ project, template, task, currentUser, onOpenEditor, onStatusChange, onClose }) {
  const isManager = currentUser.role === 'manager'

  if (!project) return <div className="w-[380px] shrink-0 border-l border-slate-200 bg-white" />

  // project overview when no task selected
  if (!task) {
    return (
      <div className="w-[380px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="label">Project overview</div>
          <h3 className="text-[15px] font-semibold text-slate-900 mt-0.5">{project.name}</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="label mb-1.5">Instructions</div>
            <div className="text-[12.5px] text-slate-700 whitespace-pre-wrap leading-relaxed">{project.instructions || <span className="italic text-slate-400">None</span>}</div>
          </div>
          {project.type === 'text' && project.fields && (
            <div>
              <div className="label mb-1.5">Fields</div>
              <div className="flex flex-wrap gap-1.5">
                {project.fields.map(f => (
                  <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 border border-slate-200 rounded bg-white text-[11px] text-slate-700">
                    {f.label}{f.required && <span className="text-red-500">*</span>}<span className="caption">· {f.kind}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {project.type === 'segmentation' && template && (
            <div>
              <div className="label mb-1.5">Labels · {template.name}</div>
              <div className="flex flex-wrap gap-1.5">
                {template.labels.map(l => (
                  <span key={l.name} className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-slate-200 rounded text-[11px] bg-white">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />{l.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="caption pt-2 border-t border-slate-100">Select a task to preview its data.</div>
        </div>
      </div>
    )
  }

  const exam = examById(task.examId)
  const u = userById(task.assigneeId)
  const isText = project.type === 'text'
  const segs = task.submissions.filter(f => f.kind === 'seg')
  const pngs = task.submissions.filter(f => f.kind === 'screenshot')

  return (
    <div className="w-[380px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="label">Preview</div>
            <h3 className="text-[15px] font-semibold text-slate-900 mt-0.5 leading-tight">
              <span className="font-mono num">#{task.examId}</span> · subj {exam.subjectId}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`avatar avatar-sm avatar-${u?.tone}`}>{u?.initials}</span>
          <span className="text-[12px] text-slate-700">{u?.handle}</span>
          <span className="ml-auto"><StatusMark status={task.status} sm /></span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4 flex-1">
        {/* data preview */}
        {isText ? (
          <div className="space-y-2.5">
            {project.fields.map(f => (
              <div key={f.id}>
                <div className="label mb-0.5">{f.label}</div>
                <div className="text-[12.5px] text-slate-800 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded px-3 py-2 leading-relaxed">
                  {task.answers?.[f.id]?.trim() || <span className="italic text-slate-400">— empty —</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* screenshot thumbnails (placeholder) */}
            <div>
              <div className="label mb-1.5">Screenshots</div>
              {pngs.length === 0 ? <div className="caption italic">No screenshots uploaded.</div> : (
                <div className="grid grid-cols-2 gap-2">
                  {pngs.map((f, i) => (
                    <div key={i} className="border border-slate-200 rounded overflow-hidden">
                      <div className="aspect-square bg-slate-900 flex items-center justify-center text-slate-500">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5L5 19"/></svg>
                      </div>
                      <div className="px-1.5 py-1 caption font-mono truncate" title={f.filename}>{f.filename}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* DICOM-SEG files */}
            <div>
              <div className="label mb-1.5">DICOM-SEG</div>
              {segs.length === 0 ? <div className="caption italic">No segmentation uploaded.</div> : (
                <div className="space-y-1">
                  {segs.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px]">
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">SEG</span>
                      <span className="font-mono text-slate-800 truncate flex-1" title={f.filename}>{f.filename}</span>
                      <span className="caption num shrink-0">{formatBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a href={ohifViewUrl(exam.studyInstanceUID)} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">View in OHIF</a>
              <a href={ohifAnnotateUrl(exam.studyInstanceUID)} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">Editor</a>
            </div>
          </>
        )}
      </div>

      {/* actions */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
        {isManager && (
          <div className="flex items-center gap-2">
            <span className="label">Status</span>
            <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)}
              className="select select-arrow field-sm pr-7 flex-1" style={{ color: STATUS[task.status].bar }}>
              {STATUS_ORDER.map(s => <option key={s} value={s} className="text-slate-900">{STATUS[s].label}</option>)}
            </select>
          </div>
        )}
        {task.status !== 'accepted' && (
          <button onClick={() => onOpenEditor(task.id)} className="btn btn-primary w-full">
            {isText ? 'Open writing editor' : 'Open annotation task'}
          </button>
        )}
        {task.status === 'accepted' && (
          <button onClick={() => onOpenEditor(task.id)} className="btn btn-secondary w-full">View task</button>
        )}
      </div>
    </div>
  )
}

/* ── workspace ─────────────────────────────────────────────────────────── */

export default function ProjectsWorkspace({
  projects, tasks, templates, templatesById, currentUser,
  onSaveProject, onDeleteProject, onAnnotate, onStatusChange,
}) {
  const isManager = currentUser.role === 'manager'
  const visible = isManager ? projects : projects.filter(p => p.memberIds.includes(currentUser.id))

  const tasksOf = (projectId) => tasks.filter(t =>
    t.projectId === projectId && (isManager || t.assigneeId === currentUser.id)
  )

  const [selectedProjectId, setSelectedProjectId] = useState(visible[0]?.id || null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  // progressive collapse: opening a deeper panel collapses the rails to its left.
  // a manual "pin" peeks a rail back open until the next deeper selection.
  const [treePinned, setTreePinned] = useState(false)
  const [browserPinned, setBrowserPinned] = useState(false)

  // keep selection valid as data changes
  useEffect(() => {
    if (!visible.find(p => p.id === selectedProjectId)) {
      setSelectedProjectId(visible[0]?.id || null)
      setSelectedTaskId(null)
    }
  }, [visible, selectedProjectId])

  const project = visible.find(p => p.id === selectedProjectId) || null
  const projectTasks = project ? tasksOf(project.id) : []
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const template = project?.type === 'segmentation' ? templatesById[project.templateId] : null

  // selecting a project opens the task panel → collapse the tree rail
  const selectProject = (id) => { setSelectedProjectId(id); setSelectedTaskId(null); setTreePinned(false) }
  // selecting a task opens the preview panel → collapse the project rail too
  const selectTaskInProject = (taskId) => { setSelectedTaskId(taskId); setBrowserPinned(false) }
  const selectTaskFromTree = (projectId, taskId) => { setSelectedProjectId(projectId); setSelectedTaskId(taskId); setTreePinned(false); setBrowserPinned(false) }

  const treeCollapsed    = !!selectedProjectId && !treePinned
  const browserCollapsed = !!selectedTask && !browserPinned

  const openNew = () => { setEditing(null); setIsNew(true) }
  const openEdit = (p) => { setEditing(p); setIsNew(false) }
  const closeEditor = () => { setEditing(null); setIsNew(false) }

  return (
    <div className="flex flex-1 min-h-0">
      <TreePane
        projects={visible}
        tasksOf={tasksOf}
        selectedProjectId={selectedProjectId}
        selectedTaskId={selectedTaskId}
        onSelectProject={selectProject}
        onSelectTask={selectTaskFromTree}
        collapsed={treeCollapsed}
        onExpand={() => setTreePinned(true)}
      />
      <ProjectBrowser
        projects={visible}
        tasksOf={tasksOf}
        selectedProjectId={selectedProjectId}
        onSelect={selectProject}
        isManager={isManager}
        onNew={openNew}
        collapsed={browserCollapsed}
        onExpand={() => setBrowserPinned(true)}
      />
      <TaskListPane
        project={project}
        tasks={projectTasks}
        selectedTaskId={selectedTaskId}
        onSelectTask={selectTaskInProject}
        isManager={isManager}
        onEdit={openEdit}
      />
      <PreviewPane
        project={project}
        template={template}
        task={selectedTask}
        currentUser={currentUser}
        onOpenEditor={onAnnotate}
        onStatusChange={onStatusChange}
        onClose={() => setSelectedTaskId(null)}
      />

      <ProjectEditor
        open={editing !== null || isNew}
        project={editing}
        isNew={isNew}
        templates={templates}
        onClose={closeEditor}
        onSave={onSaveProject}
        onDelete={isManager && !isNew ? onDeleteProject : null}
      />
    </div>
  )
}
