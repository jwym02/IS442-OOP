import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, devBypassLogin } = useAuth();
  const navigate = useNavigate();
  const devBypassEnabled = import.meta.env.VITE_ENABLE_FAKE_LOGIN === 'true' || import.meta.env.DEV;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 class="font-bold">SingHealth Clinic System</h1>
        <h2>Login</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>

        {devBypassEnabled && (
          <div className="dev-bypass">
            <div className="dev-bypass__title">Development shortcuts</div>
            <div className="dev-bypass__buttons">
              {['PATIENT', 'STAFF', 'DOCTOR', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    const res = await devBypassLogin(role);
                    if (res.success) {
                      navigate('/dashboard');
                    } else {
                      setError(
                        res.error ||
                          'Dev bypass is disabled. Ensure VITE_ENABLE_FAKE_LOGIN=true and restart the frontend dev server.'
                      );
                    }
                  }}
                >
                  Skip as {role}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="auth-link">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}
