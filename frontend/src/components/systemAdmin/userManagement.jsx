import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function UserManagement() {
  // get users from Outlet context
  const { users = [] } = useOutletContext();
  
  for (let i = 0; i < users.length; i++) {
    console.log(users[i])
  }

  const [activeRole, setActiveRole] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const getRole = (id) => {
    if (id.startsWith("admin")) return "System Admin";
    if (id.startsWith("doctor")) return "Staff";
    if (id.startsWith("staff")) return "Staff";
    if (id.startsWith("patient")) return "Patient";
    return "Unknown";
  };

  const filteredUsers =
    activeRole === "all"
      ? users
      : users.filter((u) => getRole(u.id).toLowerCase() === activeRole);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
  }, [pageSize, filteredUsers, totalPages, currentPage]);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleBackup = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/admins/backup", {
        method: "POST",
      });
      const text = await response.text();
      alert(text);
    } catch (error) {
      console.error("Error triggering backup:", error);
      alert("Backup failed. See console for details.");
    }
  };

  return (
    <div className="card shadow-xl p-4">
      <div className="flex justify-between mb-3">
        <h2 className="text-xl font-bold">User Management</h2>
        <button className="btn btn-primary btn-sm">+ Create User</button>
      </div>

      {/* Tabs */}
      <div className="tabs mb-4">
        <a
          className={`tab tab-bordered ${
            activeRole === "all" ? "tab-active" : ""
          }`}
          onClick={() => setActiveRole("all")}
        >
          All
        </a>
        <a
          className={`tab tab-bordered ${
            activeRole === "system admin" ? "tab-active" : ""
          }`}
          onClick={() => setActiveRole("system admin")}
        >
          System Admin
        </a>
        <a
          className={`tab tab-bordered ${
            activeRole === "staff" ? "tab-active" : ""
          }`}
          onClick={() => setActiveRole("staff")}
        >
          Staff
        </a>
        <a
          className={`tab tab-bordered ${
            activeRole === "patient" ? "tab-active" : ""
          }`}
          onClick={() => setActiveRole("patient")}
        >
          Patient
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.contact}</td>
                <td>{getRole(u.id)}</td>
                <td>
                  <button className="btn btn-xs btn-warning mr-2" onClick={()=>document.getElementById(`edit-${u.id}`).showModal()}>Edit</button>
                  {/* Edit Modal */}
                  <dialog id={`edit-${u.id}` }className="modal">
                    <div className="modal-box">
                      <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                      </form>
                      <h3 className="font-bold text-lg mb-4">Edit {u.id}</h3>
                      <form action="" className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label htmlFor="name" className="w-16">Name</label>
                          <input id="name" type="text" defaultValue={u.name} class="input" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label htmlFor="email" className="w-16">Email</label>
                          <input id="email" type="text" defaultValue={u.email} class="input" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label htmlFor="contact" className="w-16">Contact</label>
                          <input id="contact" type="text" defaultValue={u.contact} class="input" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label htmlFor="role" className="w-16">Role</label>
                          <select id="role" defaultValue="Role" className="select">
                            <option disabled={true}>Pick a color</option>
                            <option>Patient</option>
                            <option>Doctor</option>
                            <option>Admin</option>
                            <option>Staff</option>
                          </select>
                        </div>
                        <div className="flex justify-between mt-4">
                          <button class="btn btn-ghost">Reset</button>
                          <button className="btn btn-primary">Edit</button>
                        </div>
                      </form>
                    </div>
                  </dialog>
                  <button className="btn btn-xs btn-error">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedUsers.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No users found.</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-4">
          Page Size:
          <div className="btn-group">
            {[10, 50, 100].map((size) => (
              <button
                key={size}
                className={`btn btn-sm ${
                  pageSize === size ? "btn-primary" : ""
                }`}
                onClick={() => handlePageSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="join">
          <button
            className="btn btn-sm join-item"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button className="btn btn-sm join-item" disabled>
            Page {currentPage} of {totalPages || 1}
          </button>
          <button
            className="btn btn-sm join-item"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <button className="btn btn-info w-50" onClick={handleBackup}>
        Backup Data
      </button>
    </div>
  );
}
