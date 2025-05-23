import React, { useState, useEffect } from 'react';
// import { getLocalStorageData, updateLocalStorageData } from '../../utils/localStorage';
import { getLocalStorageData, updateLocalStorageData } from '../../services/compatibleStorageService';
import { Customer } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { Edit, Trash, UserPlus, Search, UserCheck, UserX } from 'lucide-react';
import { getCurrentDate } from '../../utils/dateUtils';

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    points: 0
  });
  const { addNotification } = useNotification();

  // Fetch customers from localStorage
  useEffect(() => {
    const loadData = () => {
      const data = getLocalStorageData<Customer[]>('customers');
      setCustomers(data);
      setFilteredCustomers(data);
    };

    loadData();

    // Setup listener for localStorage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'points' ? parseInt(value, 10) || 0 : value
    }));
  };

  // Open add modal
  const handleAddClick = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      points: 0
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleEditClick = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      password: customer.password,
      points: customer.points
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Toggle customer active status
  const handleToggleActive = (customer: Customer) => {
    const updatedCustomers = customers.map((c) =>
      c.id === customer.id ? { ...c, isActive: !c.isActive } : c
    );
    updateLocalStorageData('customers', updatedCustomers);
    setCustomers(updatedCustomers);
    addNotification(
      `Customer ${customer.name} ${customer.isActive ? 'deactivated' : 'activated'} successfully`,
      'success'
    );
  };

  // Handle add customer
  const handleAddCustomer = () => {
    // Validate form
    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      addNotification('Please fill all required fields', 'error');
      return;
    }

    // Check if phone already exists
    if (customers.some((c) => c.phone === formData.phone)) {
      addNotification('Phone number already exists', 'error');
      return;
    }

    // Create new customer
    const settings = getLocalStorageData('settings');
    const newCustomer: Customer = {
      id: Math.max(0, ...customers.map((c) => c.id)) + 1,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      points: formData.points || settings.welcomeBonusPoints,
      totalSpent: 0,
      isActive: true,
      createdAt: getCurrentDate(),
      lastVisit: getCurrentDate(),
      password: formData.password,
      isVip: false
    };

    // Update localStorage and state
    const updatedCustomers = [...customers, newCustomer];
    updateLocalStorageData('customers', updatedCustomers);
    setCustomers(updatedCustomers);
    setIsAddModalOpen(false);
    addNotification('Customer added successfully', 'success');
  };

  // Handle edit customer
  const handleEditCustomer = () => {
    if (!currentCustomer) return;

    // Validate form
    if (!formData.name || !formData.phone || !formData.email) {
      addNotification('Please fill all required fields', 'error');
      return;
    }

    // Check if phone already exists (excluding current customer)
    if (
      formData.phone !== currentCustomer.phone &&
      customers.some((c) => c.phone === formData.phone)
    ) {
      addNotification('Phone number already exists', 'error');
      return;
    }

    // Update customer
    const updatedCustomers = customers.map((c) =>
      c.id === currentCustomer.id
        ? {
            ...c,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            points: formData.points,
            password: formData.password
          }
        : c
    );

    // Update localStorage and state
    updateLocalStorageData('customers', updatedCustomers);
    setCustomers(updatedCustomers);
    setIsEditModalOpen(false);
    addNotification('Customer updated successfully', 'success');
  };

  // Handle delete customer
  const handleDeleteCustomer = () => {
    if (!currentCustomer) return;

    // Remove customer
    const updatedCustomers = customers.filter((c) => c.id !== currentCustomer.id);
    updateLocalStorageData('customers', updatedCustomers);
    setCustomers(updatedCustomers);
    setIsDeleteModalOpen(false);
    addNotification('Customer deleted successfully', 'success');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Customer Management</h1>

      {/* Search and Add */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          onClick={handleAddClick}
          icon={<UserPlus size={18} />}
        >
          Add Customer
        </Button>
      </div>

      {/* Customers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{customer.phone}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-amber-600">
                      {customer.points} pts
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      ₹{customer.totalSpent}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
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
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleToggleActive(customer)}
                      icon={customer.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                    >
                      {customer.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="info"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEditClick(customer)}
                      icon={<Edit size={16} />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(customer)}
                      icon={<Trash size={16} />}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddCustomer}>
              Add Customer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            id="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            id="points"
            label="Initial Points"
            type="number"
            value={formData.points}
            onChange={handleChange}
          />
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditCustomer}>
              Update Customer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            id="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            id="points"
            label="Points"
            type="number"
            value={formData.points}
            onChange={handleChange}
          />
        </div>
      </Modal>

      {/* Delete Customer Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Customer"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCustomer}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete customer{' '}
          <span className="font-medium">{currentCustomer?.name}</span>? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

export default CustomerManagement;