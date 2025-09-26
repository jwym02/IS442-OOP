import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("patient");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Save user to AuthContext
    login(email, role);

    // Redirect based on role (TODO: check if user in users database table)
    if (role === "patient") navigate("/patient/dashboard");
    if (role === "staff") navigate("/staff/dashboard");
    if (role === "admin") navigate("/admin/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl py-6">
        <img src="/logo.png" alt="" className="w-32 mx-auto bg-white rounded-xl p-4" />
        <h1 className="text-3xl font-bold mt-3">Login</h1>
        <form onSubmit={handleSubmit} className="card-body ml-1">
          <fieldset className="fieldset space-y-1">
            {/* Email */}
            <label className="label mt-0">Email</label>
            <input
              type="email"
              className="input input-bordered"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password */}
            <label className="label">Password</label>
            <input
              type="password"
              className="input input-bordered"
              placeholder="Password"
            />

            {/* Role */}
            <label className="label">Role</label>
            <select
              className="select select-bordered"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="patient">Patient</option>
              <option value="staff">Clinic Staff</option>
              <option value="admin">System Admin</option>
            </select>


            <div className="text-right mr-4">
              <a className="link link-hover">Forgot password?</a>
            </div>

            {/* Submit button */}
            <button type="submit" className="btn btn-primary mt-2 mx-4">
              Login
            </button>
          </fieldset>

          <p className="text-center text-sm text-gray-500 mt-2">
            Don't have an account?{" "}
            <Link to="/signup" className="link link-primary">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
