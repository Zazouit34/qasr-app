import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Calendrier | Qasr",
  description: "Calendrier des réservations",
};

export default function page() {
  return (
    <div>
      <PageBreadcrumb titleKey="titles.calendar" />
      <Calendar />
    </div>
  );
}
