import React, { useEffect, useState } from 'react';

const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('ecotrade_token');
      const usersRes = await fetch('http://localhost:5000/api/users?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      const itemsRes = await fetch('http://localhost:5000/api/items?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const itemsData = await itemsRes.json();
      setUsers(usersData.users || usersData);
      setItems(itemsData.items || itemsData);
    } catch (e) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('ecotrade_token');
      await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchData();
    } catch {}
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const token = localStorage.getItem('ecotrade_token');
      await fetch(`http://localhost:5000/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch {}
  };

  if (loading) return <div className="p-8">Loading admin dashboard...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <h2 className="text-xl font-semibold mb-2">Users</h2>
      <table className="w-full mb-8 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Active</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-t">
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">{user.isActive ? 'Yes' : 'No'}</td>
              <td className="p-2">
                <button
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
                  onClick={() => handleUserStatus(user._id, user.isActive)}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="text-xl font-semibold mb-2">Items</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Title</th>
            <th className="p-2">Category</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item._id} className="border-t">
              <td className="p-2">{item.title}</td>
              <td className="p-2">{item.category}</td>
              <td className="p-2">{item.status}</td>
              <td className="p-2">
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  onClick={() => handleRemoveItem(item._id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboardPage; 