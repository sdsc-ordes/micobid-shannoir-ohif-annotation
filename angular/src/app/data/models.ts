// Domain model for the MicoBID / Shanoir annotation panel.
// Ported from app/src/data/mockData.js (React app).

export type Role = 'manager' | 'annotator';
export type Tone = 'brand' | 'rust' | 'moss' | 'slate' | 'ink';

export type StatusId = 'todo' | 'in_progress' | 'submitted' | 'accepted' | 'revisions';
export type ProjectType = 'segmentation' | 'text';
export type SubmissionKind = 'seg' | 'screenshot';
export type FieldKind = 'short' | 'long';

export interface Study {
  id: string;
  name: string;
  subtitle: string;
  center: string;
  pi: string;
  started: string;
}

export interface User {
  id: string;
  handle: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  tone: Tone;
}

export interface Examination {
  examId: string;
  subjectId: string;
  date: string;
  studyInstanceUID: string;
  series: string[];
}

export interface StatusMeta {
  id: StatusId;
  label: string;
  bar: string;
}

export interface Label {
  name: string;
  color: string;
}

export interface Template {
  id: string;
  name: string;
  color: string;
  labels: Label[];
  screenshotPattern: string;
  instructions?: string;
}

export interface ProjectField {
  id: string;
  label: string;
  kind: FieldKind;
  required: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  color: string;
  instructions: string;
  memberIds: string[];
  sampleExamIds: string[];
  createdAt: string;
  templateId?: string;      // segmentation
  fields?: ProjectField[];  // text
}

export interface Submission {
  kind: SubmissionKind;
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  examId: string;
  subjectId: string;
  assigneeId: string;
  status: StatusId;
  submissions: Submission[];
  answers: Record<string, string>;
  updatedAt: string;
  notes: string;
}

export interface Filters {
  mineOnly: boolean;
  status: StatusId | null;
  assignee: string | null;
  project: string | null;
  search: string;
}
