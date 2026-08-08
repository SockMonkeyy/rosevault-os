import PipelineColumn from "./PipelineColumn";
import { PipelineColumn as Column } from "../types";

interface Props {
  columns: Column[];
}

export default function PipelineBoard({
  columns,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-6 pb-4">
        {columns.map((column) => (
          <PipelineColumn
            key={column.id}
            column={column}
          />
        ))}
      </div>
    </div>
  );
}