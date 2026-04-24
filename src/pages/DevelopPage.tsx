import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Terminal, Lock, Trash2, Edit2, Plus, Database, Wifi, Loader2, Search } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration: string;
  ip: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

const DevelopPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'db'>('users');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    localStorage.removeItem('token'); // Clear any stale token
    try {
      // Step 1: Client side check for developer portal access
      if (credentials.email === 'admin@sganpos.vn' && credentials.password === 'admin@123') {
        // Step 2: Attempt real backend login to get session token/cookie
        try {
          const res = await api.post('/api/auth/login', credentials);
          if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            console.log('Login success: Backend token stored');
          }
        } catch (authErr: any) {
          const msg = authErr.response?.data?.error || authErr.message;
          console.error('Backend auth failed:', msg);
          alert(`Backend Auth Error: ${msg}. Terminal will still open but admin APIs may fail.`);
        }
        
        setIsAuthenticated(true);
        await fetchData();
      } else {
        alert('Sai tài khoản hoặc mật khẩu hệ quản trị!');
      }
    } catch (err) {
      alert('Lỗi khởi tạo truy cập');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, l, d] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/dev/logs'),
        api.get('/api/dev/db-status')
      ]);
      setUsers(u.data);
      setLogs(l.data);
      setDbStatus(d.data);
    } catch (err) {
      console.error('Failed to fetch dev data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        if (activeTab === 'logs') {
          api.get('/api/dev/logs').then(res => setLogs(res.data));
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.email || !editingUser?.name) return;
    try {
      if (editingUser._id) {
        await api.put(`/api/admin/users/${editingUser._id}`, editingUser);
      } else {
        await api.post('/api/admin/users', editingUser);
      }
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      alert(`Lỗi khi lưu người dùng: ${msg}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Xóa người dùng này?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      fetchData();
    } catch (err) {
      alert('Lỗi khi xóa người dùng');
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Seed demo data for org "demo"? Only works if collections are empty.')) return;
    setLoading(true);
    try {
      await api.post('/api/dev/seed', { tenantId: 'demo' });
      alert('Seeding complete!');
    } catch (err) {
      alert('Seeding failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-mono">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Shield size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tighter">DEVELOPER ACCESS</h1>
          <p className="text-slate-500 text-center text-xs mb-8 uppercase tracking-widest font-bold">Authorized Personnel Only</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Admin Email</label>
              <input 
                type="email"
                required
                placeholder="admin@sganpos.vn"
                className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                value={credentials.email}
                onChange={e => setCredentials({ ...credentials, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Access Key</label>
              <input 
                type="password"
                required
                className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold tracking-widest"
                value={credentials.password}
                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
              />
            </div>
            <button className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest transition-all mt-6 shadow-lg shadow-emerald-900/20 active:scale-95">
              INITIATE LOGIN
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-mono flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-900 flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3 text-white">
          <Terminal size={24} className="text-emerald-500" />
          <span className="font-black tracking-tighter text-xl">SGAN-OS DEV</span>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'users', icon: Users, label: 'User Admin' },
            { id: 'logs', icon: Activity, label: 'Live Logs' },
            { id: 'db', icon: Database, label: 'DB Health' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm uppercase tracking-widest",
                activeTab === tab.id 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                  : "text-slate-500 hover:text-white hover:bg-slate-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-900">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all w-full font-bold uppercase tracking-widest text-xs"
          >
            <Lock size={16} />
            Terminate
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{activeTab}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">System Development Control Panel</p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-3 bg-slate-900 rounded-xl hover:bg-slate-800 transition-all text-slate-400 disabled:opacity-50"
          >
            <Loader2 className={cn("w-6 h-6", loading && "animate-spin")} />
          </button>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Users</p>
                  <p className="text-2xl font-black text-white">{users.length}</p>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Orgs</p>
                  <p className="text-2xl font-black text-white">{new Set(users.map(u => u.tenantId)).size}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser({ name: '', email: '', role: 'STAFF', tenantId: 'demo' })}
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
              >
                <Plus size={18} />
                Create Instance
              </button>
            </div>

            <div className="bg-slate-900/30 rounded-3xl border border-slate-900 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-900">
                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name & Entity</th>
                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</th>
                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access Role</th>
                    <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-slate-900/50 hover:bg-slate-900/20 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-white uppercase">{user.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1">UUID: {user._id} | Org: {user.tenantId}</div>
                      </td>
                      <td className="p-6 text-slate-400 font-medium">{user.email}</td>
                      <td className="p-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                          user.role === 'ADMIN' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-end gap-2">
                          <button 
                            className="p-2 text-slate-500 hover:text-white transition-colors"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                            onClick={() => handleDeleteUser(user._id)}
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

            {/* User Edit Modal */}
            <AnimatePresence>
              {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingUser(null)}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl"
                  >
                    <h2 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase">
                      {editingUser._id ? 'Update Entity' : 'New User Instance'}
                    </h2>
                    <form onSubmit={handleSaveUser} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Full Name</label>
                          <input 
                            type="text" required
                            className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white focus:border-emerald-500 transition-all font-bold"
                            value={editingUser.name || ''}
                            onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email</label>
                          <input 
                            type="email" required
                            className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white focus:border-emerald-500 transition-all font-bold"
                            value={editingUser.email || ''}
                            onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Role</label>
                          <select 
                            className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white focus:border-emerald-500 transition-all font-bold"
                            value={editingUser.role || 'STAFF'}
                            onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                          >
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tenant ID</label>
                          <input 
                            type="text" required
                            className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white focus:border-emerald-500 transition-all font-bold"
                            value={editingUser.tenantId || 'demo'}
                            onChange={e => setEditingUser({ ...editingUser, tenantId: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                        <button type="button" onClick={() => setEditingUser(null)} className="flex-1 h-14 text-slate-500 font-bold uppercase">Cancel</button>
                        <button type="submit" className="flex-[2] h-14 bg-emerald-600 rounded-2xl text-white font-black uppercase tracking-widest">Commit Changes</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 overflow-hidden font-mono text-xs">
              <div className="flex flex-col gap-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 p-2 hover:bg-slate-800 rounded transition-colors group">
                    <span className="text-slate-600 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={cn(
                      "font-black min-w-[60px]",
                      log.method === 'GET' ? 'text-blue-400' : 
                      log.method === 'POST' ? 'text-emerald-400' :
                      log.method === 'PUT' ? 'text-amber-400' : 'text-rose-400'
                    )}>{log.method}</span>
                    <span className="text-slate-400">{log.status}</span>
                    <span className="text-white flex-1 truncate">{log.path}</span>
                    <span className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{log.duration} • {log.ip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'db' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px]">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20">
                <Database size={32} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Connection Pulse</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", dbStatus?.status === 'Connected' ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
                    <span className="text-white font-black">{dbStatus?.status || 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Atlas Verified</span>
                  <span className={cn("font-black", dbStatus?.atlas ? "text-emerald-500" : "text-amber-500")}>
                    {dbStatus?.atlas ? 'YES (Cloud)' : 'NO (Local)'}
                  </span>
                </div>
              </div>
            </div >
            <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-8 border border-emerald-500/20">
                 <Wifi size={32} />
               </div>
               <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Atlas Status</h3>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Cluster Health & Performance</p>
               <div className="text-emerald-500 font-black animate-pulse uppercase tracking-[0.2em] mb-8">All Systems Nominal</div>
               <button 
                onClick={handleSeedData}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all"
               >
                 Seed Demo Data
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevelopPage;
