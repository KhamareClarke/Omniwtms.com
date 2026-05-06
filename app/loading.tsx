export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-200"></div>
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-600 animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-gray-600">Loading your content...</p>
      </div>
    </div>
  );
} 