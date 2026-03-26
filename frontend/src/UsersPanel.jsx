import { getRoleLabel, normalizeRole, SELLER_ROLE } from '../utils';

export default function UsersPanel({ user, users, form, onFormChange, onCreateUser, onDeleteUser }) {
  if (!['super', 'supervisor'].includes(normalizeRole(user.role))) {
    return null;
  }

  const roleOptions = normalizeRole(user.role) === 'super' ? ['supervisor', SELLER_ROLE] : [SELLER_ROLE];

  return (
    <section className="card">
      <h2>Manage Users</h2>
      <form className="grid" onSubmit={onCreateUser}>
        <input
          required
          placeholder="username"
          value={form.username}
          onChange={(event) => onFormChange((prev) => ({ ...prev, username: event.target.value }))}
        />
        <input
          required
          type="password"
          placeholder="password"
          value={form.password}
          onChange={(event) => onFormChange((prev) => ({ ...prev, password: event.target.value }))}
        />
        <select
          value={form.role}
          onChange={(event) => onFormChange((prev) => ({ ...prev, role: event.target.value }))}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {getRoleLabel(role)}
            </option>
          ))}
        </select>
        <button type="submit" className="full-line-field normal-size-button">
          Add user
        </button>
      </form>

      <ul className="user-list">
        {users.map((entry) => (
          <li key={entry._id}>
            <span>
              {entry.username} ({getRoleLabel(entry.role)})
            </span>
            {normalizeRole(entry.role) !== 'super' ? <button onClick={() => onDeleteUser(entry._id)}>Remove</button> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
