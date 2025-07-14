import React, { useState } from 'react';
import { X, Upload, MapPin, Package,  } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { toast } from 'react-toastify';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addItem } = useData();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good' as const,
    address: '',
    latitude: '',
    longitude: '',
    weightValue: '',
    weightUnit: 'kg',
    length: '',
    width: '',
    height: '',
    dimensionsUnit: 'cm',
  });
  const [images, setImages] = useState<File[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const categories = ['Electronics', 'Plastic', 'Metal', 'Paper', 'Glass', 'Textile', 'Other'];
  const conditions = ['excellent', 'good', 'fair', 'poor'] as const;

  const handleGeolocate = () => {
    setGeoLoading(true);
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setGeoLoading(false);
      },
      () => {
        setGeoError('Failed to get location.');
        setGeoLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const lng = parseFloat(formData.longitude);
    const lat = parseFloat(formData.latitude);
    if (
      isNaN(lng) || isNaN(lat) ||
      formData.longitude.trim() === "" || formData.latitude.trim() === "" ||
      (lng === 0 && lat === 0)
    ) {
      alert('Please enter a valid latitude and longitude (not empty, not zero).');
      return;
    }
    const location = {
      address: formData.address || user.location || 'San Francisco, CA',
      coordinates: [lng, lat] as [number, number]
    };
    const weight = formData.weightValue ? { value: formData.weightValue, unit: formData.weightUnit } : undefined;
    const dimensions = (formData.length && formData.width && formData.height)
      ? { length: formData.length, width: formData.width, height: formData.height, unit: formData.dimensionsUnit }
      : undefined;
    const dummyUser = { id: '', name: '', avatar: '', rating: 0 };
    const newItem = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      condition: formData.condition,
      location,
      weight,
      dimensions,
      images,
      tags: [],
      user: dummyUser
    };

    try {
      await addItem({
        ...newItem,
        // Convert weight and dimensions to string if needed for backend compatibility
        weight: weight ? `${weight.value} ${weight.unit}` : undefined,
        dimensions: dimensions
          ? `${dimensions.length}x${dimensions.width}x${dimensions.height} ${dimensions.unit}`
          : undefined,
      });
      toast.success('Item created successfully!');
      onClose();
      setFormData({
        title: '',
        description: '',
        category: '',
        condition: 'good',
        address: '',
        latitude: '',
        longitude: '',
        weightValue: '',
        weightUnit: 'kg',
        length: '',
        width: '',
        height: '',
        dimensionsUnit: 'cm',
      });
      setImages([]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create item. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Old laptop for parts"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe the item, its condition, and any relevant details..."
            />
          </div>

          {/* Category and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition *
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={user?.location || "Enter pickup address"}
            />
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Latitude"
              />
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Longitude"
              />
              <button
                type="button"
                onClick={handleGeolocate}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={geoLoading}
              >
                {geoLoading ? 'Detecting...' : 'Auto-detect'}
              </button>
            </div>
            {geoError && <p className="text-red-500 text-xs mt-1">{geoError}</p>}
          </div>

          {/* Weight and Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="h-4 w-4 inline mr-1" />
                Weight
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={formData.weightValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, weightValue: e.target.value }))}
                  className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 2.5"
                />
                <select
                  value={formData.weightUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, weightUnit: e.target.value }))}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  value={formData.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Length"
                />
                <input
                  type="number"
                  min="0"
                  value={formData.width}
                  onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Width"
                />
                <input
                  type="number"
                  min="0"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Height"
                />
                <select
                  value={formData.dimensionsUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensionsUnit: e.target.value }))}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                  <option value="m">m</option>
                  <option value="ft">ft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="h-4 w-4 inline mr-1" />
              Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => {
                if (e.target.files) {
                  setImages(Array.from(e.target.files));
                }
              }}
              className="mb-4"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="w-16 h-16 border rounded overflow-hidden flex items-center justify-center">
                    <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;