"use client";

import { useState } from "react";
import { Controller, useForm, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationFormSchema, type ApplicationFormInput } from "@/lib/validation/application";
import { ResumeUpload } from "./resume-upload";
import { ReviewSummary } from "./review-summary";
import { SuccessScreen } from "./success-screen";

type Step = "editing" | "review" | "success";

const TOTAL_EXPERIENCE_OPTIONS = [
  "Fresher / 0 years",
  "0-1 years",
  "1-2 years",
  "2-4 years",
  "4-6 years",
  "6-10 years",
  "10+ years",
];

const NOTICE_PERIOD_OPTIONS = ["Immediate", "15 days", "30 days", "60 days", "90 days", "Other"];

const QUALIFICATION_OPTIONS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Other",
];

const defaultValues: ApplicationFormInput = {
  fullName: "",
  email: "",
  phone: "",
  currentLocation: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  currentJobTitle: "",
  totalExperience: "",
  currentCtc: "",
  expectedCtc: "",
  noticePeriod: "",
  highestQualification: "",
  primarySkills: "",
  programmingLanguages: "",
  mlAiExperience: "",
  computerVisionExperience: "",
  relevantProjects: "",
  coverLetter: "",
};

interface FieldProps {
  register: UseFormRegister<ApplicationFormInput>;
  errors: FieldErrors<ApplicationFormInput>;
  name: keyof ApplicationFormInput;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

function TextField({ register, errors, name, label, required, placeholder, type = "text" }: FieldProps) {
  const error = errors[name]?.message as string | undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...register(name)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function TextAreaField({ register, errors, name, label, required, placeholder }: FieldProps) {
  const error = errors[name]?.message as string | undefined;
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea
        id={name}
        rows={3}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...register(name)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface SelectFieldProps {
  control: Control<ApplicationFormInput>;
  errors: FieldErrors<ApplicationFormInput>;
  name: keyof ApplicationFormInput;
  label: string;
  required?: boolean;
  placeholder: string;
  options: string[];
}

function SelectField({ control, errors, name, label, required, placeholder, options }: SelectFieldProps) {
  const error = errors[name]?.message as string | undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value || undefined} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="w-full" aria-invalid={!!error}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function submitWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let body: Record<string, unknown> | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

export function ApplicationForm() {
  const [step, setStep] = useState<Step>("editing");
  const [reviewData, setReviewData] = useState<ApplicationFormInput | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string>();

  const form = useForm<ApplicationFormInput>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues,
    mode: "onBlur",
  });
  const { register, control, formState, handleSubmit, setError } = form;

  function goToReview(values: ApplicationFormInput) {
    if (!resumeFile) {
      setResumeError("Please upload a PDF resume.");
      document.getElementById("resume-upload-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setResumeError(undefined);
    setSubmitError(undefined);
    setReviewData(values);
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onValidationError() {
    toast.error("Please correct the highlighted fields.");
  }

  async function submitApplication() {
    if (isSubmitting || !reviewData || !resumeFile) return;
    setIsSubmitting(true);
    setSubmitError(undefined);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(reviewData)) {
        formData.append(key, value ?? "");
      }
      formData.append("resume", resumeFile);

      const { status, body } = await submitWithProgress("/api/applications", formData, setUploadProgress);

      if (status === 201) {
        setStep("success");
        return;
      }

      if (status === 400 && body?.fieldErrors) {
        const fieldErrors = body.fieldErrors as Record<string, string>;
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof ApplicationFormInput, { message });
        }
        setStep("editing");
        toast.error("Please correct the highlighted fields.");
        return;
      }

      const message =
        (body?.error as string | undefined) ?? "Something went wrong. Please try again.";
      setSubmitError(message);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "success") {
    return <SuccessScreen />;
  }

  return (
    <form
      onSubmit={
        step === "editing"
          ? handleSubmit(goToReview, onValidationError)
          : (event) => {
              event.preventDefault();
              void submitApplication();
            }
      }
      className="space-y-10"
      noValidate
    >
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Unable to submit application</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {step === "editing" && (
        <>
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Personal information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField register={register} errors={formState.errors} name="fullName" label="Full Name" required />
              <TextField register={register} errors={formState.errors} name="email" label="Email" type="email" required />
              <TextField register={register} errors={formState.errors} name="phone" label="Phone Number" type="tel" required />
              <TextField register={register} errors={formState.errors} name="currentLocation" label="Current Location" required />
              <TextField register={register} errors={formState.errors} name="linkedinUrl" label="LinkedIn URL" placeholder="https://linkedin.com/in/..." />
              <TextField register={register} errors={formState.errors} name="githubUrl" label="GitHub URL" placeholder="https://github.com/..." />
              <TextField register={register} errors={formState.errors} name="portfolioUrl" label="Portfolio URL" placeholder="https://..." />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Professional information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField register={register} errors={formState.errors} name="currentJobTitle" label="Current Job Title" />
              <SelectField
                control={control}
                errors={formState.errors}
                name="totalExperience"
                label="Total Experience"
                required
                placeholder="Select experience"
                options={TOTAL_EXPERIENCE_OPTIONS}
              />
              <TextField register={register} errors={formState.errors} name="currentCtc" label="Current CTC" />
              <TextField register={register} errors={formState.errors} name="expectedCtc" label="Expected CTC" />
              <SelectField
                control={control}
                errors={formState.errors}
                name="noticePeriod"
                label="Notice Period"
                placeholder="Select notice period"
                options={NOTICE_PERIOD_OPTIONS}
              />
              <SelectField
                control={control}
                errors={formState.errors}
                name="highestQualification"
                label="Highest Qualification"
                placeholder="Select qualification"
                options={QUALIFICATION_OPTIONS}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Technical information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextAreaField
                register={register}
                errors={formState.errors}
                name="primarySkills"
                label="Primary Skills"
                required
                placeholder="e.g. React, Node.js, Python"
              />
              <TextAreaField
                register={register}
                errors={formState.errors}
                name="programmingLanguages"
                label="Programming Languages"
                required
                placeholder="e.g. TypeScript, Python, Go"
              />
              <TextAreaField
                register={register}
                errors={formState.errors}
                name="mlAiExperience"
                required
                label="ML / AI Experience"
              />
              <TextAreaField
                register={register}
                errors={formState.errors}
                name="computerVisionExperience"
                required
                label="Computer Vision Experience"
              />
              <TextAreaField
                register={register}
                errors={formState.errors}
                name="relevantProjects"
                required
                label="Relevant Projects"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Application</h2>
            <TextAreaField
              register={register}
              errors={formState.errors}
              name="coverLetter"
              label="Cover Letter / Introduction"
            />
            <div id="resume-upload-section" className="space-y-1.5">
              <Label>
                Resume (PDF) <span className="text-destructive">*</span>
              </Label>
              <ResumeUpload file={resumeFile} onFileChange={setResumeFile} error={resumeError} />
            </div>
          </section>

          <div className="flex justify-end border-t border-border pt-6">
            <Button type="submit" size="lg">
              Review Application
            </Button>
          </div>
        </>
      )}

      {step === "review" && reviewData && resumeFile && (
        <>
          <ReviewSummary values={reviewData} resumeFile={resumeFile} />

          {isSubmitting && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Uploading your application…</p>
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-6 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={() => setStep("editing")}
            >
              Edit Application
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
