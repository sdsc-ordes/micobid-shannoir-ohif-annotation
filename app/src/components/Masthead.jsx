import { USERS } from '../data/mockData'

const NAV = [
  { id: 'projects',    label: 'Projects' },
  { id: 'annotations', label: 'Annotations' },
  { id: 'templates',   label: 'Templates' },
]

export default function Masthead({ currentUser, onUserChange, view, onViewChange }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-6 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-brand-700 text-white flex items-center justify-center font-semibold text-[13px]">
          M
        </div>
        <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight">
          MicoBID / Shanoir Annotation Panel
        </h1>
      </div>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1 h-full">
        {NAV.map(item => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative h-full px-3 text-[13px] font-medium transition-colors ${
                active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
              {active && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-brand-700 rounded-t" />}
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <span className="caption hidden sm:inline">Signed in as</span>
        <select
          value={currentUser.id}
          onChange={e => onUserChange(e.target.value)}
          className="select select-arrow field-sm pr-7 min-w-[170px]"
        >
          {USERS.map(u => (
            <option key={u.id} value={u.id}>
              {u.handle} — {u.role}
            </option>
          ))}
        </select>
        <div className={`avatar avatar-${currentUser.tone}`}>{currentUser.initials}</div>
      </div>
    </header>
  )
}
