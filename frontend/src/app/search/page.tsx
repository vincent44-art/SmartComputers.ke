import { Suspense } from "react";

import { SearchResults } from "./SearchResults";

export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-page py-16" />}>
      <SearchResults />
    </Suspense>
  );
}
