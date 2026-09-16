export default function StatCard({
  title,
  value,
  subtitle
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4 bg-white">
      <div className="text-xs text-neutral-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle ? <div className="text-xs text-neutral-500 mt-1">{subtitle}</div> : null}
    </div>
  );
}