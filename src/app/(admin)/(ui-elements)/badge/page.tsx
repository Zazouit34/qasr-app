import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { PlusIcon } from "@/icons";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Badge | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Badge page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function BadgePage() {
  const lightVariants = ["primary", "success", "error", "warning", "info", "light", "dark"] as const;
  const solidVariants = ["primary", "success", "error", "warning", "info", "light", "dark"] as const;

  return (
    <div>
      <PageBreadcrumb titleKey="titles.badges" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="With Light Background">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {lightVariants.map((color) => (
              <Badge key={color} variant="light" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="With Solid Background">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {solidVariants.map((color) => (
              <Badge key={color} variant="solid" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Light Background with Left Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {lightVariants.map((color) => (
              <Badge key={color} variant="light" color={color} startIcon={<PlusIcon />}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Solid Background with Left Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {solidVariants.map((color) => (
              <Badge key={color} variant="solid" color={color} startIcon={<PlusIcon />}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Light Background with Right Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {lightVariants.map((color) => (
              <Badge key={color} variant="light" color={color} endIcon={<PlusIcon />}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Solid Background with Right Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {solidVariants.map((color) => (
              <Badge key={color} variant="solid" color={color} endIcon={<PlusIcon />}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
