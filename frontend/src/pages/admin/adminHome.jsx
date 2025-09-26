import React from "react";
import { Outlet } from "react-router-dom";

export default function AdminHome() {
  const users = [
    { id: "admin01", name: "a1", email: "a1@gmail.com", contact: "82910291" },
    { id: "admin02", name: "a2", email: "a2@gmail.com", contact: "91827182" },
    { id: "admin03", name: "a3", email: "a3@gmail.com", contact: "91739274" },
    { id: "doctor01", name: "d1", email: "d1@gmail.com", contact: "90173526" },
    { id: "doctor02", name: "d2", email: "d2@gmail.com", contact: "91627182" },
    { id: "doctor03", name: "d3", email: "d3@gmail.com", contact: "80192819" },
    { id: "patient01", name: "p1", email: "p1@gmail.com", contact: "92516271" },
    { id: "patient02", name: "p2", email: "p2@gmail.com", contact: "89025162" },
    { id: "patient03", name: "p3", email: "p3@gmail.com", contact: "91025463" },
    { id: "staff01", name: "s1", email: "s1@gmail.com", contact: "96573821" },
    { id: "staff02", name: "s2", email: "s2@gmail.com", contact: "81920361" },
    { id: "staff03", name: "s3", email: "s3@gmail.com", contact: "94710371" },
  ];

  return (
      <main className="flex-1 p-6 space-y-6">
        <Outlet context={{ users }} />
      </main>
  );
}
