import { useEffect, useState } from 'react'
import { EXAMINATIONS, annotators, examById } from '../data/mockData'

const slugify = (s) => 'p-' + s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24)

const blank = (templates) => ({
  id: '',
  name: '',
  type: 'segmentation',
  color: '#0F766E',
  templateId: templates[0]?.id || '',
  fields: [{ id: 'f1', label: '', kind: 'long', required: true }],
  instructions: '',
  memberIds: [],
  sampleExamIds: [],
  createdAt: new Date().toISOString().slice(0, 10),
})

let _fieldSeq = 100

export default function ProjectEditor({ open, project, isNew, templates, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(blank(templates))

  useEffect(() => {
    if (project) {
      setDraft({
        ...project,
        fields: project.fields ? project.fields.map(f => ({ ...f })) : blank(templates).fields,
        memberIds: [...project.memberIds],
        sampleExamIds: [...project.sampleExamIds],
      })
    } else {
      setDraft(blank(templates))
    }
  }, [project, open, templates])

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const toggleArr = (k, val) => setDraft(d => ({
    ...d,
    [k]: d[k].includes(val) ? d[k].filter(x => x !== val) : [...d[k], val],
  }))

  const setField = (i, patch) => setDraft(d => ({ ...d, fields: d.fields.map((f, idx) => idx === i ? { ...f, ...patch } : f) }))
  const addField = () => setDraft(d => ({ ...d, fields: [...d.fields, { id: `f${++_fieldSeq}`, label: '', kind: 'short', required: false }] }))
  const removeField = (i) => setDraft(d => ({ ...d, fields: d.fields.filter((_, idx) => idx !== i) }))

  const tplColor = templates.find(t => t.id === draft.templateId)?.color

  const canSave =
    draft.name.trim() &&
    draft.memberIds.length > 0 &&
    draft.sampleExamIds.length > 0 &&
    (draft.type === 'segmentation' ? draft.templateId : draft.fields.length > 0 && draft.fields.every(f => f.label.trim()))

  const handleSave = () => {
    const id = draft.id || slugify(draft.name)
    const color = draft.type === 'segmentation' ? (tplColor || draft.color) : draft.color
    const out = {
      id,
      name: draft.name.trim(),
      type: draft.type,
      color,
      instructions: draft.instructions,
      memberIds: draft.memberIds,
      sampleExamIds: draft.sampleExamIds,
      createdAt: draft.createdAt,
      ...(draft.type === 'segmentation'
        ? { templateId: draft.templateId }
        : { fields: draft.fields.map(f => ({ ...f, label: f.label.trim() })) }),
    }
    onSave(out)
    onClose()
  }

  // group examinations by subject for the sample picker
  const subjects = {}
  EXAMINATIONS.forEach(e => { (subjects[e.subjectId] = subjects[e.subjectId] || []).push(e) })

  const taskPreview = draft.sampleExamIds.length * draft.memberIds.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative w-[920px] max-w-[96vw] max-h-[92vh] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col animate-riseIn">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="label">Project {isNew ? '· new' : `· ${project?.id}`}</div>
            <h3 className="text-[18px] font-semibold text-slate-900 mt-0.5">{isNew ? 'Create project' : `Edit "${project?.name}"`}</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 divide-x divide-slate-200">
          {/* LEFT — details */}
          <div className="p-5 space-y-5">
            <div>
              <label className="label block mb-1.5">Name</label>
              <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tumor delineation" className="field w-full" />
            </div>

            <div>
              <label className="label block mb-1.5">Annotation type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => set('type', 'segmentation')}
                  className={`border rounded-md p-3 text-left transition-colors ${draft.type === 'segmentation' ? 'border-brand-600 bg-brand-50' : 'border-slate-300 hover:border-slate-400'}`}
                >
                  <div className="text-[13px] font-medium text-slate-900">Segmentation</div>
                  <div className="caption mt-0.5">Labels + OHIF + DICOM-SEG</div>
                </button>
                <button
                  onClick={() => set('type', 'text')}
                  className={`border rounded-md p-3 text-left transition-colors ${draft.type === 'text' ? 'border-brand-600 bg-brand-50' : 'border-slate-300 hover:border-slate-400'}`}
                >
                  <div className="text-[13px] font-medium text-slate-900">Text</div>
                  <div className="caption mt-0.5">Free-text fields, no OHIF</div>
                </button>
              </div>
            </div>

            {draft.type === 'segmentation' ? (
              <div>
                <label className="label block mb-1.5">Label template</label>
                <select value={draft.templateId} onChange={e => set('templateId', e.target.value)} className="select select-arrow w-full">
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.labels.length} label{t.labels.length !== 1 ? 's' : ''}</option>
                  ))}
                </select>
                {tplColor && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {templates.find(t => t.id === draft.templateId)?.labels.map(l => (
                      <span key={l.name} className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-slate-200 rounded text-[11px] bg-white">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />{l.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Text fields</label>
                  <button onClick={addField} className="btn btn-sm btn-secondary">+ Add field</button>
                </div>
                <div className="space-y-2">
                  {draft.fields.map((f, i) => (
                    <div key={f.id} className="flex items-center gap-2 border border-slate-200 rounded-md p-2">
                      <input
                        type="text" value={f.label} onChange={e => setField(i, { label: e.target.value })}
                        placeholder={`Field ${i + 1} label`} className="field field-sm flex-1"
                      />
                      <select value={f.kind} onChange={e => setField(i, { kind: e.target.value })} className="select select-arrow field-sm pr-6">
                        <option value="short">short</option>
                        <option value="long">long</option>
                      </select>
                      <label className="flex items-center gap-1 caption cursor-pointer">
                        <input type="checkbox" checked={f.required} onChange={e => setField(i, { required: e.target.checked })} />
                        req
                      </label>
                      <button onClick={() => removeField(i)} disabled={draft.fields.length <= 1} className="text-slate-400 hover:text-red-600 px-1 disabled:opacity-30">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label block mb-1.5">Instructions</label>
              <textarea
                value={draft.instructions} onChange={e => set('instructions', e.target.value)} rows={6}
                placeholder="Describe what annotators should do, edge cases, what to exclude…"
                className="field w-full font-sans text-[13px] leading-relaxed resize-y" style={{ minHeight: '130px' }}
              />
            </div>
          </div>

          {/* RIGHT — members + samples */}
          <div className="p-5 space-y-5">
            <div>
              <label className="label block mb-2">Members</label>
              <div className="space-y-1">
                {annotators().map(u => (
                  <label key={u.id} className="flex items-center gap-2.5 cursor-pointer py-1">
                    <input type="checkbox" checked={draft.memberIds.includes(u.id)} onChange={() => toggleArr('memberIds', u.id)} />
                    <span className={`avatar avatar-sm avatar-${u.tone}`}>{u.initials}</span>
                    <span className="text-[13px] text-slate-800">{u.handle}</span>
                    <span className="caption">{u.email}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label block mb-2">Samples (examinations)</label>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {Object.entries(subjects).map(([subjectId, list]) => {
                  const allPicked = list.every(e => draft.sampleExamIds.includes(e.examId))
                  return (
                    <div key={subjectId}>
                      <div className="flex items-baseline justify-between mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="label">Subject</span>
                          <span className="font-mono text-[12px] text-slate-900 num">{subjectId}</span>
                        </div>
                        <button
                          className="caption hover:text-brand-700 hover:underline"
                          onClick={() => setDraft(d => {
                            const ids = list.map(e => e.examId)
                            return { ...d, sampleExamIds: allPicked ? d.sampleExamIds.filter(x => !ids.includes(x)) : Array.from(new Set([...d.sampleExamIds, ...ids])) }
                          })}
                        >
                          {allPicked ? 'Deselect' : 'Select all'}
                        </button>
                      </div>
                      <div className="space-y-1 pl-3 border-l-2 border-slate-100">
                        {list.map(e => (
                          <label key={e.examId} className="flex items-center gap-2 py-0.5 cursor-pointer">
                            <input type="checkbox" checked={draft.sampleExamIds.includes(e.examId)} onChange={() => toggleArr('sampleExamIds', e.examId)} />
                            <span className="font-mono text-[12px] text-slate-800 num">#{e.examId}</span>
                            <span className="caption">{e.date} · {e.series.length} series</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            {!isNew && onDelete ? (
              <button onClick={() => { onDelete(project.id); onClose() }} className="btn btn-sm btn-danger">Delete project</button>
            ) : <span />}
            <span className="caption">
              {canSave
                ? <>Will create up to <span className="font-medium text-slate-900 num">{taskPreview}</span> task{taskPreview !== 1 ? 's' : ''} (samples × members)</>
                : 'Name, ≥1 member, ≥1 sample required'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSave} disabled={!canSave} className="btn btn-primary">{isNew ? 'Create project' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
