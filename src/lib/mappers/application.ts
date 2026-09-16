import type { Types } from "mongoose";
import type { ApplicationDocument } from "@/models/Application";
import type { ApplicationDetail, ApplicationSummary } from "@/types/application";

type LeanApplication = ApplicationDocument & { _id: Types.ObjectId };

export function toApplicationSummary(doc: LeanApplication): ApplicationSummary {
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email,
    totalExperience: doc.totalExperience,
    primarySkills: doc.primarySkills,
    status: doc.status,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export function toApplicationDetail(doc: LeanApplication): ApplicationDetail {
  return {
    ...toApplicationSummary(doc),
    phone: doc.phone,
    currentLocation: doc.currentLocation,
    linkedinUrl: doc.linkedinUrl,
    githubUrl: doc.githubUrl,
    portfolioUrl: doc.portfolioUrl,
    currentJobTitle: doc.currentJobTitle,
    currentCtc: doc.currentCtc,
    expectedCtc: doc.expectedCtc,
    noticePeriod: doc.noticePeriod,
    highestQualification: doc.highestQualification,
    programmingLanguages: doc.programmingLanguages,
    mlAiExperience: doc.mlAiExperience,
    computerVisionExperience: doc.computerVisionExperience,
    relevantProjects: doc.relevantProjects,
    coverLetter: doc.coverLetter,
    resume: {
      originalFilename: doc.resume.originalFilename,
      mimeType: doc.resume.mimeType,
      sizeBytes: doc.resume.sizeBytes,
    },
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
