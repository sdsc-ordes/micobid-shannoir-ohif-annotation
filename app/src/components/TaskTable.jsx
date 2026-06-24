import { Fragment } from 'react'
import {
  EXAMINATIONS, STATUS,
  examById, userById,
  ohifViewUrl, shanoirExamUrl,
} from '../data/mockData'

const StatusMark = ({ status }) => {
  const m = STATUS[status]
  return (
    <span className="mark">
      <span className="mark-dot" style={{ backgroundColor: m.bar }} />
      <span className="text-slate-700">{m.label}</span>
    </span>
  )
}

const ProjectPip = ({ project }) => {
  if (!project) return <span className="caption italic">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-700">
      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: project.color }} />
      <span className="truncate max-w-[140px]">{project.name}</span>
      <span className="text-[9px] font-mono uppercase px-1 py-px rounded bg-slate-100 text-slate-500">
        {project.type === 'text' ? 'txt' : 'seg'}
      </span>
    </span>
  )
}

function ReplicaStrip({ tasksForExam }) {
  if (tasksForExam.length === 0) return <span className="caption italic">—</span>
  return (
    <span className="inline-flex items-center gap-1">
      {tasksForExam.map(t => {
        const u = userById(t.assigneeId)
        return (
          <span
            key={t.id}
            title={`${u?.handle ?? '?'} · ${STATUS[t.status].label}`}
            className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-medium uppercase rounded-full text-white"
            style={{ backgroundColor: STATUS[t.status].bar }}
          >
            {u?.initials ?? '?'}
          </span>
        )
      })}
    </span>
  )
}

export default function TaskTable({
  tasks, allTasks, currentUser, projectsById,
  selectedIds, onSelect, onSelectAll, onSelectSubject,
  onStatusChange, onUnassign, onReview, onAnnotate,
}) {
  const isManager = currentUser.role === 'manager'

  const grouped = []
  const subjectIndex = {}
  tasks.forEach(t => {
    if (!(t.subjectId in subjectIndex)) {
      subjectIndex[t.subjectId] = grouped.length
      grouped.push({ subjectId: t.subjectId, tasks: [] })
    }
    grouped[subjectIndex[t.subjectId]].tasks.push(t)
  })

  if (tasks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-slate-700 text-[15px] font-medium mb-1">No tasks match the filters</div>
        <div className="caption">Adjust the sidebar filters, or create tasks from the Projects tab.</div>
      </div>
    )
  }

  const allSelected = tasks.length > 0 && tasks.every(t => selectedIds.includes(t.id))

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8 pl-4">
                {isManager && <input type="checkbox" checked={allSelected} onChange={e => onSelectAll(e.target.checked)} />}
              </th>
              <th>Examination</th>
              <th>Date</th>
              <th>Project</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Output</th>
              <th>Replicas</th>
              <th className="text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ subjectId, tasks: rows }) => {
              const subjectExams = EXAMINATIONS.filter(e => e.subjectId === subjectId)
              const allRowsForSubject = allTasks.filter(t => t.subjectId === subjectId)
              const subjectTaskIds = rows.map(r => r.id)
              const subjectAllSelected = subjectTaskIds.length > 0 && subjectTaskIds.every(id => selectedIds.includes(id))

              return (
                <Fragment key={subjectId}>
                  <tr className="group-row">
                    <td colSpan={9} className="pl-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="flex items-baseline gap-2">
                          <span className="label">Subject</span>
                          <span className="font-mono text-[13px] text-slate-900 num">{subjectId}</span>
                          <span className="caption">· {subjectExams.length} exam{subjectExams.length !== 1 ? 's' : ''} · {allRowsForSubject.length} task{allRowsForSubject.length !== 1 ? 's' : ''}</span>
                        </div>
                        {isManager && (
                          <button onClick={() => onSelectSubject(subjectId, !subjectAllSelected)} className="caption hover:text-brand-700 hover:underline">
                            {subjectAllSelected ? 'Deselect subject' : 'Select all in subject'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {rows.map(task => {
                    const exam = examById(task.examId)
                    const u = userById(task.assigneeId)
                    const isSelected = selectedIds.includes(task.id)
                    const isAssigned = task.assigneeId === currentUser.id
                    const replicas = allTasks.filter(t => t.examId === task.examId && t.projectId === task.projectId && t.id !== task.id)
                    const project = projectsById[task.projectId]
                    const isText = project?.type === 'text'
                    const segCount = task.submissions.filter(f => f.kind === 'seg').length
                    const pngCount = task.submissions.filter(f => f.kind === 'screenshot').length
                    const answerCount = Object.values(task.answers || {}).filter(v => v && v.trim()).length

                    return (
                      <tr key={task.id} className={isSelected ? 'selected' : ''}>
                        <td className="pl-4">
                          {isManager && <input type="checkbox" checked={isSelected} onChange={e => onSelect(task.id, e.target.checked)} />}
                        </td>

                        <td>
                          <div className="leading-tight">
                            <div className="flex items-center gap-2">
                              <a href={shanoirExamUrl(task.examId)} target="_blank" rel="noreferrer" className="link num font-mono text-[13px]">#{task.examId}</a>
                              <span className="text-[12px] text-slate-500">· {exam.series.length} series</span>
                            </div>
                            <div className="caption mt-0.5 truncate max-w-[260px]" title={exam.series.join(', ')}>
                              {exam.series.slice(0, 3).join(' · ')}{exam.series.length > 3 && ` · +${exam.series.length - 3}`}
                            </div>
                          </div>
                        </td>

                        <td className="font-mono text-[12px] text-slate-600 num">{exam.date}</td>

                        <td><ProjectPip project={project} /></td>

                        <td>
                          {u ? (
                            <div className="inline-flex items-center gap-2">
                              <span className={`avatar avatar-sm avatar-${u.tone}`}>{u.initials}</span>
                              <span className="text-slate-800 text-[13px]">{u.handle}</span>
                              {isManager && (
                                <button onClick={() => onUnassign(task.id)} title="Remove task" className="ml-1 text-slate-400 hover:text-red-600 text-sm leading-none">✕</button>
                              )}
                            </div>
                          ) : <span className="caption italic">unassigned</span>}
                        </td>

                        {/* Status — manager-only editable */}
                        <td>
                          {isManager ? (
                            <select
                              value={task.status}
                              onChange={e => onStatusChange(task.id, e.target.value)}
                              className="bg-transparent border-none text-[13px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-600/30 rounded px-1 py-0.5"
                              style={{ color: STATUS[task.status].bar }}
                            >
                              {Object.values(STATUS).map(s => (
                                <option key={s.id} value={s.id} className="text-slate-900">{s.label}</option>
                              ))}
                            </select>
                          ) : (
                            <StatusMark status={task.status} />
                          )}
                        </td>

                        {/* Output */}
                        <td>
                          {isText ? (
                            answerCount > 0
                              ? <span className="inline-flex items-center gap-1 text-[12px] text-slate-700"><span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">TXT</span><span className="num">{answerCount}/{project.fields?.length || 0}</span></span>
                              : <span className="caption">—</span>
                          ) : (
                            (segCount + pngCount === 0)
                              ? <span className="caption">—</span>
                              : (
                                <span className="inline-flex items-center gap-2 text-[12px] text-slate-700">
                                  {segCount > 0 && <span className="inline-flex items-center gap-1"><span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">SEG</span><span className="num">{segCount}</span></span>}
                                  {pngCount > 0 && <span className="inline-flex items-center gap-1"><span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">IMG</span><span className="num">{pngCount}</span></span>}
                                </span>
                              )
                          )}
                        </td>

                        <td><ReplicaStrip tasksForExam={replicas} /></td>

                        <td className="pr-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {!isText && (
                              <a href={ohifViewUrl(exam.studyInstanceUID)} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" title="Open OHIF (read-only)">View</a>
                            )}
                            {(isManager || isAssigned) && task.status !== 'accepted' && (
                              <button onClick={() => onAnnotate(task.id)} className="btn btn-sm btn-primary" title="Open the annotation task">
                                {isText ? 'Write' : 'Annotate'}
                              </button>
                            )}
                            {(isManager || isAssigned) && task.status === 'accepted' && (
                              <button onClick={() => onAnnotate(task.id)} className="btn btn-sm btn-ghost">Open</button>
                            )}
                            {isManager && replicas.some(r => r.submissions.length > 0 || Object.keys(r.answers || {}).length > 0) && (
                              <button onClick={() => onReview(task.examId, task.projectId)} className="btn btn-sm btn-secondary" title="Review all submissions for this examination">Review</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
