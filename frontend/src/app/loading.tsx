import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-page py-16">
      <div className="skeleton mb-8 h-10 w-64" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
