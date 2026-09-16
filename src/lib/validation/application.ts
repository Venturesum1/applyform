import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), {
      message: "Enter a valid URL starting with http:// or https://",
    })
    .optional()
    .or(z.literal("").transform(() => undefined));

export const applicationFormSchema = z.object({
  // Personal information
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is required")
    .max(30)
    .regex(/^[+()0-9\s-]+$/, "Please enter a valid phone number"),
  currentLocation: z.string().trim().min(1, "Current location is required").max(200),
  linkedinUrl: optionalUrl(500),
  githubUrl: optionalUrl(500),
  portfolioUrl: optionalUrl(500),

  // Professional information
  currentJobTitle: optionalText(200),
  totalExperience: z.string().trim().min(1, "Total experience is required").max(50),
  currentCtc: optionalText(100),
  expectedCtc: optionalText(100),
  noticePeriod: optionalText(100),
  highestQualification: optionalText(200),

  // Technical information
  primarySkills: z.string().trim().min(1, "Primary skills are required").max(1000),
  programmingLanguages: optionalText(1000),
  mlAiExperience: optionalText(2000),
  computerVisionExperience: optionalText(2000),
  relevantProjects: optionalText(3000),

  // Application
  coverLetter: optionalText(5000),
});

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;
