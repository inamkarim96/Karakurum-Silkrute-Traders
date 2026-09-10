import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button, Badge, Input } from '../components/ui';

import * as adminApi from '../api/admin';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllUsers({ search: searchTerm || undefined });
      if (res.success) setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Unable to load customers. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    try {
      await adminApi.updateUserStatus(user.id, !user.is_active);
      toast.success(`User ${!user.is_active ? 'activated' : 'suspended'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-users">
      <div className="page-header">
        <div>
          <h1>Customer Accounts</h1>
          <p>Manage customer accounts, activate/deactivate users, and monitor user activity.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUsers()}
          icon={Search}
          containerClassName="mb-0 flex-1"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <p className="state-msg">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="state-msg">No users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-200">
                      {u.name ? u.name.substring(0, 2).toUpperCase() : <User size={14} />}
                    </div>
                  </td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <Badge variant={u.role === 'admin' ? 'warning' : 'success'}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={u.is_active ? 'success' : 'error'} pill={false}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <Button 
                      onClick={() => handleToggleStatus(u)}
                      variant={u.is_active ? 'admin-danger' : 'admin-primary'}
                      size="sm"
                    >
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      
    </div>
  );
};

export default AdminUsers;
