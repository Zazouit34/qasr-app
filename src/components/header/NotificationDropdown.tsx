"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type NotifPayload = {
  total: number;
  items: { type: string; label: string; count: number }[];
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<NotifPayload | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    void fetch("/api/notifications", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data as NotifPayload);
      })
      .catch(() => setData(null));
  }, [isOpen]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const total = data?.total ?? 0;

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {total > 0 ? (
          <span className="absolute right-0 top-0.5 z-10 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-medium text-white">
            {total > 99 ? "99+" : total}
          </span>
        ) : null}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications Qasr
          </h5>
        </div>
        <ul className="flex flex-col overflow-y-auto custom-scrollbar">
          {data?.items?.length ? (
            data.items.map((it) => (
              <li key={it.type}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  href="/payments"
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span className="block">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {it.label}
                    </span>
                    <span className="ml-2 text-theme-sm text-brand-500">
                      {it.count}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-center text-theme-sm text-gray-500">
              Aucune alerte active.
            </li>
          )}
        </ul>
        <Link
          href="/payments"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          onClick={closeDropdown}
        >
          Voir les paiements
        </Link>
      </Dropdown>
    </div>
  );
}
