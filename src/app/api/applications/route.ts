import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { applicationFormSchema } from "@/lib/validation/application";
import { validateResumeContent, validateResumeMetadata } from "@/lib/validation/resume";
import { getFileStorage } from "@/lib/storage";
import { sanitizeDisplayFilename } from "@/lib/utils/sanitize";
import { errorResponse, handleUnexpectedError } from "@/lib/http";

export const runtime = "nodejs";

interface MongoServerErrorLike {
  code?: number;
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Invalid submission. Please try again.");
  }

  const resume = formData.get("resume");
  if (!(resume instanceof File)) {
    return errorResponse(400, "Please upload a PDF resume.");
  }

  const metadataCheck = validateResumeMetadata(resume);
  if (!metadataCheck.valid) {
    return errorResponse(400, metadataCheck.error ?? "Please upload a PDF resume.");
  }

  const rawFields = {
    fullName: formData.get("fullName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    currentLocation: formData.get("currentLocation")?.toString() ?? "",
    linkedinUrl: formData.get("linkedinUrl")?.toString() ?? "",
    githubUrl: formData.get("githubUrl")?.toString() ?? "",
    portfolioUrl: formData.get("portfolioUrl")?.toString() ?? "",
    currentJobTitle: formData.get("currentJobTitle")?.toString() ?? "",
    totalExperience: formData.get("totalExperience")?.toString() ?? "",
    currentCtc: formData.get("currentCtc")?.toString() ?? "",
    expectedCtc: formData.get("expectedCtc")?.toString() ?? "",
    noticePeriod: formData.get("noticePeriod")?.toString() ?? "",
    highestQualification: formData.get("highestQualification")?.toString() ?? "",
    primarySkills: formData.get("primarySkills")?.toString() ?? "",
    programmingLanguages: formData.get("programmingLanguages")?.toString() ?? "",
    mlAiExperience: formData.get("mlAiExperience")?.toString() ?? "",
    computerVisionExperience: formData.get("computerVisionExperience")?.toString() ?? "",
    relevantProjects: formData.get("relevantProjects")?.toString() ?? "",
    coverLetter: formData.get("coverLetter")?.toString() ?? "",
  };

  const parsed = applicationFormSchema.safeParse(rawFields);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key] = issue.message;
      }
    }
    return errorResponse(400, "Please correct the highlighted fields.", { fieldErrors });
  }

  const buffer = Buffer.from(await resume.arrayBuffer());
  const contentCheck = validateResumeContent(buffer);
  if (!contentCheck.valid) {
    return errorResponse(400, contentCheck.error ?? "Please upload a PDF resume.");
  }

  try {
    await connectToDatabase();

    const existing = await Application.exists({ email: parsed.data.email.toLowerCase() });
    if (existing) {
      return errorResponse(409, "An application has already been submitted using this email address.");
    }

    const storage = getFileStorage();
    const { storageKey } = await storage.save(buffer, "pdf");

    try {
      await Application.create({
        ...parsed.data,
        resume: {
          storageKey,
          originalFilename: sanitizeDisplayFilename(resume.name),
          mimeType: "application/pdf",
          sizeBytes: buffer.length,
        },
        status: "New",
      });
    } catch (createError: unknown) {
      await storage.delete(storageKey).catch(() => undefined);
      if ((createError as MongoServerErrorLike)?.code === 11000) {
        return errorResponse(409, "An application has already been submitted using this email address.");
      }
      throw createError;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleUnexpectedError(error, "POST /api/applications");
  }
}
