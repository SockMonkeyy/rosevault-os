import { ReactNode } from "react";

interface WorkspaceLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  return (
    <main className="min-h-screen bg-[#FBF7EF]">
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        {children}
      </div>
    </main>
  );
}