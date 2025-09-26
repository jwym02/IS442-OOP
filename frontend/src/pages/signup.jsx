import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";


export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("patient");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // TODO: hook this into backend signup API
    console.log("New user registered:", { name, email, password, role });

    // Redirect to login page after successful signup
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl pt-4">
        <img
          src="/logo.png"
          alt="Clinic Logo"
          className="w-32 mx-auto bg-white rounded-xl p-4"
        />
        <h1 className="text-3xl font-bold mt-3">Sign Up</h1>
        <form onSubmit={handleSubmit} className="card-body ml-1">
          <fieldset className="fieldset space-y-1">
            {/* Name */}
            <label className="label">Name</label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Email */}
            <label className="label">Email</label>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Confirm Password */}
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input input-bordered"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
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

            {/* Submit button */}
            <button type="submit" className="btn btn-primary mt-2 mx-4">
              Sign Up
            </button>
          </fieldset>

          <p className="text-center text-sm text-gray-500 mt-2">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
