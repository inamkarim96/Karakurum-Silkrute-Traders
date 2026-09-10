const SkeletonBlock = ({ className = "" }) => (
  <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm p-4 flex flex-col gap-4">
    <SkeletonBlock className="w-full aspect-square rounded-xl" />
    <div className="flex flex-col gap-2 mt-2">
      <SkeletonBlock className="w-1/3 h-3" />
      <SkeletonBlock className="w-3/4 h-5" />
      <SkeletonBlock className="w-1/2 h-4 mb-2" />
      <div className="flex justify-between items-center mt-auto">
        <SkeletonBlock className="w-24 h-6" />
        <SkeletonBlock className="w-8 h-8 rounded-full" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

const PageSkeleton = () => (
  <div className="min-h-screen bg-bg-main pt-24 pb-12 px-4">
    <div className="container mx-auto max-w-7xl">
      {/* Hero placeholder */}
      <SkeletonBlock className="w-full h-[40vh] min-h-[300px] rounded-3xl mb-12" />

      {/* Grid Header placeholder */}
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-3">
          <SkeletonBlock className="w-32 h-4" />
          <SkeletonBlock className="w-64 h-8" />
        </div>
        <SkeletonBlock className="w-24 h-10 rounded-full hidden sm:block" />
      </div>

      {/* Products grid */}
      <ProductGridSkeleton count={8} />
    </div>
  </div>
);

export default PageSkeleton;
