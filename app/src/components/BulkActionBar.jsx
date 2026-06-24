import { useState } from 'react'
import { annotators } from '../data/mockData'

export default function BulkActionBar({
  selectedIds, onClear, onAssignAll, onSplitAcross, onDelete,
}) {
  const [open, setOpen] = useState(null) // 'assign' | 'split'
  const [splitChecks, setSplitChecks] = useState(
    Object.fromEntries(annotators().map(a => [a.id, true]))
  )

  if (selectedIds.length === 0) return null

  const splitTargets = Object.entries(splitChecks).filter(([_, on]) => on).map(([id]) => id)
  const perEach = splitTargets.length ? Math.ceil(selectedIds.length / splitTargets.length) : 0
  const close = () => setOpen(null)

  return (
    <div className="card animate-riseIn overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 gap-4 bg-brand-50/40 border-b border-brand-100">
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-semibold text-slate-900 num leading-none">{selectedIds.length}</span>
          <span className="text-[13px] text-slate-600">selected</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            className={`btn btn-sm ${open === 'assign' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOpen(open === 'assign' ? null : 'assign')}
          >
            Assign all
          </button>
          <button
            className={`btn btn-sm ${open === 'split' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOpen(open === 'split' ? null : 'split')}
          >
            Split across
          </button>
          <div className="w-px h-5 bg-slate-300 mx-1" />
          <button className="btn btn-sm btn-danger" onClick={() => { onDelete(); close() }}>
            Remove tasks
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => { onClear(); close() }}>
            Clear
          </button>
        </div>
      </div>

      {open === 'assign' && (
        <div className="px-4 py-3 animate-slideDown border-b border-slate-200">
          <div className="label mb-2">Assign all {selectedIds.length} tasks to one annotator</div>
          <div className="flex flex-wrap gap-1.5">
            {annotators().map(u => (
              <button
                key={u.id}
                onClick={() => { onAssignAll(u.id); close() }}
                className="btn btn-sm btn-secondary"
              >
                <span className={`avatar avatar-sm avatar-${u.tone}`}>{u.initials}</span>
                {u.handle}
              </button>
            ))}
          </div>
        </div>
      )}

      {open === 'split' && (
        <div className="px-4 py-3 animate-slideDown border-b border-slate-200">
          <div className="label mb-2">Distribute {selectedIds.length} tasks across annotators (round-robin)</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 max-w-xl mb-3">
            {annotators().map(u => (
              <label key={u.id} className="flex items-center gap-2.5 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={!!splitChecks[u.id]}
                  onChange={e => setSplitChecks({ ...splitChecks, [u.id]: e.target.checked })}
                />
                <span className={`avatar avatar-sm avatar-${u.tone}`}>{u.initials}</span>
                <span className="text-[13px] text-slate-800">{u.handle}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="caption">
              {splitTargets.length > 0
                ? <>≈ {perEach} task{perEach !== 1 ? 's' : ''} per annotator · {splitTargets.length} annotator{splitTargets.length !== 1 ? 's' : ''}</>
                : <span className="text-red-600">Pick at least one annotator</span>}
            </div>
            <button
              disabled={splitTargets.length === 0}
              onClick={() => { onSplitAcross(splitTargets); close() }}
              className="btn btn-sm btn-primary"
            >
              Apply split
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
