import React, { useEffect, useState } from 'react';
import { Users, Package, TrendingUp, AlertTriangle, Search, Filter, MoreVertical } from 'lucide-react';
import { useData } from '../context/DataContext';

const AdminPage = () => {
  const { items } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'items'>('overview');
  const [adminStats, setAdminStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError('');
      try {
        const res = await fetch('http://localhost:5000/api/users/stats/overview', {
          headers: { Authorization: `Bearer ${localStorage.getItem('ecotrade_token')}` }
        });
        const data = await res.json();
        setAdminStats(data);
      } catch (e) {
        setStatsError('Failed to load stats');
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = adminStats ? [
    {
      icon: Users,
      label: 'Total Users',
      value: adminStats.users?.total ?? '-',
      change: `+${adminStats.users?.newThisMonth ?? 0}`,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Package,
      label: 'Active Items',
      value: adminStats.items?.active ?? '-',
      change: '',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: TrendingUp,
      label: 'Completed Trades',
      value: adminStats.trades?.completed ?? '-',
      change: '',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: AlertTriangle,
      label: 'Pending Trades',
      value: adminStats.trades?.pending ?? '-',
      change: '',
      color: 'bg-red-100 text-red-600'
    }
  ] : [];

  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', joinDate: '2024-01-15', trades: 12 },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', status: 'active', joinDate: '2024-01-10', trades: 8 },
    { id: '3', name: 'Mike Chen', email: 'mike@example.com', status: 'suspended', joinDate: '2023-12-20', trades: 25 },
    { id: '4', name: 'Emma Wilson', email: 'emma@example.com', status: 'active', joinDate: '2024-01-08', trades: 15 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage platform users, items, and trades</p>
        </div>

        {/* Stats Overview */}
        {statsLoading ? (
          <div className="text-gray-500">Loading stats...</div>
        ) : statsError ? (
          <div className="text-red-500">{statsError}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-600">{stat.label}</p>
                    {stat.change && <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'users', label: 'Users' },
                { id: 'items', label: 'Items' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">New user registration</span>
                        <span className="text-sm text-gray-500">2 mins ago</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Item reported</span>
                        <span className="text-sm text-gray-500">1 hour ago</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Trade completed</span>
                        <span className="text-sm text-gray-500">3 hours ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Health</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">System Status</span>
                        <span className="text-sm text-green-600 font-medium">Operational</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">API Response Time</span>
                        <span className="text-sm text-gray-900">145ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Sessions</span>
                        <span className="text-sm text-gray-900">89</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trades
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.joinDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.trades}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Item Management</h3>
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <img
                        src={typeof item.images[0] === 'string' ? item.images[0] : '/placeholder.png'}
                        alt={item.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.category} • {item.user.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'available' ? 'bg-green-100 text-green-800' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;