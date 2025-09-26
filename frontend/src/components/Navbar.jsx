// src/components/Navbar.jsx
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <nav className="w-full bg-base-200 shadow px-6 py-3 flex justify-between items-center">
        <div className="flex gap-3 items-center">
            <img src="/logo.png" alt="" className="w-14 mx-auto bg-white rounded-xl p-2" />
            <NavLink
            to={`/${user.role}/home`}
            className={({ isActive }) =>
                isActive ? "font-bold text-primary" : "font-bold"
            }
            >
            <span className="capitalize">{user.role} Portal</span>
        </NavLink>
        </div>

      <div className="menu menu-horizontal">
        {user.role === "admin" && (
          <>
            <li><NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? "font-bold text-primary" : "")}>
              Dashboard
            </NavLink></li>
            <li><NavLink to="/admin/user-management" className={({ isActive }) => (isActive ? "font-bold text-primary" : "")}>
              User Management
            </NavLink></li>
          </>
        )}

        {user.role === "patient" && (
          <>
            
          </>
        )}

        {user.role === "staff" && (
          <>

          </>
        )}
      </div>

      <button onClick={logout} className="btn btn-sm btn-secondary">
        Logout
      </button>
    </nav>
  );
}
