'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Lock, Check, X, Shield } from 'lucide-react';
import styles from './page.module.css';

function getFriendlyError(err: any, fallback: string): string {
  const msg = err?.message || '';
  if (!msg || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('typeerror') || msg.toLowerCase().includes('database') || msg.toLowerCase().includes('internal server error')) {
    return 'Unable to connect to the server. Please check your network connection and try again.';
  }
  return msg;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER' | 'GUEST';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN' as 'SUPERADMIN' | 'ADMIN' | 'MEMBER' | 'GUEST',
    is_active: true
  });

  const [passwordData, setPasswordData] = useState({
    userId: 0,
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation function
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*...)' };
    }
    return { valid: true, message: '' };
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setCurrentUserRole(data.user.role);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ADMIN',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password for new users
    if (!editingUser && formData.password) {
      const validation = validatePassword(formData.password);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    }

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(getFriendlyError(err, 'Failed to save user. Please try again.'));
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      fetchUsers();
    } catch (err: any) {
      setError(getFriendlyError(err, 'Failed to update status. Please try again.'));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      fetchUsers();
    } catch (err: any) {
      setError(getFriendlyError(err, 'Failed to delete user. Please try again.'));
    }
  };

  const handleOpenPasswordModal = (userId: number) => {
    setPasswordData({
      userId,
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validation = validatePassword(passwordData.newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${passwordData.userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordData.newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setShowPasswordModal(false);
      alert('Password updated successfully');
    } catch (err: any) {
      setError(getFriendlyError(err, 'Failed to update password. Please try again.'));
    }
  };

  if (currentUserRole !== 'SUPERADMIN') {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <Shield size={48} />
          <h2>Access Denied</h2>
          <p>Only SUPERADMIN users can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Users size={32} />
          <div>
            <h1>User Management</h1>
            <p>Manage system users and permissions</p>
          </div>
        </div>
        <button className={styles.createBtn} onClick={handleCreateUser}>
          <UserPlus size={18} />
          Create User
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span>⚠</span>
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading users...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge${user.role}`]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`${styles.statusBtn} ${user.is_active ? styles.active : styles.inactive}`}
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                    >
                      {user.is_active ? <Check size={14} /> : <X size={14} />}
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleEditUser(user)}
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleOpenPasswordModal(user.id)}
                        title="Change Password"
                      >
                        <Lock size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {!editingUser && (
                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Must contain: uppercase, lowercase, number, and special character
                  </small>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  <option value="SUPERADMIN">SUPERADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="GUEST">GUEST</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active User</span>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className={styles.formGroup}>
                <label>New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Must contain: uppercase, lowercase, number, and special character
                </small>
              </div>
              <div className={styles.formGroup}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
