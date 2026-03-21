import { useState } from 'react';

export default function LoginPage({ onLogin, error }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  function updateField(event) {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <section className="card login-card">
      <h2>Login</h2>
      <p className="muted">Use your super user, supervisor, or seller account credentials.</p>
      <form
        className="grid"
        onSubmit={(event) => {
          event.preventDefault();
          onLogin(credentials);
        }}
      >
        <input
          name="username"
          required
          placeholder="Username"
          value={credentials.username}
          onChange={updateField}
        />
        <input
          name="password"
          required
          placeholder="Password"
          type="password"
          value={credentials.password}
          onChange={updateField}
        />
        <button type="submit">Sign in</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <div className="hint">
        <strong>Default accounts:</strong>
        <ul>
          <li>superadmin / super123</li>
          <li>supervisor1 / supervisor123</li>
          <li>seller1 / user123</li>
        </ul>
      </div>
    </section>
  );
}