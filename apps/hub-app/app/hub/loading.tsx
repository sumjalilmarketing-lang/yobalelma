export default function HubLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="hub-loader-line h-16 rounded-lg bg-white shadow-line" />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="hub-loader-line h-28 rounded-lg bg-white shadow-line" />
          ))}
        </div>
      </div>
    </div>
  );
}
