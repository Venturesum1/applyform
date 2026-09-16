import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/types/application";

export interface ApplicationDocument {
  // Personal information
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // Professional information
  currentJobTitle?: string;
  totalExperience: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  highestQualification?: string;

  // Technical information
  primarySkills: string;
  programmingLanguages?: string;
  mlAiExperience?: string;
  computerVisionExperience?: string;
  relevantProjects?: string;

  // Application
  coverLetter?: string;
  resume: {
    storageKey: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  };
  status: ApplicationStatus;

  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationHydratedDocument = HydratedDocument<ApplicationDocument>;

const ResumeSchema = new Schema(
  {
    storageKey: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false },
);

const ApplicationSchema = new Schema<ApplicationDocument>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 200 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    currentLocation: { type: String, required: true, trim: true, maxlength: 200 },
    linkedinUrl: { type: String, trim: true, maxlength: 500 },
    githubUrl: { type: String, trim: true, maxlength: 500 },
    portfolioUrl: { type: String, trim: true, maxlength: 500 },

    currentJobTitle: { type: String, trim: true, maxlength: 200 },
    totalExperience: { type: String, trim: true, maxlength: 50, default: "" },
    currentCtc: { type: String, trim: true, maxlength: 100 },
    expectedCtc: { type: String, trim: true, maxlength: 100 },
    noticePeriod: { type: String, trim: true, maxlength: 100 },
    highestQualification: { type: String, trim: true, maxlength: 200 },

    primarySkills: { type: String, trim: true, maxlength: 1000, default: "" },
    programmingLanguages: { type: String, trim: true, maxlength: 1000 },
    mlAiExperience: { type: String, trim: true, maxlength: 2000 },
    computerVisionExperience: { type: String, trim: true, maxlength: 2000 },
    relevantProjects: { type: String, trim: true, maxlength: 3000 },

    coverLetter: { type: String, trim: true, maxlength: 5000 },
    resume: { type: ResumeSchema, required: true },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "New",
      required: true,
    },
  },
  { timestamps: true },
);

ApplicationSchema.index({ email: 1 }, { unique: true });
ApplicationSchema.index({ createdAt: -1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ fullName: 1 });

export const Application: Model<ApplicationDocument> =
  mongoose.models.Application ??
  mongoose.model<ApplicationDocument>("Application", ApplicationSchema);
