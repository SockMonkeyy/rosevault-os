import { ReactNode } from "react";

interface WorkspacePageProps {
  children: ReactNode;
}

export default function WorkspacePage({
  children,
}: WorkspacePageProps) {
  return (
    <div className="min-h-screen bg-[#FBF7EF]">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-8 py-8">
        {children}
      </div>
    </div>
  );
}