import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Package, Tag } from 'lucide-react';
import { itemsAPI } from '../services/api';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onItemUpdated: () => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, item, onItemUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good' as const,
    address: '',
    latitude: '',
    longitude: '',
    weight: '',
    length: '',
    width: '',
    height: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        condition: item.condition || 'good',
        address: item.location?.address || '',
        latitude: item.location?.coordinates ? String(item.location.coordinates[1]) : '',
        longitude: item.location?.coordinates ? String(item.location.coordinates[0]) : '',
        weight: item.weight?.value ? String(item.weight.value) : '',
        length: item.dimensions?.length ? String(item.dimensions.length) : '',
        width: item.dimensions?.width ? String(item.dimensions.width) : '',
        height: item.dimensions?.height ? String(item.dimensions.height) : ''
      });
      setImages([]); // You may want to show existing images differently
    }
  }, [item]);

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
      (err) => {
        setGeoError('Failed to get location.');
        setGeoLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      address: formData.address,
      coordinates: [lng, lat] as [number, number]
    };
    const dimensions = (formData.length && formData.width && formData.height)
      ? { length: Number(formData.length), width: Number(formData.width), height: Number(formData.height), unit: 'cm' }
      : undefined;
    const weight = formData.weight ? { value: Number(formData.weight), unit: 'kg' } : undefined;
    const form = new FormData();
    form.append('title', formData.title);
    form.append('description', formData.description);
    form.append('category', formData.category);
    form.append('condition', formData.condition);
    form.append('location[address]', location.address);
    form.append('location[coordinates][]', String(location.coordinates[0]));
    form.append('location[coordinates][]', String(location.coordinates[1]));
    if (weight) {
      form.append('weight[value]', String(weight.value));
      form.append('weight[unit]', weight.unit);
    }
    if (dimensions) {
      form.append('dimensions[length]', String(dimensions.length));
      form.append('dimensions[width]', String(dimensions.width));
      form.append('dimensions[height]', String(dimensions.height));
      form.append('dimensions[unit]', dimensions.unit);
    }
    // Only append new images
    if (images.length > 0) {
      for (const img of images) {
        form.append('images', img);
      }
    }
    await itemsAPI.updateItem(item.id || (item as any)._id, form);
    onItemUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
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
              placeholder="Enter pickup address"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="h-4 w-4 inline mr-1" />
              Images (add more)
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
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal; 