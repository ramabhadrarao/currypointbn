import React, { useState, useEffect } from 'react';
// import { getLocalStorageData, updateLocalStorageData } from '../../utils/localStorage';
import { getLocalStorageData, updateLocalStorageData } from '../../services/compatibleStorageService';
import { Coupon } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { Edit, Trash, Plus, Calendar, Search, Tag } from 'lucide-react';

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    expiryDate: '',
    usageLimit: 1,
    forVipOnly: false
  });
  const { addNotification } = useNotification();

  // Fetch coupons from localStorage
  useEffect(() => {
    const loadData = () => {
      const data = getLocalStorageData<Coupon[]>('coupons');
      setCoupons(data);
      setFilteredCoupons(data);
    };

    loadData();

    // Setup listener for localStorage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter coupons based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCoupons(coupons);
    } else {
      const filtered = coupons.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCoupons(filtered);
    }
  }, [searchTerm, coupons]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [id]: checked
      }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [id]: parseFloat(value) || 0
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value
      }));
    }
  };

  // Open add modal
  const handleAddClick = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 100,
      maxDiscount: 100,
      expiryDate: tomorrow.toISOString().split('T')[0],
      usageLimit: 1,
      forVipOnly: false
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleEditClick = (coupon: Coupon) => {
    setCurrentCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount || 0,
      expiryDate: coupon.expiryDate,
      usageLimit: coupon.usageLimit,
      forVipOnly: coupon.forVipOnly
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (coupon: Coupon) => {
    setCurrentCoupon(coupon);
    setIsDeleteModalOpen(true);
  };

  // Toggle coupon active status
  const handleToggleActive = (coupon: Coupon) => {
    const updatedCoupons = coupons.map((c) =>
      c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
    );
    updateLocalStorageData('coupons', updatedCoupons);
    setCoupons(updatedCoupons);
    addNotification(
      `Coupon ${coupon.code} ${coupon.isActive ? 'deactivated' : 'activated'} successfully`,
      'success'
    );
  };

  // Handle add coupon
  const handleAddCoupon = () => {
    // Validate form
    if (!formData.code || !formData.title || !formData.discountValue || !formData.expiryDate) {
      addNotification('Please fill all required fields', 'error');
      return;
    }

    // Check if code already exists
    if (coupons.some((c) => c.code === formData.code)) {
      addNotification('Coupon code already exists', 'error');
      return;
    }

    // Create new coupon
    const newCoupon: Coupon = {
      id: Math.max(0, ...coupons.map((c) => c.id)) + 1,
      code: formData.code.toUpperCase(),
      title: formData.title,
      description: formData.description,
      discountType: formData.discountType as 'percentage' | 'fixed' | 'freeItem',
      discountValue: formData.discountValue,
      minOrderValue: formData.minOrderValue,
      maxDiscount: formData.discountType === 'percentage' ? formData.maxDiscount : undefined,
      isActive: true,
      expiryDate: formData.expiryDate,
      usageLimit: formData.usageLimit,
      usageCount: 0,
      forVipOnly: formData.forVipOnly
    };

    // Update localStorage and state
    const updatedCoupons = [...coupons, newCoupon];
    updateLocalStorageData('coupons', updatedCoupons);
    setCoupons(updatedCoupons);
    setIsAddModalOpen(false);
    addNotification('Coupon added successfully', 'success');
  };

  // Handle edit coupon
  const handleEditCoupon = () => {
    if (!currentCoupon) return;

    // Validate form
    if (!formData.code || !formData.title || !formData.discountValue || !formData.expiryDate) {
      addNotification('Please fill all required fields', 'error');
      return;
    }

    // Check if code already exists (excluding current coupon)
    if (
      formData.code !== currentCoupon.code &&
      coupons.some((c) => c.code === formData.code)
    ) {
      addNotification('Coupon code already exists', 'error');
      return;
    }

    // Update coupon
    const updatedCoupons = coupons.map((c) =>
      c.id === currentCoupon.id
        ? {
            ...c,
            code: formData.code.toUpperCase(),
            title: formData.title,
            description: formData.description,
            discountType: formData.discountType as 'percentage' | 'fixed' | 'freeItem',
            discountValue: formData.discountValue,
            minOrderValue: formData.minOrderValue,
            maxDiscount: formData.discountType === 'percentage' ? formData.maxDiscount : undefined,
            expiryDate: formData.expiryDate,
            usageLimit: formData.usageLimit,
            forVipOnly: formData.forVipOnly
          }
        : c
    );

    // Update localStorage and state
    updateLocalStorageData('coupons', updatedCoupons);
    setCoupons(updatedCoupons);
    setIsEditModalOpen(false);
    addNotification('Coupon updated successfully', 'success');
  };

  // Handle delete coupon
  const handleDeleteCoupon = () => {
    if (!currentCoupon) return;

    // Remove coupon
    const updatedCoupons = coupons.filter((c) => c.id !== currentCoupon.id);
    updateLocalStorageData('coupons', updatedCoupons);
    setCoupons(updatedCoupons);
    setIsDeleteModalOpen(false);
    addNotification('Coupon deleted successfully', 'success');
  };

  // Check if coupon is expired
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Coupon Management</h1>

      {/* Search and Add */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search coupons..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleAddClick} icon={<Plus size={18} />}>
          Add Coupon
        </Button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map((coupon) => (
          <Card
            key={coupon.id}
            className={`${!coupon.isActive || isExpired(coupon.expiryDate) ? 'opacity-70' : ''}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center mb-1">
                  <Tag size={16} className="text-amber-600 mr-2" />
                  <span className="font-mono text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {coupon.code}
                  </span>
                  {coupon.forVipOnly && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      VIP Only
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{coupon.title}</h3>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  coupon.isActive && !isExpired(coupon.expiryDate)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {!coupon.isActive
                  ? 'Inactive'
                  : isExpired(coupon.expiryDate)
                  ? 'Expired'
                  : 'Active'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount:</span>
                <span className="font-medium">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% off`
                    : coupon.discountType === 'fixed'
                    ? `₹${coupon.discountValue} off`
                    : `Free item`}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Min Order:</span>
                <span className="font-medium">₹{coupon.minOrderValue}</span>
              </div>
              
              {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Max Discount:</span>
                  <span className="font-medium">₹{coupon.maxDiscount}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Usage:</span>
                <span className="font-medium">
                  {coupon.usageCount}/{coupon.usageLimit}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expires:</span>
                <span className="font-medium flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {new Date(coupon.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-auto pt-2 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleActive(coupon)}
              >
                {coupon.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="info"
                size="sm"
                onClick={() => handleEditClick(coupon)}
                icon={<Edit size={16} />}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteClick(coupon)}
                icon={<Trash size={16} />}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        
        {filteredCoupons.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No coupons found
          </div>
        )}
      </div>

      {/* Add Coupon Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Coupon"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddCoupon}>
              Add Coupon
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="code"
            label="Coupon Code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., WELCOME10"
            required
          />
          
          <Input
            id="title"
            label="Coupon Title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., 10% Off Your First Order"
            required
          />
          
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the coupon conditions"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label
              htmlFor="discountType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Discount Type
            </label>
            <select
              id="discountType"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={formData.discountType}
              onChange={handleChange}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="freeItem">Free Item</option>
            </select>
          </div>
          
          <Input
            id="discountValue"
            label={formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
            type="number"
            value={formData.discountValue}
            onChange={handleChange}
            min={0}
            required
          />
          
          {formData.discountType === 'percentage' && (
            <Input
              id="maxDiscount"
              label="Maximum Discount (₹)"
              type="number"
              value={formData.maxDiscount}
              onChange={handleChange}
              min={0}
            />
          )}
          
          <Input
            id="minOrderValue"
            label="Minimum Order Value (₹)"
            type="number"
            value={formData.minOrderValue}
            onChange={handleChange}
            min={0}
          />
          
          <Input
            id="expiryDate"
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={handleChange}
            required
          />
          
          <Input
            id="usageLimit"
            label="Usage Limit (per customer)"
            type="number"
            value={formData.usageLimit}
            onChange={handleChange}
            min={1}
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="forVipOnly"
              checked={formData.forVipOnly}
              onChange={handleChange}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label htmlFor="forVipOnly" className="ml-2 block text-sm text-gray-900">
              VIP Customers Only
            </label>
          </div>
        </div>
      </Modal>

      {/* Edit Coupon Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Coupon"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditCoupon}>
              Update Coupon
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="code"
            label="Coupon Code"
            value={formData.code}
            onChange={handleChange}
            required
          />
          
          <Input
            id="title"
            label="Coupon Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows={2}
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label
              htmlFor="discountType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Discount Type
            </label>
            <select
              id="discountType"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={formData.discountType}
              onChange={handleChange}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="freeItem">Free Item</option>
            </select>
          </div>
          
          <Input
            id="discountValue"
            label={formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
            type="number"
            value={formData.discountValue}
            onChange={handleChange}
            min={0}
            required
          />
          
          {formData.discountType === 'percentage' && (
            <Input
              id="maxDiscount"
              label="Maximum Discount (₹)"
              type="number"
              value={formData.maxDiscount}
              onChange={handleChange}
              min={0}
            />
          )}
          
          <Input
            id="minOrderValue"
            label="Minimum Order Value (₹)"
            type="number"
            value={formData.minOrderValue}
            onChange={handleChange}
            min={0}
          />
          
          <Input
            id="expiryDate"
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={handleChange}
            required
          />
          
          <Input
            id="usageLimit"
            label="Usage Limit (per customer)"
            type="number"
            value={formData.usageLimit}
            onChange={handleChange}
            min={1}
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="forVipOnly"
              checked={formData.forVipOnly}
              onChange={handleChange}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label htmlFor="forVipOnly" className="ml-2 block text-sm text-gray-900">
              VIP Customers Only
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Coupon Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Coupon"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCoupon}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete coupon{' '}
          <span className="font-mono font-medium">{currentCoupon?.code}</span>? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default CouponManagement;