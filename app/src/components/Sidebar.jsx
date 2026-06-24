import { STATUS, STATUS_ORDER, USERS } from '../data/mockData'

const Item = ({ active, onClick, children, count }) => (
  <button onClick={onClick} className={`rail-item ${active ? 'active' : ''}`}>
    <span className="flex items-center gap-2 min-w-0">{children}</span>
    {count !== undefined && <span className="count">{count}</span>}
  </button>
)

export default function Sidebar({ tasks, currentUser, projects, filters, onFilterChange }) {
  const isManager = currentUser.role === 'manager'
  const countBy = (predicate) => tasks.filter(predicate).length

  const setFilter = (key, value) =>
    onFilterChange({ ...filters, [key]: filters[key] === value ? null : value })

  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id)

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 px-3 py-4 overflow-y-auto">
      <div className="rail-section">
        <div className="label px-2 mb-2">Scope</div>
        <Item active={!filters.mineOnly} onClick={() => onFilterChange({ ...filters, mineOnly: false })} count={tasks.length}>
          All annotations
        </Item>
        {!isManager && (
          <Item active={filters.mineOnly} onClick={() => onFilterChange({ ...filters, mineOnly: true })} count={myTasks.length}>
            My queue
          </Item>
        )}
      </div>

      <div className="rail-section">
        <div className="label px-2 mb-2">Project</div>
        {projects.map(p => {
          const n = countBy(t => t.projectId === p.id)
          if (n === 0 && !isManager) return null
          return (
            <Item key={p.id} active={filters.project === p.id} onClick={() => setFilter('project', p.id)} count={n}>
              <span className="mark-dot" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
            </Item>
          )
        })}
      </div>

      <div className="rail-section">
        <div className="label px-2 mb-2">Status</div>
        {STATUS_ORDER.map(s => {
          const meta = STATUS[s]
          return (
            <Item key={s} active={filters.status === s} onClick={() => setFilter('status', s)} count={countBy(t => t.status === s)}>
              <span className="mark-dot" style={{ backgroundColor: meta.bar }} />
              {meta.label}
            </Item>
          )
        })}
      </div>

      {isManager && (
        <div className="rail-section">
          <div className="label px-2 mb-2">Annotator</div>
          {USERS.filter(u => u.role === 'annotator').map(u => (
            <Item key={u.id} active={filters.assignee === u.id} onClick={() => setFilter('assignee', u.id)} count={countBy(t => t.assigneeId === u.id)}>
              <span className={`avatar avatar-sm avatar-${u.tone}`}>{u.initials}</span>
              <span className="truncate">{u.handle}</span>
            </Item>
          ))}
        </div>
      )}

      <div className="px-2 caption mt-2 leading-relaxed">
        v0.6 · CIBM<br />
        <span className="text-slate-400">Mock data — no PHI</span>
      </div>
    </aside>
  )
}
