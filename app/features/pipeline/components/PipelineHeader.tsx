import Link from "next/link";

interface PipelineHeaderProps {
  totalDeals: number;
  totalValue: number;
}

export default function PipelineHeader({
  totalDeals,
  totalValue,
}: PipelineHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Link
          href="/"
          className="text-sm font-medium text-[#B7832F] hover:underline"
        >
          ← Dashboard
        </Link>

        <h1 className="mt-3 font-serif text-4xl text-[#29231D]">
          Pipeline
        </h1>

        <p className="mt-2 max-w-2xl text-[#7C7265]">
          Track every transaction through your workflow from lead to closing.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="rounded-2xl border border-[#EDE7DC] bg-white px-6 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#8F8578]">
            Deals
          </p>

          <p className="mt-2 font-serif text-3xl text-[#29231D]">
            {totalDeals}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EDE7DC] bg-white px-6 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#8F8578]">
            Pipeline Value
          </p>

          <p className="mt-2 font-serif text-3xl text-[#B7832F]">
            ${totalValue.toLocaleString()}
          </p>
        </div>

        <Link
          href="/transactions/new"
          className="self-center rounded-xl bg-[#0D0C0A] px-5 py-3 font-semibold text-[#D8B66A] transition hover:bg-[#171512]"
        >
          + New Transaction
        </Link>
      </div>
    </div>
  );
}