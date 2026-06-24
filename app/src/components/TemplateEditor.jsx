import { useEffect, useState } from 'react'

const blank = () => ({
  id: '',
  name: '',
  color: '#0F766E',
  labels: [{ name: '', color: '#0F766E' }],
  screenshotPattern: '{study}_{exam}_{subject}_{annotator}_{ts}.png',
})

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function TemplateEditor({ open, template, isNew, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(blank())

  useEffect(() => {
    setDraft(template ? { ...template, labels: [...template.labels] } : blank())
  }, [template, open])

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const setLabel = (i, patch) =>
    setDraft(d => ({ ...d, labels: d.labels.map((l, idx) => idx === i ? { ...l, ...patch } : l) }))
  const addLabel = () =>
    setDraft(d => ({ ...d, labels: [...d.labels, { name: '', color: d.color }] }))
  const removeLabel = (i) =>
    setDraft(d => ({ ...d, labels: d.labels.filter((_, idx) => idx !== i) }))

  const canSave =
    draft.name.trim() &&
    draft.labels.length > 0 &&
    draft.labels.every(l => l.name.trim())

  const handleSave = () => {
    const id = draft.id || slugify(draft.name)
    onSave({ ...draft, id, name: draft.name.trim(), labels: draft.labels.map(l => ({ ...l, name: l.name.trim() })) })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative w-[820px] max-w-[94vw] max-h-[90vh] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col animate-riseIn">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="label">Template {isNew ? '· new' : `· ${template?.id}`}</div>
            <h3 className="text-[18px] font-semibold text-slate-900 mt-0.5">
              {isNew ? 'Create template' : `Edit "${template?.name}"`}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name + color */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="label block mb-1.5">Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Tumor + components"
                className="field w-full"
              />
            </div>
            <div>
              <label className="label block mb-1.5">Accent</label>
              <div className="flex items-stretch border border-slate-300 rounded-md overflow-hidden h-[32px]">
                <input
                  type="color"
                  value={draft.color}
                  onChange={e => setField('color', e.target.value)}
                  className="w-10 cursor-pointer border-0"
                  style={{ background: 'none' }}
                />
                <span className="px-2.5 font-mono text-[12px] text-slate-600 flex items-center border-l border-slate-200">
                  {draft.color.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="caption -mt-2">
            A template is a reusable label set. Per-project instructions live on the project.
          </div>

          {/* Labels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label">Labels</label>
              <button onClick={addLabel} className="btn btn-sm btn-secondary">+ Add label</button>
            </div>
            <div className="space-y-2">
              {draft.labels.map((l, i) => (
                <div key={i} className="flex items-stretch gap-2 border border-slate-200 rounded-md p-2">
                  <div className="flex items-stretch border border-slate-300 rounded-md overflow-hidden h-[28px] shrink-0">
                    <input
                      type="color"
                      value={l.color}
                      onChange={e => setLabel(i, { color: e.target.value })}
                      className="w-8 cursor-pointer border-0"
                      style={{ background: 'none' }}
                    />
                    <span className="px-2 font-mono text-[10px] text-slate-600 flex items-center border-l border-slate-200 num">
                      {l.color.toUpperCase()}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={l.name}
                    onChange={e => setLabel(i, { name: e.target.value })}
                    placeholder={`Label ${i + 1} name`}
                    className="field field-sm flex-1"
                  />
                  <button
                    onClick={() => removeLabel(i)}
                    disabled={draft.labels.length <= 1}
                    className="text-slate-400 hover:text-red-600 px-2 disabled:opacity-30"
                    title="Remove label"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot pattern */}
          <div>
            <label className="label block mb-1.5">Screenshot filename pattern</label>
            <input
              type="text"
              value={draft.screenshotPattern}
              onChange={e => setField('screenshotPattern', e.target.value)}
              className="field w-full font-mono text-[12px]"
            />
            <div className="caption mt-1">
              Variables:{' '}
              <code className="font-mono text-slate-700">{'{study}'}</code>{' '}
              <code className="font-mono text-slate-700">{'{exam}'}</code>{' '}
              <code className="font-mono text-slate-700">{'{subject}'}</code>{' '}
              <code className="font-mono text-slate-700">{'{annotator}'}</code>{' '}
              <code className="font-mono text-slate-700">{'{ts}'}</code>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          {!isNew && onDelete ? (
            <button
              onClick={() => { onDelete(template.id); onClose() }}
              className="btn btn-sm btn-danger"
            >
              Delete template
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSave} disabled={!canSave} className="btn btn-primary">
              {isNew ? 'Create template' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
