"use client";

import Link from "next/link";
import React from "react";
import { useI18n } from "@/context/I18nContext";

interface BreadcrumbProps {
  /** Plain text title (supports dynamic strings from data). */
  pageTitle?: string;
  /** Message key under `titles.*` in messages JSON — works from Server Components parent. */
  titleKey?: string;
}

const PageBreadCrumb: React.FC<BreadcrumbProps> = ({ pageTitle, titleKey }) => {
  const { t } = useI18n();
  const resolved = titleKey ? t(titleKey) : pageTitle ?? "";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{resolved}</h2>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              href="/"
            >
              {t("common.home")}
              <svg
                className="stroke-current rtl:rotate-180"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          <li className="text-sm text-gray-800 dark:text-white/90">{resolved}</li>
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadCrumb;
