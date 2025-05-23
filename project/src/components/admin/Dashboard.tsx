import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
// import { getLocalStorageData } from '../../utils/localStorage';
import { getLocalStorageData } from '../../services/compatibleStorageService';
import { Customer, Transaction } from '../../types';
import { Users, DollarSign, Award, CreditCard } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    totalPointsIssued: 0,
    vipCustomers: 0
  });

  // Listen for changes in localStorage
  useEffect(() => {
    const loadData = () => {
      const customers = getLocalStorageData<Customer[]>('customers');
      const transactions = getLocalStorageData<Transaction[]>('transactions');
      setCustomers(customers);
      setTransactions(transactions);
    };

    loadData();

    // Setup listener for localStorage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate statistics
  useEffect(() => {
    setStats({
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.isActive).length,
      totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
      totalTransactions: transactions.length,
      totalPointsIssued: transactions.reduce((sum, t) => sum + t.pointsEarned, 0),
      vipCustomers: customers.filter(c => c.isVip).length
    });
  }, [customers, transactions]);

  // Recent customers
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-500 text-white mr-4">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-amber-800">Total Customers</p>
              <p className="text-2xl font-bold text-amber-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-green-800">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">₹{stats.totalRevenue}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 text-white mr-4">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm text-purple-800">Points Issued</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalPointsIssued}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white mr-4">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-800">Transactions</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Customers">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {customer.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {customer.points}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          customer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {customer.isVip && (
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          VIP
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {recentCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card title="Recent Transactions">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      ₹{transaction.amount}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {transaction.type === 'payment'
                        ? `+${transaction.pointsEarned}`
                        : `-${transaction.pointsRedeemed}`}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          transaction.type === 'payment'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type === 'payment' ? 'Payment' : 'Redemption'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;