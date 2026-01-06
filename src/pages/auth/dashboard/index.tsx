import { Link } from 'react-router-dom';
import EChart from '../../../components/charts/EChart';

const Dashboard = () => {
  // Mock data for dashboard
  const stats = [
    { title: 'Total Items', value: '1,234', color: 'bg-blue-500' },
    { title: 'Low Stock', value: '12', color: 'bg-red-500' },
    { title: 'Total Value', value: '$45,678', color: 'bg-green-500' },
    { title: 'Pending Orders', value: '5', color: 'bg-yellow-500' },
  ];

  const recentActivity = [
    { id: 1, action: 'Added new item "Wireless Mouse"', time: '2 hours ago' },
    { id: 2, action: 'Updated stock for "Mechanical Keyboard"', time: '4 hours ago' },
    { id: 3, action: 'Low stock alert: "USB-C Cable"', time: '5 hours ago' },
    { id: 4, action: 'Removed item "Old Monitor"', time: '1 day ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Welcome back to your inventory overview.</p>
          </div>
          <div className="space-x-4">
             {/* Placeholder for future actions */}

          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 border-l-4 border-transparent hover:border-indigo-500 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Weekly Sales Trend</h3>
            </div>
            <div className="p-4">
              <EChart
                option={{
                  grid: { top: 32, left: 40, right: 16, bottom: 32 },
                  tooltip: { trigger: 'axis' },
                  xAxis: { type: 'category', boundaryGap: false, data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
                  yAxis: { type: 'value' },
                  series: [
                    {
                      name: 'Sales',
                      type: 'line',
                      smooth: true,
                      areaStyle: {},
                      data: [120, 200, 150, 80, 70, 110, 130],
                    },
                  ],
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Stock Levels by Category</h3>
            </div>
            <div className="p-4">
              <EChart
                option={{
                  grid: { top: 32, left: 40, right: 16, bottom: 32 },
                  tooltip: { trigger: 'item' },
                  xAxis: { type: 'category', data: ['Peripherals', 'Cables', 'Accessories', 'Monitors', 'Keyboards'] },
                  yAxis: { type: 'value' },
                  series: [
                    {
                      name: 'In Stock',
                      type: 'bar',
                      data: [320, 180, 260, 140, 220],
                      itemStyle: { color: '#6366F1' },
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow lg:col-span-2">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">{activity.action}</p>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Link to="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all activity &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Links or Another Widget */}
          {/* <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition text-gray-700 font-medium border border-gray-200">
                Create New Order
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition text-gray-700 font-medium border border-gray-200">
                Generate Report
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition text-gray-700 font-medium border border-gray-200">
                Manage Users
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
