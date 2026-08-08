export default function Loading() {
  return (
    <div className="flex-1 p-8 space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-secondary/50 rounded-lg"></div>
      <div className="h-6 w-96 bg-secondary/30 rounded-md"></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <div className="h-64 bg-secondary/20 rounded-2xl"></div>
        <div className="h-64 bg-secondary/20 rounded-2xl"></div>
        <div className="h-64 bg-secondary/20 rounded-2xl"></div>
      </div>
    </div>
  )
}
