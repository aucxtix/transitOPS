import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, Trash2, UserPlus, CheckCircle2, Edit2, Save } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [declaredUser, setDeclaredUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleName: 'Dispatcher'
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isFleetManager = currentUser.role === 'Fleet Manager';
  const roles = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver'];
  const selectableRoles = roles.filter(r => r !== 'Driver');

  const fetchUsers = async () => {
    if (!isFleetManager) return;
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isFleetManager]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Leave blank so we only update if provided
      roleName: user.roleName
    });
    setError('');
    setSuccess('');
    setDeclaredUser(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', roleName: 'Driver' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDeclaredUser(null);
    
    try {
      if (editingId) {
        // Edit mode
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password; // Don't send empty password
        }
        await api.put(`/users/${editingId}`, payload);
        setSuccess('User updated successfully.');
        setEditingId(null);
        setFormData({ name: '', email: '', password: '', roleName: 'Driver' });
        fetchUsers();
      } else {
        // Add mode
        const { data } = await api.post('/users', formData);
        setSuccess('User created successfully.');
        setDeclaredUser(data.user);
        setFormData({ name: '', email: '', password: '', roleName: 'Driver' });
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || `Failed to ${editingId ? 'update' : 'add'} user`);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError('');
    setSuccess('');
    setDeclaredUser(null);
    try {
      await api.delete(`/users/${id}`);
      setSuccess('User deleted successfully.');
      if (editingId === id) cancelEdit();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings & RBAC</h1>
        <p className="text-foreground/50 font-medium mt-1">Configure system parameters and role profiles.</p>
      </div>

      <div className="glass-panel rounded-3xl p-8 space-y-6">
        <div className="flex items-start gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl">
          <ShieldCheck size={24} className="mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Role-Based Access is Active</h3>
            <p className="text-sm text-indigo-500/80 mt-1">
              Permissions are configured securely on the backend across 4 independent security layers: UI display, router level, API endpoints, and controller layer validation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground/50">Active Roles</h4>
            <div className="space-y-2">
              {roles.map((role, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 bg-foreground/5 rounded-2xl text-sm font-semibold">
                  <span>{role}</span>
                  <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full">Seeded</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground/50">System Logs & Integrity</h4>
            <div className="p-4 bg-card rounded-2xl border border-border/40 text-sm space-y-3">
              <div className="flex justify-between text-xs text-foreground/50">
                <span>Database persistence:</span>
                <span className="font-mono">SQLite (better-sqlite3)</span>
              </div>
              <div className="flex justify-between text-xs text-foreground/50">
                <span>JWT encryption:</span>
                <span className="font-mono">HS256</span>
              </div>
              <div className="flex justify-between text-xs text-foreground/50">
                <span>Rate limiting:</span>
                <span className="font-mono">Active (100 req / 15m)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFleetManager && (
        <div className="glass-panel rounded-3xl p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UserCheck size={20} className="text-primary" />
              User Management
            </h3>
            <p className="text-sm text-foreground/50 mt-1">Add, edit, or remove users from the system.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">{success}</span>
              </div>
              {declaredUser && (
                <div className="mt-2 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20 text-sm">
                  <p className="font-semibold mb-1">New User Details:</p>
                  <p><strong>Username/Name:</strong> {declaredUser.name}</p>
                  <p><strong>Email:</strong> {declaredUser.email}</p>
                  <p><strong>Password:</strong> <span className="font-mono">{declaredUser.declaredPassword}</span></p>
                  <p className="text-xs mt-2 text-emerald-500/80">Please securely share these credentials with the user. They will not be shown again.</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Name / Username</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name" 
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required 
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Email</label>
              <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required 
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-semibold text-foreground/70 mb-1">
                {editingId ? "New Password (Optional)" : "Password"}
              </label>
              <input 
                type="text" 
                name="password" 
                placeholder={editingId ? "Leave blank to keep" : "Password"} 
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required={!editingId} 
                minLength={6}
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Role</label>
              <select 
                name="roleName" 
                value={formData.roleName}
                onChange={handleInputChange}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                {selectableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <p className="text-[10px] text-foreground/50 mt-1">Note: Drivers must be added from the Drivers section.</p>
            </div>
            <div className="col-span-1 md:col-span-2 flex gap-2 h-[42px]">
              <button 
                type="submit" 
                className="flex-1 bg-primary text-primary-foreground font-semibold rounded-xl px-4 py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                {editingId ? <><Save size={16} /> Update</> : <><UserPlus size={16} /> Add</>}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="bg-foreground/10 text-foreground font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-foreground/20 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto border border-border/30 rounded-2xl mt-4">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-foreground/5 text-foreground/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-foreground/50">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-foreground/50">No users found.</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {user.roleName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.id !== currentUser.id && (
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
