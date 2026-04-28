import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Activity, Terminal, Lock, Trash2, Edit2, 
  Plus, Database, Wifi, Loader2, Search, Cpu, Globe,
  Server, AlertTriangle, CheckCircle2, ChevronRight
} from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

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
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  tenantId: string;
  createdAt: string;
}

const DevelopPage = () => {
  const { user: authUser, isLoading: isAuthLoading } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'system'>('overview');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string } | null>(null);

  // Security Check: Strictly for ADMIN
  useEffect(() => {
    if (!isAuthLoading && !authUser) {
      navigate('/login?redirect=develop');
    }
  }, [authUser, isAuthLoading, navigate]);

  useEffect(() => {
    if (authUser?.role === 'ADMIN') {
      fetchData();
    }
  }, [authUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, lRes, dbRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/dev/logs'),
        api.get('/api/dev/db-status')
      ]);
      
      setUsers(uRes.data);
      setLogs(lRes.data.slice(0, 50));
      setDbStatus(dbRes.data);
    } catch (err) {
      console.error('System Data Fetch Failure');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      if (editingUser._id) {
        await api.put(`/api/admin/users/${editingUser._id}`, editingUser);
      } else {
        await api.post('/api/admin/users', editingUser);
      }
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      alert(`Save Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Destroy this user instance?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      fetchData();
    } catch (err) {
      alert('Deletion Failed');
    }
  };

  const runMigration = async () => {
    if (!confirm('Initiate System Migration?')) return;
    setLoading(true);
    try {
      const res = await api.post('/api/dev/migrate');
      alert(res.data.message);
      fetchData();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (!authUser || authUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20">
          <Lock size={40} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Access Restricted</h1>
        <p className="text-slate-500 max-w-md font-medium text-sm leading-relaxed mb-8">
          This portal is reserved for System Administrators. Your current role ({authUser?.role || 'Guest'}) does not have clearance.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 h-12 bg-white text-slate-950 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          Return to Base
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-mono flex">
      {/* Sidebar Control */}
      <div className="w-72 border-r border-slate-900 flex flex-col p-8 gap-10">
        <div className="flex items-center gap-4 text-white">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950">
            <Terminal size={22} />
          </div>
          <div>
            <span className="font-black tracking-tighter text-xl block leading-none">CORE-OS</span>
            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-1">Dev Portal</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'overview', icon: Cpu, label: 'Overview' },
            { id: 'users', icon: Users, label: 'Account Core' },
            { id: 'logs', icon: Activity, label: 'Event Stream' },
            { id: 'system', icon: Server, label: 'System Opts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "group flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest border",
                activeTab === tab.id 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "text-slate-500 border-transparent hover:text-white hover:bg-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={18} />
                {tab.label}
              </div>
              <ChevronRight size={14} className={cn("opacity-0 transition-all", activeTab === tab.id && "opacity-100 translate-x-1")} />
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Authenticated As</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
                {authUser.name[0]}
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-black text-white truncate">{authUser.name}</p>
                <p className="text-[9px] text-emerald-500 font-bold tracking-widest">MASTER ADMIN</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Workspace */}
      <div className="flex-1 overflow-auto p-12 custom-scrollbar">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none">{activeTab}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time System Oversight Active
            </p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-3 px-6 h-12 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400 disabled:opacity-50 font-bold uppercase text-[10px] tracking-widest"
          >
            <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Hardware
          </button>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                  <Database size={24} />
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Database Pulse</h3>
                <p className="text-3xl font-black text-white mb-4 lowercase">{dbStatus?.status || 'OFFLINE'}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  {dbStatus?.queryTest === 'Success' ? (
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Latency Stable</span>
                  ) : (
                    <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase">Interrupted</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                  <Users size={24} />
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">User Ecosystem</h3>
                <p className="text-3xl font-black text-white mb-4">{users.length} <span className="text-lg text-slate-500 font-medium whitespace-nowrap">ENTITIES</span></p>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} className="text-blue-400" />
                  Across {new Set(users.map(u => u.tenantId)).size} Active Tenants
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                  <Activity size={24} />
                </div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Compute Load</h3>
                <p className="text-3xl font-black text-white mb-4">V3.1.2 <span className="text-lg text-slate-500 font-medium">STABLE</span></p>
                <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase">
                  Runtime: Nodejs 20.x
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 p-10 rounded-[50px] border border-slate-900">
                <h2 className="text-xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                  <Wifi size={20} className="text-emerald-500" />
                  Cluster Telemetry
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Cloud Provider', value: dbStatus?.atlas ? 'MongoDB Atlas (GCP)' : 'Local Hardware' },
                    { label: 'Cluster Host', value: dbStatus?.host || 'Unknown', secret: false },
                    { label: 'Primary DB', value: dbStatus?.dbName || 'N/A' },
                    { label: 'Region', value: 'Singapore (asia-southeast1)' }
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center p-5 bg-slate-950/50 border border-slate-900 rounded-3xl">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</span>
                      <span className={cn("text-xs font-bold text-white max-w-[200px] truncate")}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 p-10 rounded-[50px] border border-slate-900 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 border border-emerald-500/20">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">System Integrity</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10 max-w-[250px]">
                  All maintenance triggers and security protocols are active.
                </p>
                <button 
                  onClick={runMigration}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-950/30"
                >
                  Force Data Migration
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter by UUID or Identity..."
                  className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm"
                />
              </div>
              <button 
                onClick={() => setEditingUser({ name: '', role: 'STAFF', tenantId: authUser.tenantId })}
                className="h-14 px-8 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={20} />
                Provision User
              </button>
            </div>

            <div className="bg-slate-900/40 rounded-[40px] border border-slate-900 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-900">
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Clearance</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created Threshold</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-white border border-slate-700">
                            {u.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm uppercase">{u.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{u._id} | {u.tenantId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                          u.role === 'ADMIN' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : 
                          u.role === 'MANAGER' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-8 text-xs font-bold text-slate-500 tabular-nums">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                      <td className="p-8">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingUser(u)} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(u._id)} className="p-3 bg-rose-500/10 rounded-xl text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-10 font-mono text-[11px] leading-relaxed">
            <div className="flex flex-col gap-2">
              {logs.length > 0 ? logs.map((log, i) => (
                <div key={i} className="flex gap-6 p-3 hover:bg-slate-950 rounded-xl transition-all border border-transparent hover:border-slate-800 group">
                  <span className="text-slate-600 font-bold tabular-nums">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={cn(
                    "font-black w-20 text-center rounded px-2 py-0.5 uppercase tracking-widest",
                    log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 
                    log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.method === 'PUT' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                  )}>{log.method}</span>
                  <span className={cn(
                    "font-black tabular-nums",
                    log.status >= 200 && log.status < 300 ? "text-emerald-500" : "text-rose-500"
                  )}>{log.status}</span>
                  <span className="text-white flex-1 truncate font-medium">{log.path}</span>
                  <span className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{log.duration} • {log.ip}</span>
                </div>
              )) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-600 uppercase font-black tracking-widest animate-pulse">
                  <Activity size={40} className="mb-4" />
                  Awaiting Packet Stream
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-slate-900 p-12 rounded-[50px] border border-slate-800">
               <h3 className="text-2xl font-black text-rose-500 mb-6 uppercase tracking-tight">Danger Zone</h3>
               <p className="text-slate-500 text-sm mb-10 font-medium">Critical system operations. Use with caution as these may interrupt service.</p>
               <div className="space-y-4">
                 <button className="w-full h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Flush Logs Memory</button>
                 <button onClick={runMigration} className="w-full h-16 bg-slate-950 border border-rose-500/20 text-rose-500 rounded-3xl font-black uppercase tracking-widest hover:border-rose-500 transition-all">Deep Schema Rebuild</button>
               </div>
             </div>
             <div className="bg-emerald-600 p-12 rounded-[50px] text-slate-950 flex flex-col justify-center">
               <Shield size={64} className="mb-8" />
               <h3 className="text-4xl font-black mb-4 uppercase tracking-tighter">System Locked</h3>
               <p className="text-emerald-950/70 font-black uppercase tracking-widest text-xs mb-8">
                 Security Protocols Active: RBAC Level 4 <br/>
                 Environment: {process.env.NODE_ENV || 'Production'}
               </p>
               <div className="bg-emerald-950/20 p-6 rounded-3xl border border-emerald-950/10">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Build Identifier</p>
                 <p className="text-xl font-bold font-mono">SG-AN-POS-2024.04.28</p>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* User Provisioning Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingUser(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[50px] p-12 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{editingUser._id ? 'Update Entity' : 'New Provision'}</h2>
                <button onClick={() => setEditingUser(null)} className="p-3 text-slate-500 hover:text-white transition-colors"><Lock size={24} /></button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Master Name</label>
                    <input type="text" required value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full h-16 bg-slate-950 border border-slate-800 rounded-3xl px-6 text-white focus:border-emerald-500 transition-all font-bold"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Access Role</label>
                    <select value={editingUser.role || 'STAFF'} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })} className="w-full h-16 bg-slate-950 border border-slate-800 rounded-3xl px-6 text-white focus:border-emerald-500 transition-all font-bold">
                       <option value="STAFF">FIELD STAFF</option>
                       <option value="MANAGER">DEPARTMENT MANAGER</option>
                       <option value="ADMIN">MASTER ADMIN</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Communication Email</label>
                    <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full h-16 bg-slate-950 border border-slate-800 rounded-3xl px-6 text-white focus:border-emerald-500 transition-all font-bold"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Primary Contact</label>
                    <input type="tel" value={editingUser.phone || ''} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} className="w-full h-16 bg-slate-950 border border-slate-800 rounded-3xl px-6 text-white focus:border-emerald-500 transition-all font-bold"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tenant Identifier</label>
                  <input type="text" value={editingUser.tenantId || ''} onChange={e => setEditingUser({ ...editingUser, tenantId: e.target.value })} className="w-full h-16 bg-slate-950 border border-slate-800 rounded-3xl px-6 text-white focus:border-emerald-500 transition-all font-bold"/>
                </div>
                <button type="submit" className="w-full h-20 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-emerald-950/50 hover:scale-[1.02] active:scale-95 transition-all">Submit Protocol Change</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DevelopPage;
