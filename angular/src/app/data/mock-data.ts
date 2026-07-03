// ──────────────────────────────────────────────────────────────────────────────
// Mock data — Shanoir / OHIF annotation panel (ported verbatim from React app).
//
// Hierarchy: Study → Project → Sample (examination) → Task (annotator × sample).
// A project is 'segmentation' (labels + OHIF + DICOM-SEG) or 'text' (free-text fields).
// ──────────────────────────────────────────────────────────────────────────────

import {
  Study, User, Examination, StatusMeta, StatusId,
  Template, Project, Task, Submission,
} from './models';

export const SHANOIR_BASE = 'https://shanoir-test.cibm.ch';
export const OHIF_BASE = 'https://shanoir-viewer-test.cibm.ch';

export const STUDY: Study = {
  id: 'n405',
  name: 'MICOBID',
  subtitle: 'Microbiome–Brain Interaction Dataset',
  center: 'CHUV',
  pi: 'P. Hagmann',
  started: '2024-09-12',
};

export const USERS: User[] = [
  { id: 'u1', handle: 'cvivarrios', name: 'C. Vivar Rios', email: 'carlosvivarrios@gmail.com', role: 'manager',   initials: 'CV', tone: 'brand' },
  { id: 'u2', handle: 'jbardet',    name: 'J. Bardet',     email: 'j.bardet@cibm.ch',          role: 'annotator', initials: 'JB', tone: 'rust'  },
  { id: 'u3', handle: 'phagmann',   name: 'P. Hagmann',    email: 'p.hagmann@cibm.ch',         role: 'annotator', initials: 'PH', tone: 'moss'  },
  { id: 'u4', handle: 'amorais',    name: 'A. Morais',     email: 'a.morais@cibm.ch',          role: 'annotator', initials: 'AM', tone: 'slate' },
];

export const userById = (id: string): User | null => USERS.find(u => u.id === id) ?? null;
export const annotators = (): User[] => USERS.filter(u => u.role === 'annotator');

// ─── Samples = Examinations ───────────────────────────────────────────────────

export const EXAMINATIONS: Examination[] = [
  { examId: '1148', subjectId: '2734273', date: '2023-02-18', studyInstanceUID: '1.4.9.12.34.1.8527.1148',
    series: ['t1_mprage_sag_p2', 'tof_cs_acc10.3', 't2_tse_tra_fs_1.5mm', 'vibe_fs_tra_HR_0.4'] },
  { examId: '1201', subjectId: '2741101', date: '2023-03-04', studyInstanceUID: '1.4.9.12.34.1.8527.1201',
    series: ['t1_mprage_sag_p2', 'tof_cs_acc10.3', 't2_tse_tra_fs_1.5mm', 'vibe_fs_tra_HR_0.4'] },
  { examId: '1301', subjectId: '2748892', date: '2023-04-11', studyInstanceUID: '1.4.9.12.34.1.8527.1301',
    series: ['t1_mprage_sag_p2', 'tof_cs_acc10.3', 't2_tse_tra_fs_1.5mm', 'vibe_fs_tra_HR_0.4', 'flair_3d'] },
  { examId: '1401', subjectId: '2756554', date: '2023-05-22', studyInstanceUID: '1.4.9.12.34.1.8527.1401',
    series: ['t1_mprage_sag_p2', 'tof_cs_acc10.3', 't2_tse_tra_fs_1.5mm'] },
  { examId: '1501', subjectId: '2763310', date: '2023-06-15', studyInstanceUID: '1.4.9.12.34.1.8527.1501',
    series: ['t1_mprage_sag_p2', 't2_tse_tra_fs_1.5mm', 'vibe_fs_tra_HR_0.4'] },
  { examId: '1601', subjectId: '2771445', date: '2023-07-03', studyInstanceUID: '1.4.9.12.34.1.8527.1601',
    series: ['t1_mprage_sag_p2', 'tof_cs_acc10.3', 't2_tse_tra_fs_1.5mm', 'vibe_fs_tra_HR_0.4'] },
  { examId: '1701', subjectId: '2779882', date: '2023-08-19', studyInstanceUID: '1.4.9.12.34.1.8527.1701',
    series: ['t1_mprage_sag_p2', 'vibe_fs_tra_HR_0.4'] },
];

export const examById = (id: string): Examination | undefined => EXAMINATIONS.find(e => e.examId === id);

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS: Record<StatusId, StatusMeta> = {
  todo:        { id: 'todo',        label: 'To do',       bar: '#94A3B8' },
  in_progress: { id: 'in_progress', label: 'In progress', bar: '#2563EB' },
  submitted:   { id: 'submitted',   label: 'Submitted',   bar: '#D97706' },
  accepted:    { id: 'accepted',    label: 'Accepted',    bar: '#059669' },
  revisions:   { id: 'revisions',   label: 'Revisions',   bar: '#DC2626' },
};

export const STATUS_ORDER: StatusId[] = ['todo', 'in_progress', 'submitted', 'revisions', 'accepted'];
export const isAnnotated = (s: StatusId): boolean => s === 'submitted' || s === 'accepted';
export const isDone = (s: StatusId): boolean => s === 'accepted';

// ─── Templates (reusable segmentation label sets) ─────────────────────────────

export const SEED_TEMPLATES: Template[] = [
  {
    id: 'brain-mask',
    name: 'Brain mask',
    color: '#0F766E',
    labels: [{ name: 'Brain', color: '#0F766E' }],
    screenshotPattern: '{study}_{exam}_{subject}_{annotator}_{ts}_brain.png',
  },
  {
    id: 'tumor',
    name: 'Tumor + components',
    color: '#DC2626',
    labels: [
      { name: 'Enhancing tumor',   color: '#DC2626' },
      { name: 'Necrosis',          color: '#7C2D12' },
      { name: 'Peritumoral edema', color: '#2563EB' },
    ],
    screenshotPattern: '{study}_{exam}_{subject}_{annotator}_{ts}_tumor.png',
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus L/R',
    color: '#7C3AED',
    labels: [
      { name: 'Hippocampus L', color: '#7C3AED' },
      { name: 'Hippocampus R', color: '#A855F7' },
    ],
    screenshotPattern: '{study}_{exam}_{subject}_{annotator}_{ts}_hippo.png',
  },
  {
    id: 'vessels',
    name: 'Vessels (ToF)',
    color: '#B91C1C',
    labels: [
      { name: 'Arteries (Circle of Willis)', color: '#B91C1C' },
      { name: 'Veins (superficial)',         color: '#1D4ED8' },
    ],
    screenshotPattern: '{study}_{exam}_{subject}_{annotator}_{ts}_vessels.png',
  },
  {
    id: 'lesions',
    name: 'White-matter lesions',
    color: '#D97706',
    labels: [{ name: 'Lesion', color: '#D97706' }],
    screenshotPattern: '{study}_{exam}_{subject}_{annotator}_{ts}_wml.png',
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────

export const SEED_PROJECTS: Project[] = [
  {
    id: 'p-brain',
    name: 'Whole-brain masking',
    type: 'segmentation',
    color: '#0F766E',
    templateId: 'brain-mask',
    instructions:
`Segment the whole brain parenchyma (gray + white matter) on the T1 MPRAGE.

Exclude:
- CSF and ventricles
- Extra-axial structures (skull, scalp, dura)
- Sinuses

Reference series: t1_mprage_sag_p2. Use the other series for sanity-checking borders only.`,
    memberIds: ['u2', 'u3', 'u4'],
    sampleExamIds: ['1148', '1701'],
    createdAt: '2026-04-10',
  },
  {
    id: 'p-tumor',
    name: 'Tumor delineation',
    type: 'segmentation',
    color: '#DC2626',
    templateId: 'tumor',
    instructions:
`Segment the lesion on the T1 post-contrast and T2/FLAIR series.

Use three labels:
1. Enhancing tumor — bright on T1+gad
2. Necrosis — non-enhancing core, dark on T1+gad
3. Peritumoral edema — hyperintense on T2/FLAIR around the tumor

If multiple lesions are present, segment each with the same three labels.`,
    memberIds: ['u2', 'u4'],
    sampleExamIds: ['1301', '1601'],
    createdAt: '2026-04-22',
  },
  {
    id: 'p-report',
    name: 'Structured radiology report',
    type: 'text',
    color: '#7C3AED',
    fields: [
      { id: 'findings',   label: 'Findings',           kind: 'long',  required: true },
      { id: 'impression', label: 'Impression',         kind: 'long',  required: true },
      { id: 'incidental', label: 'Incidental notes',   kind: 'short', required: false },
      { id: 'quality',    label: 'Scan quality (1–5)', kind: 'short', required: true },
    ],
    instructions:
`Write a structured radiology report for each examination.

- Findings: describe all observable structures and abnormalities, region by region.
- Impression: a concise 1–3 sentence summary suitable for the referring clinician.
- Incidental notes: anything outside the primary question worth flagging.
- Scan quality: rate 1 (non-diagnostic) to 5 (excellent).

Base your report on all available series.`,
    memberIds: ['u3', 'u2'],
    sampleExamIds: ['1501', '1401'],
    createdAt: '2026-05-02',
  },
];

export const projectById = (id: string): Project | undefined => SEED_PROJECTS.find(p => p.id === id);

// ─── Tasks ────────────────────────────────────────────────────────────────────

let _taskId = 0;
interface TaskOpts { submissions?: Submission[]; answers?: Record<string, string>; updatedAt?: string; }
const t = (projectId: string, examId: string, assigneeId: string, status: StatusId, opts: TaskOpts = {}): Task => {
  const e = examById(examId)!;
  return {
    id: `t${++_taskId}`,
    projectId,
    examId,
    subjectId: e.subjectId,
    assigneeId,
    status,
    submissions: opts.submissions ?? [],
    answers: opts.answers ?? {},
    updatedAt: opts.updatedAt ?? '2026-05-20',
    notes: '',
  };
};

const seg = (filename: string, size = 2_400_000, when = '2026-05-15'): Submission =>
  ({ kind: 'seg', filename, size, uploadedAt: when });
const png = (filename: string, size = 480_000, when = '2026-05-15'): Submission =>
  ({ kind: 'screenshot', filename, size, uploadedAt: when });

export const INITIAL_TASKS: Task[] = [
  // p-brain — sample 1148 (3-way replica), sample 1701 (just started)
  t('p-brain', '1148', 'u2', 'accepted',    { updatedAt: '2026-04-18', submissions: [seg('MICOBID_1148_2734273_jbardet_20260418-1102_brain.dcm'), png('MICOBID_1148_2734273_jbardet_20260418-1105_brain.png')] }),
  t('p-brain', '1148', 'u3', 'accepted',    { updatedAt: '2026-04-19', submissions: [seg('MICOBID_1148_2734273_phagmann_20260419-0930_brain.dcm')] }),
  t('p-brain', '1148', 'u4', 'submitted',   { updatedAt: '2026-05-12', submissions: [seg('MICOBID_1148_2734273_amorais_20260512-1640_brain.dcm'), png('MICOBID_1148_2734273_amorais_20260512-1642_brain.png')] }),
  t('p-brain', '1701', 'u2', 'todo',        { updatedAt: '2026-05-25' }),
  t('p-brain', '1701', 'u3', 'in_progress', { updatedAt: '2026-05-26' }),
  t('p-brain', '1701', 'u4', 'todo',        { updatedAt: '2026-05-25' }),

  // p-tumor — sample 1301 (in flight), sample 1601 (under review)
  t('p-tumor', '1301', 'u4', 'in_progress', { updatedAt: '2026-05-22' }),
  t('p-tumor', '1301', 'u2', 'revisions',   { updatedAt: '2026-05-21', submissions: [seg('MICOBID_1301_2748892_jbardet_20260520-1500_tumor.dcm')] }),
  t('p-tumor', '1601', 'u4', 'submitted',   { updatedAt: '2026-05-19', submissions: [seg('MICOBID_1601_2771445_amorais_20260519-1015_tumor.dcm')] }),
  t('p-tumor', '1601', 'u2', 'submitted',   { updatedAt: '2026-05-23', submissions: [seg('MICOBID_1601_2771445_jbardet_20260523-1400_tumor.dcm'), png('MICOBID_1601_2771445_jbardet_20260523-1402_tumor.png')] }),

  // p-report — text project. sample 1501 (one done), sample 1401 (pending)
  t('p-report', '1501', 'u3', 'submitted', { updatedAt: '2026-05-16', answers: {
    findings:   'Symmetric ventricles, no midline shift. No restricted diffusion. A few punctate T2/FLAIR hyperintensities in the frontal subcortical white matter, non-specific.',
    impression: 'Age-appropriate study. Mild non-specific white-matter changes. No acute intracranial abnormality.',
    incidental: 'Small left maxillary sinus mucous retention cyst.',
    quality:    '4',
  } }),
  t('p-report', '1501', 'u2', 'todo',        { updatedAt: '2026-05-20' }),
  t('p-report', '1401', 'u3', 'todo',        { updatedAt: '2026-05-20' }),
  t('p-report', '1401', 'u2', 'in_progress', { updatedAt: '2026-05-24', answers: { findings: 'Draft — pending review of the T2 series.' } }),
];

// ─── URL builders ─────────────────────────────────────────────────────────────

export const ohifViewUrl = (studyInstanceUID: string): string =>
  `${OHIF_BASE}/viewer?StudyInstanceUIDs=${studyInstanceUID}`;
export const ohifAnnotateUrl = (studyInstanceUID: string): string =>
  `${OHIF_BASE}/segmentation?StudyInstanceUIDs=${studyInstanceUID}`;
export const shanoirExamUrl = (examId: string): string =>
  `${SHANOIR_BASE}/shanoir-ng/examination/details/${examId}`;

// ─── Filename helpers ─────────────────────────────────────────────────────────

const pad = (n: number): string => String(n).padStart(2, '0');

export const timestampToken = (d: Date = new Date()): string =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

export const renderFilename = (
  pattern: string,
  { exam, annotator, ts = timestampToken() }: { exam: Examination; annotator: User | null; ts?: string },
): string =>
  pattern
    .replaceAll('{study}', STUDY.name)
    .replaceAll('{exam}', exam.examId)
    .replaceAll('{subject}', exam.subjectId)
    .replaceAll('{annotator}', annotator?.handle ?? 'anonymous')
    .replaceAll('{ts}', ts);

export const segFilename = (pngFilename: string): string => pngFilename.replace(/\.png$/i, '.dcm');

export const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};
