export const APPLICATION_STATUSES = [
  "New",
  "Reviewing",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Hired",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ResumeMeta {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ApplicationSummary {
  id: string;
  fullName: string;
  email: string;
  totalExperience: string;
  primarySkills: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  phone: string;
  currentLocation: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  currentJobTitle?: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  highestQualification?: string;
  programmingLanguages?: string;
  mlAiExperience?: string;
  computerVisionExperience?: string;
  relevantProjects?: string;
  coverLetter?: string;
  resume: {
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  };
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  New: number;
  Reviewing: number;
  Shortlisted: number;
  Interview: number;
  Rejected: number;
  Hired: number;
}
