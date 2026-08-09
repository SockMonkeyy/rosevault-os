export default function DataTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-14 rounded-xl bg-[#F5F2EC]"
        />
      ))}
    </div>
  );
}