import { useState } from 'react'
import TemplateEditor from './TemplateEditor'

export default function TemplatesView({ templates, projects, onSave, onDelete, isManager }) {
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)

  const open = (tpl) => { setEditing(tpl); setIsNew(false) }
  const create = () => { setEditing(null); setIsNew(true) }
  const close = () => { setEditing(null); setIsNew(false) }

  const usageCount = (id) => projects.filter(p => p.templateId === id).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 leading-tight">Templates</h2>
          <div className="caption mt-0.5">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
            {!isManager && ' · read-only — only managers can edit'}
          </div>
        </div>
        {isManager && (
          <button onClick={create} className="btn btn-primary">+ New template</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {templates.map(t => {
          const inUse = usageCount(t.id)
          return (
            <article key={t.id} className="card p-4 flex flex-col gap-3">
              <header className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-md shrink-0 border border-slate-200"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-900">{t.name}</h3>
                    <span className="font-mono text-[11px] text-slate-500 truncate">{t.id}</span>
                  </div>
                  <div className="caption mt-0.5">
                    {t.labels.length} label{t.labels.length !== 1 ? 's' : ''} · used in {inUse} project{inUse !== 1 ? 's' : ''}
                  </div>
                </div>
                {isManager && (
                  <button onClick={() => open(t)} className="btn btn-sm btn-secondary">
                    Edit
                  </button>
                )}
              </header>

              {/* Labels preview */}
              <div className="flex flex-wrap gap-1.5">
                {t.labels.map(l => (
                  <span
                    key={l.name}
                    className="inline-flex items-center gap-1.5 px-2 py-1 border border-slate-200 rounded text-[11px] bg-white"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm border border-slate-300"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-slate-800">{l.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 num">{l.color}</span>
                  </span>
                ))}
              </div>

              {/* Instructions preview */}
              <div className="text-[12.5px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-2.5 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">
                {t.instructions || <span className="italic text-slate-400">No instructions yet</span>}
              </div>

              <div className="caption font-mono truncate" title={t.screenshotPattern}>
                ⌘ {t.screenshotPattern}
              </div>
            </article>
          )
        })}
      </div>

      <TemplateEditor
        open={editing !== null || isNew}
        template={editing}
        isNew={isNew}
        onClose={close}
        onSave={onSave}
        onDelete={isManager && !isNew ? onDelete : null}
      />
    </div>
  )
}
