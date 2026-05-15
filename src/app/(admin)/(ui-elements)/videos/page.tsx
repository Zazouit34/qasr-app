import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import VideosExample from "@/components/ui/video/VideosExample";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Videos | TailAdmin - Next.js Dashboard Template",
};

export default function VideoPage() {
  return (
    <div>
      <PageBreadcrumb titleKey="titles.videos" />
      <div className="mt-6 space-y-5 sm:space-y-6">
        <VideosExample />
      </div>
    </div>
  );
}
