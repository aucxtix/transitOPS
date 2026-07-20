import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { RoleGate } from '../components/ui/RoleGate';
import { format } from 'date-fns';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/audit');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'LOGIN': return 'text-emerald-500 bg-emerald-500/10';
      case 'LOGOUT': return 'text-amber-500 bg-amber-500/10';
      case 'POST': return 'text-blue-500 bg-blue-500/10';
      case 'PUT': 
      case 'PATCH': return 'text-violet-500 bg-violet-500/10';
      case 'DELETE': return 'text-red-500 bg-red-500/10';
      default: return 'text-foreground bg-foreground/10';
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-border rounded-xl"></div>;

  return (
    <RoleGate allowedRoles={['Fleet Manager']} fallback={<div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Log History</h1>
          <p className="text-foreground/60 text-sm mt-1">Audit trail of actions and logins across the panel.</p>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/5 border-b border-border text-foreground/70 font-medium">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity/Path</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-6 py-4 text-foreground/70 whitespace-nowrap">
                      {format(new Date(l.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      {l.user_name ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{l.user_name}</span>
                          <span className="text-xs text-foreground/50">{l.user_email}</span>
                        </div>
                      ) : (
                        <span className="text-foreground/50 italic">System / Unauth</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getActionColor(l.action)}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{l.entity}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs md:max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-xs text-foreground/60" title={l.details}>
                        {l.details}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-foreground/50">No logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGate>
  );
};

export default AuditLogs;
