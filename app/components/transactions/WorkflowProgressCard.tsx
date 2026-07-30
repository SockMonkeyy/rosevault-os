import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import AdvanceStageButton from "./AdvanceStageButton";

interface WorkflowProgressCardProps {
  transactionId: string;

  stageTitle: string;

  nextStage?: string;

  completedTasks: number;

  totalTasks: number;

  uploadedDocuments: number;

  requiredDocuments: number;

  remainingTasks: string[];
}

export default function WorkflowProgressCard({
  transactionId,
  stageTitle,
  nextStage,
  completedTasks,
  totalTasks,
  uploadedDocuments,
  requiredDocuments,
  remainingTasks,
}: WorkflowProgressCardProps) {
  const percent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="rounded-2xl border border-[#EDE7DC] bg-white/70 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8F8578]">
          Workflow
        </p>

        <h2 className="mt-2 font-serif text-2xl text-[#29231D]">
          {stageTitle}
        </h2>
      </div>

      {/* Progress */}

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-[#7C7265]">Progress</span>

          <span className="font-semibold text-[#B7832F]">{percent}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#ECE6DB]">
          <div
            className="h-full rounded-full bg-[#B7832F] transition-all duration-500"
            style={{
              width: `${percent}%`,
            }}
          />
        </div>
      </div>

      {/* Stats */}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#B7832F]" />

          <div>
            <p className="text-sm font-medium text-[#29231D]">
              {completedTasks} of {totalTasks} Tasks Complete
            </p>

            <p className="text-xs text-[#8F8578]">Workflow checklist</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#B7832F]" />

          <div>
            <p className="text-sm font-medium text-[#29231D]">
              {uploadedDocuments} of {requiredDocuments} Documents
            </p>

            <p className="text-xs text-[#8F8578]">Required for this stage</p>
          </div>
        </div>
      </div>

      {nextStage && (
        <>
          <div className="my-6 border-t border-[#ECE6DB]" />

          <div className="flex items-center justify-between rounded-xl bg-[#FBF7EF] p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8F8578]">
                Next Stage
              </p>

              <p className="mt-1 font-medium text-[#29231D]">{nextStage}</p>
            </div>

            <ArrowRight className="h-5 w-5 text-[#B7832F]" />
          </div>
        </>
      )}

      {remainingTasks.length > 0 && (
        <>
          <div className="my-6 border-t border-[#ECE6DB]" />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8F8578]">
              Remaining
            </p>

            <div className="space-y-2">
              {remainingTasks.map((task) => (
                <div
                  key={task}
                  className="rounded-lg bg-[#FBF7EF] px-3 py-2 text-sm text-[#29231D]"
                >
                  {task}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {nextStage && (
        <>
          <div className="my-6 border-t border-[#ECE6DB]" />

          <AdvanceStageButton
            transactionId={transactionId}
            disabled={remainingTasks.length > 0}
          />
        </>
      )}
    </div>
  );
}
