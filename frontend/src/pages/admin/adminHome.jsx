import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export default function AdminHome() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("http://localhost:8080/api/admins");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    }
    fetchUsers();
  }, []);

  return (
    <main className="flex-1 p-6 space-y-6">
      <Outlet context={{ users }} />
    </main>
  );
}

