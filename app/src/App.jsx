import { useMemo, useState } from 'react'
import {
  USERS, EXAMINATIONS, INITIAL_TASKS, SEED_TEMPLATES, SEED_PROJECTS,
  examById,
} from './data/mockData'

import Masthead      from './components/Masthead'
import Sidebar       from './components/Sidebar'
import Overview      from './components/Overview'
import TaskTable     from './components/TaskTable'
import BulkActionBar from './components/BulkActionBar'
import ReviewDrawer  from './components/ReviewDrawer'
import AnnotateModal from './components/AnnotateModal'
import TemplatesView from './components/TemplatesView'
import ProjectsWorkspace from './components/ProjectsWorkspace'

let _nextTaskId = 1000
const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const [tasks, setTasks]         = useState(INITIAL_TASKS)
  const [templates, setTemplates] = useState(SEED_TEMPLATES)
  const [projects, setProjects]   = useState(SEED_PROJECTS)
  const [currentUserId, setCurrentUserId] = useState('u1')
  const [view, setView]           = useState('projects')
  const [selectedIds, setSelectedIds] = useState([])
  const [filters, setFilters] = useState({
    mineOnly: false, status: null, assignee: null, project: null, search: '',
  })
  const [review, setReview]               = useState(null)   // { examId, projectId }
  const [annotateTaskId, setAnnotateTaskId] = useState(null)

  const currentUser   = USERS.find(u => u.id === currentUserId)
  const templatesById = useMemo(() => Object.fromEntries(templates.map(t => [t.id, t])), [templates])
  const projectsById  = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects])

  const baseTasks = useMemo(() => {
    if (currentUser.role === 'annotator') return tasks.filter(t => t.assigneeId === currentUser.id)
    return tasks
  }, [tasks, currentUser])

  const filtered = useMemo(() => baseTasks.filter(t => {
    if (filters.mineOnly && t.assigneeId !== currentUser.id) return false
    if (filters.status && t.status !== filters.status) return false
    if (filters.assignee && t.assigneeId !== filters.assignee) return false
    if (filters.project && t.projectId !== filters.project) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const e = examById(t.examId)
      if (!`${e.series.join(' ')} ${t.subjectId} ${t.examId}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [baseTasks, filters, currentUser])

  // ─── selection ─────────────────────────────────────────────────────────
  const handleSelect = (id, on) => setSelectedIds(prev => on ? [...prev, id] : prev.filter(x => x !== id))
  const handleSelectAll = (on) => setSelectedIds(on ? filtered.map(t => t.id) : [])
  const handleSelectSubject = (subjectId, on) => {
    const ids = filtered.filter(t => t.subjectId === subjectId).map(t => t.id)
    setSelectedIds(prev => on ? Array.from(new Set([...prev, ...ids])) : prev.filter(id => !ids.includes(id)))
  }
  const clearSelection = () => setSelectedIds([])

  // ─── task mutations (manager) ──────────────────────────────────────────
  const updateTask = (id, patch) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  const handleStatusChange = (id, status) => updateTask(id, { status, updatedAt: today() })

  const handleAssignAll = (userId) => {
    setTasks(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, assigneeId: userId, updatedAt: today() } : t))
    clearSelection()
  }
  const handleSplitAcross = (userIds) => {
    if (!userIds.length) return
    setTasks(prev => { let i = 0; return prev.map(t => {
      if (!selectedIds.includes(t.id)) return t
      const a = userIds[i % userIds.length]; i++
      return { ...t, assigneeId: a, updatedAt: today() }
    }) })
    clearSelection()
  }
  const handleBulkRemove = () => { setTasks(prev => prev.filter(t => !selectedIds.includes(t.id))); clearSelection() }
  const handleUnassign = (id) => setTasks(prev => prev.filter(t => t.id !== id))

  // ─── annotation work (annotator or manager) ─────────────────────────────
  // Saves files / text answers. Never changes status to submitted — that is
  // a manager action (per requirements). Bumps todo → in_progress on first work.
  const handleSaveWork = (taskId, { addFiles = [], answers = null } = {}) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const submissions = addFiles.length ? [...t.submissions, ...addFiles] : t.submissions
      const nextAnswers = answers !== null ? answers : t.answers
      const status = t.status === 'todo' ? 'in_progress' : t.status
      return { ...t, submissions, answers: nextAnswers, status, updatedAt: today() }
    }))
  }

  // ─── projects ────────────────────────────────────────────────────────────
  const reconcileTasks = (project) => {
    setTasks(prev => {
      const others = prev.filter(t => t.projectId !== project.id)
      const mine   = prev.filter(t => t.projectId === project.id)

      // keep existing valid combos; drop tasks whose member/sample was removed AND has no work
      const kept = mine.filter(t => {
        const valid = project.memberIds.includes(t.assigneeId) && project.sampleExamIds.includes(t.examId)
        const hasWork = t.submissions.length > 0 || Object.values(t.answers || {}).some(v => v && v.trim())
        return valid || hasWork
      })

      const existing = new Set(kept.map(t => `${t.examId}:${t.assigneeId}`))
      const created = []
      project.sampleExamIds.forEach(examId => {
        const e = examById(examId)
        project.memberIds.forEach(uid => {
          if (existing.has(`${examId}:${uid}`)) return
          created.push({
            id: `n${++_nextTaskId}`,
            projectId: project.id,
            examId, subjectId: e.subjectId, assigneeId: uid,
            status: 'todo', submissions: [], answers: {}, updatedAt: today(), notes: '',
          })
        })
      })
      return [...others, ...kept, ...created]
    })
  }

  const handleSaveProject = (project) => {
    setProjects(prev => {
      const i = prev.findIndex(p => p.id === project.id)
      if (i >= 0) return prev.map((p, idx) => idx === i ? project : p)
      return [...prev, project]
    })
    reconcileTasks(project)
  }
  const handleDeleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    setTasks(prev => prev.filter(t => t.projectId !== id))
  }

  // ─── templates ─────────────────────────────────────────────────────────
  const handleSaveTemplate = (tpl) => setTemplates(prev => {
    const i = prev.findIndex(t => t.id === tpl.id)
    if (i >= 0) return prev.map((t, idx) => idx === i ? tpl : t)
    return [...prev, tpl]
  })
  const handleDeleteTemplate = (id) => setTemplates(prev => prev.filter(t => t.id !== id))

  // ─── derived ───────────────────────────────────────────────────────────
  const annotateTask = annotateTaskId ? tasks.find(t => t.id === annotateTaskId) : null
  const annotateProject = annotateTask ? projectsById[annotateTask.projectId] : null
  const annotateTemplate = annotateProject?.type === 'segmentation' ? templatesById[annotateProject.templateId] : null

  const openReview = (examId, projectId) => setReview({ examId, projectId })

  return (
    <div className="min-h-screen flex flex-col">
      <Masthead currentUser={currentUser} onUserChange={setCurrentUserId} view={view} onViewChange={setView} />

      <div className="flex flex-1 min-h-0">
        {view === 'projects' && (
          <ProjectsWorkspace
            projects={projects}
            tasks={tasks}
            templates={templates}
            templatesById={templatesById}
            currentUser={currentUser}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            onAnnotate={setAnnotateTaskId}
            onStatusChange={handleStatusChange}
          />
        )}

        {view !== 'projects' && (
          <>
            {view === 'annotations' ? (
              <Sidebar tasks={baseTasks} currentUser={currentUser} projects={projects} filters={filters} onFilterChange={setFilters} />
            ) : (
              <aside className="w-60 shrink-0 bg-white border-r border-slate-200 px-3 py-4">
                <div className="px-2 caption leading-relaxed">
                  Templates are reusable segmentation label sets that projects draw from.
                </div>
                <div className="px-2 caption mt-6 leading-relaxed">v0.6 · CIBM<br /><span className="text-slate-400">Mock data — no PHI</span></div>
              </aside>
            )}

            <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-6 py-5 space-y-5">
              {view === 'annotations' && (
                <>
                  <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold text-slate-900 leading-tight">Annotations</h2>
                  <div className="caption mt-0.5">
                    {filtered.length} task{filtered.length !== 1 ? 's' : ''} visible
                    {(filters.status || filters.assignee || filters.project) && ' · filtered'}
                  </div>
                </div>
                <input
                  type="search" value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search exam, subject…" className="field w-64"
                />
              </div>

              <Overview tasks={baseTasks} totalExams={EXAMINATIONS.length} />

              {currentUser.role === 'manager' && (
                <BulkActionBar
                  selectedIds={selectedIds}
                  onClear={clearSelection}
                  onAssignAll={handleAssignAll}
                  onSplitAcross={handleSplitAcross}
                  onDelete={handleBulkRemove}
                />
              )}

              <TaskTable
                tasks={filtered}
                allTasks={tasks}
                currentUser={currentUser}
                projectsById={projectsById}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onSelectSubject={handleSelectSubject}
                onStatusChange={handleStatusChange}
                onUnassign={handleUnassign}
                onReview={openReview}
                onAnnotate={setAnnotateTaskId}
              />
            </>
          )}

              {view === 'templates' && (
                <TemplatesView
                  templates={templates}
                  projects={projects}
                  isManager={currentUser.role === 'manager'}
                  onSave={handleSaveTemplate}
                  onDelete={handleDeleteTemplate}
                />
              )}
            </main>
          </>
        )}
      </div>

      <ReviewDrawer
        review={review}
        allTasks={tasks}
        projectsById={projectsById}
        onClose={() => setReview(null)}
        onStatusChange={handleStatusChange}
      />

      <AnnotateModal
        task={annotateTask}
        project={annotateProject}
        template={annotateTemplate}
        currentUser={currentUser}
        onClose={() => setAnnotateTaskId(null)}
        onSaveWork={handleSaveWork}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
