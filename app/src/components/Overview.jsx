import { STATUS, STATUS_ORDER, isDone } from '../data/mockData'

function DensityRow({ tasks }) {
  const sorted = [...tasks].sort(
    (a, b) => STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status)
  )
  return (
    <div className="h-2 flex border border-slate-200 bg-white rounded-sm overflow-hidden">
      {sorted.map(t => (
        <div
          key={t.id}
          className="density-cell"
          style={{ backgroundColor: STATUS[t.status].bar }}
          title={`#${t.examId} · ${STATUS[t.status].label}`}
        />
      ))}
    </div>
  )
}

export default function Overview({ tasks, totalExams }) {
  const total = tasks.length
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length
    return acc
  }, {})

  const accepted = tasks.filter(t => isDone(t.status)).length
  const pct      = total ? Math.round((accepted / total) * 100) : 0
  const subjects = new Set(tasks.map(t => t.subjectId)).size
  const unassignedExams = totalExams - new Set(tasks.map(t => t.examId)).size

  return (
    <div className="card">
      <div className="flex divide-x divide-slate-200">
        <div className="metric flex-1">
          <div className="metric-label">Accepted</div>
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value text-brand-700">{pct}%</span>
            <span className="caption num">{accepted}/{total}</span>
          </div>
        </div>
        <div className="metric flex-1">
          <div className="metric-label">Submitted</div>
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value">{counts.submitted}</span>
            <span className="caption">awaiting review</span>
          </div>
        </div>
        <div className="metric flex-1">
          <div className="metric-label">In progress</div>
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value">{counts.in_progress}</span>
            <span className="caption">active</span>
          </div>
        </div>
        <div className="metric flex-1">
          <div className="metric-label">Revisions</div>
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value">{counts.revisions}</span>
            <span className="caption">returned</span>
          </div>
        </div>
        <div className="metric flex-1">
          <div className="metric-label">To do</div>
          <div className="flex items-baseline gap-1.5">
            <span className="metric-value">{counts.todo}</span>
            <span className="caption num">{subjects} subj · {unassignedExams} unassigned</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 pt-1">
        <DensityRow tasks={tasks} />
        <div className="flex justify-between items-center mt-1.5">
          <div className="flex items-center gap-3 caption">
            {STATUS_ORDER.map(s => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: STATUS[s].bar }} />
                {STATUS[s].label}
              </span>
            ))}
          </div>
          <span className="caption">1 cell ≈ 1 task</span>
        </div>
      </div>
    </div>
  )
}
