import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import type { ApplicationFormInput } from "@/lib/validation/application";

interface ReviewSummaryProps {
  values: ApplicationFormInput;
  resumeFile: File;
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground break-words">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

export function ReviewSummary({ values, resumeFile }: ReviewSummaryProps) {
  return (
    <div className="space-y-8">
      <Section title="Personal information">
        <Field label="Full name" value={values.fullName} />
        <Field label="Email" value={values.email} />
        <Field label="Phone number" value={values.phone} />
        <Field label="Current location" value={values.currentLocation} />
        <Field label="LinkedIn" value={values.linkedinUrl} />
        <Field label="GitHub" value={values.githubUrl} />
        <Field label="Portfolio" value={values.portfolioUrl} />
      </Section>

      <Section title="Professional information">
        <Field label="Current job title" value={values.currentJobTitle} />
        <Field label="Total experience" value={values.totalExperience} />
        <Field label="Current CTC" value={values.currentCtc} />
        <Field label="Expected CTC" value={values.expectedCtc} />
        <Field label="Notice period" value={values.noticePeriod} />
        <Field label="Highest qualification" value={values.highestQualification} />
      </Section>

      <Section title="Technical information">
        <Field label="Primary skills" value={values.primarySkills} />
        <Field label="Programming languages" value={values.programmingLanguages} />
        <Field label="ML / AI experience" value={values.mlAiExperience} />
        <Field label="Computer vision experience" value={values.computerVisionExperience} />
        <Field label="Relevant projects" value={values.relevantProjects} />
      </Section>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Application</h3>
        {values.coverLetter && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cover letter / Introduction
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{values.coverLetter}</dd>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/30 px-4 py-3">
          <FileText className="size-5 text-primary" aria-hidden />
          <span className="text-sm font-medium">{resumeFile.name}</span>
        </div>
      </div>
    </div>
  );
}
