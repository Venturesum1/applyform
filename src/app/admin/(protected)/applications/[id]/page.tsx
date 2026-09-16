import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { toApplicationDetail } from "@/lib/mappers/application";
import { isValidObjectId } from "@/lib/utils/sanitize";
import { CandidateInfo } from "@/components/admin/candidate-info";
import { StatusSelect } from "@/components/admin/status-select";
import { ResumeViewerLoader } from "@/components/admin/resume-viewer-loader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    notFound();
  }

  await connectToDatabase();
  const doc = await Application.findById(id).lean();
  if (!doc) {
    notFound();
  }

  const application = toApplicationDetail(doc as never);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{application.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            Applied {new Date(application.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <StatusSelect applicationId={application.id} initialStatus={application.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CandidateInfo application={application} />

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Resume</h2>
          <ResumeViewerLoader applicationId={application.id} />
        </div>
      </div>
    </div>
  );
}
