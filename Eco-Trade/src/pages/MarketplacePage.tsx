import React, { useState } from 'react';
import { Search, Filter, MapPin, Star, Calendar, Tag, Package } from 'lucide-react';
import { useData } from '../context/DataContext';
import ItemCard from '../components/ItemCard';
import AddItemModal from '../components/AddItemModal';

const MarketplacePage = () => {
  const { items, itemsLoading, itemsError } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNearMe, setShowNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState('');

  const handleNearMeToggle = () => {
    if (!showNearMe) {
      if (!navigator.geolocation) {
        setGeoError('Geolocation is not supported by your browser.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
          setGeoError('');
        },
        (err) => {
          setGeoError('Failed to get your location.');
        }
      );
    }
    setShowNearMe(!showNearMe);
  };

  function haversineDistance([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
    function toRad(x: number) { return x * Math.PI / 180; }
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const categories = ['all', 'Electronics', 'Plastic', 'Metal', 'Paper', 'Glass', 'Textile', 'Other'];
  const conditions = ['all', 'excellent', 'good', 'fair', 'poor'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCondition = selectedCondition === 'all' || item.condition === selectedCondition;
    let matchesNearMe = true;
    if (showNearMe && userLocation && item.location && item.location.coordinates) {
      const dist = haversineDistance(userLocation, item.location.coordinates);
      matchesNearMe = dist <= 20; // 20km radius
    }
    return matchesSearch && matchesCategory && matchesCondition && matchesNearMe;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h1>
          <p className="text-gray-600">Discover recyclable materials and sustainable opportunities in your community</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for items, materials, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            {/* Near Me Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNearMeToggle}
                className={`px-4 py-2 rounded-lg border ${showNearMe ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'} transition-colors`}
              >
                {showNearMe ? 'Showing Near Me' : 'Near Me'}
              </button>
            </div>
            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="lg:w-48">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition === 'all' ? 'All Conditions' : condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Item Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="lg:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              + Add Item
            </button>
          </div>
          {geoError && <div className="text-red-500 text-sm mt-2">{geoError}</div>}
        </div>

        {/* Results Count and Feedback */}
        {itemsLoading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-gray-500 text-lg">Loading items...</span>
          </div>
        ) : itemsError ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-red-500 text-lg">{itemsError}</span>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <ItemCard key={(item as any)._id || item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters, or be the first to add an item!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add First Item
            </button>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <AddItemModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;