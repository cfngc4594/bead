"use client";

import dynamic from "next/dynamic";

const HomeRedirect = dynamic(
  () => import("@/app/home-redirect").then((module) => module.HomeRedirect),
  {
    loading: () => <main className="min-h-screen bg-background" />,
    ssr: false,
  },
);

export default function Page() {
  return <HomeRedirect />;
}
