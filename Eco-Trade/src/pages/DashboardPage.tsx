import React, { useState, useEffect } from 'react';
import { Package, MessageCircle, TrendingUp, Calendar, Star, MapPin, Eye, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import AddItemModal from '../components/AddItemModal';
import EditItemModal from '../components/EditItemModal';
import { usersAPI } from '../services/api';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { tradeAPI } from '../services/api';
import { chatAPI } from '../services/api';

const DashboardPage = () => {
  const { user, login, refreshUser } = useAuth();
  const {
    userItems,
    userItemsLoading,
    userItemsError,
    fetchUserItems,
    updateItemStatus
  } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'profile'>('overview');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: user?.location || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingItemId, setRatingItemId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingReview, setRatingReview] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [tradeRequestsLoading, setTradeRequestsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchUserItems(user.id);
    }
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      location: user?.location || '',
    });
  }, [user?.id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.id) return;
      setReviewsLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}/reviews`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('ecotrade_token')}` }
        });
        const data = await res.json();
        setUserReviews(data.reviews || []);
      } catch (e) {
        setUserReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [user?.id]);

  useEffect(() => {
    const fetchTradeRequests = async () => {
      if (!user?.id) return;
      setTradeRequestsLoading(true);
      try {
        // Fetch all trade requests where user is owner or recipient
        const res = await fetch(`http://localhost:5000/api/users/${user.id}/trade-requests`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('ecotrade_token')}` }
        });
        const data = await res.json();
        setTradeRequests(data.tradeRequests || []);
      } catch (e) {
        setTradeRequests([]);
      } finally {
        setTradeRequestsLoading(false);
      }
    };
    fetchTradeRequests();
  }, [user?.id]);


  const stats = [
    {
      id: 'active-listings',
      icon: Package,
      label: 'Active Listings',
      value: userItems.filter(item => item.status === 'available').length,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'total-listings',
      icon: MessageCircle,
      label: 'Total Listings',
      value: userItems.length,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'completed-items',
      icon: TrendingUp,
      label: 'Completed Items',
      value: userItems.filter(item => item.status === 'traded').length,
      color: 'bg-purple-100 text-purple-600'
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      available: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      traded: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || styles.available;
  };

  const myImpact = {
    itemsListed: userItems.length,
    tradesCompleted: userItems.filter(item => item.status === 'traded').length,
    estimatedWasteKg: userItems.filter(item => item.status === 'traded').length // 1 trade = 1kg
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your listings, requests, and profile</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={stat.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'listings', label: 'My Listings' },
                { id: 'profile', label: 'Profile' }
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
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Listings</h3>
                  <div className="space-y-3">
                    {userItems.slice(0, 5).map((item, index) => (
                      <div key={item.id || `item-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-sm text-gray-500">{item.datePosted}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                    {userItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No listings yet. Start by adding your first item!
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">My Impact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700">{myImpact.itemsListed}</div>
                      <div className="text-gray-600">Items Listed</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-700">{myImpact.tradesCompleted}</div>
                      <div className="text-gray-600">Trades Completed</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-700">{myImpact.estimatedWasteKg} kg</div>
                      <div className="text-gray-600">Estimated Waste Diverted</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">My Listings</h3>
                  <span className="text-sm text-gray-500">{userItems.length} total items</span>
                </div>
                {userItemsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="text-gray-500 text-lg">Loading your items...</span>
                  </div>
                ) : userItemsError ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="text-red-500 text-lg">{userItemsError}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Trade Requests</h3>
                      {tradeRequestsLoading ? (
                        <div className="text-gray-500">Loading trade requests...</div>
                      ) : tradeRequests.length === 0 ? (
                        <div className="text-gray-400">No trade requests yet.</div>
                      ) : (
                        <div className="space-y-4">
                          {tradeRequests.map((req, idx) => {
                            const otherUser = req.owner && req.owner._id === user?.id ? req.recipient : req.owner;
                            return (
                              <div key={req._id || idx} className="border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{req.item?.title || req.itemTitle}</div>
                                  <div className="text-sm text-gray-500">From: {otherUser?.name || 'Unknown'} | Status: {req.status}</div>
                                  {req.message && <div className="text-xs text-gray-500 mt-1">Message: {req.message}</div>}
                                </div>
                                <div className="flex space-x-2 mt-2 md:mt-0">
                                  <button
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={async () => {
                                      // Create or find chat with the other user, then navigate
                                      const chat = await chatAPI.createChat(otherUser._id || otherUser.id);
                                      navigate('/chat');
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1 inline" /> Message
                                  </button>
                                  {req.status === 'pending' && req.ownerId === user?.id && (
                                    <>
                                      <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onClick={async () => {
                                        await tradeAPI.updateRequestStatus(req._id, 'accepted');
                                        toast.success('Request accepted');
                                        setTradeRequests(tradeRequests => tradeRequests.map(r => r._id === req._id ? { ...r, status: 'accepted' } : r));
                                      }}>Accept</button>
                                      <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" onClick={async () => {
                                        await tradeAPI.updateRequestStatus(req._id, 'declined');
                                        toast.success('Request declined');
                                        setTradeRequests(tradeRequests => tradeRequests.map(r => r._id === req._id ? { ...r, status: 'declined' } : r));
                                      }}>Decline</button>
                                    </>
                                  )}
                                  {req.status === 'accepted' && [req.ownerId, req.recipientId].includes(user?.id) && (
                                    <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={async () => {
                                      await tradeAPI.completeTrade(req._id);
                                      toast.success('Trade marked as completed');
                                      setTradeRequests(tradeRequests => tradeRequests.map(r => r._id === req._id ? { ...r, status: 'completed' } : r));
                                    }}>Mark as Completed</button>
                                  )}
                                  {req.status === 'completed' && [req.ownerId, req.recipientId].includes(user?.id) && !req.ratedByCurrentUser && (
                                    <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => {
                                      setRatingItemId(req._id);
                                      setShowRatingModal(true);
                                    }}>Rate Trade</button>
                                  )}
                                  {req.status === 'completed' && req.ratedByCurrentUser && (
                                    <span className="text-green-600 text-xs">You rated this trade</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {userItems.map((item, index) => (
                      <div key={(item as any)._id || item.id || `item-${index}`} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <img
                          src={(() => {
                            const img = item.images && item.images.length > 0 ? item.images[0] : null;
                            if (!img) return '/placeholder.png';
                            if (typeof img === 'string') {
                              return img.startsWith('http') ? img : `http://localhost:5000/uploads/${img}`;
                            }
                            // Type guard: check if not a File and has url
                            if (typeof img === 'object' && 'url' in img && !(img instanceof File)) {
                              const url = (img as { url: string }).url;
                              return url.startsWith('http') ? url : `http://localhost:5000/${url}`;
                            }
                            return '/placeholder.png';
                          })()}
                          alt={item.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.category}</p>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-500">
                              {typeof item.location === 'string'
                                ? item.location
                                : (item.location && ((item.location as { address?: string }).address || ''))}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">{item.datePosted}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => { setEditItem(item); setEditModalOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600" onClick={() => { setDeleteItemId(item.id || (item as any)._id); setDeleteModalOpen(true); }}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {item.status !== 'traded' && (
                            <button
                              className="p-2 text-gray-400 hover:text-green-600 border border-green-500 rounded"
                              onClick={async () => {
                                await updateItemStatus(item.id || (item as any)._id, 'traded');
                                if (user?.id) fetchUserItems(user.id);
                                setRatingItemId(item.id || (item as any)._id);
                                setShowRatingModal(true);
                              }}
                            >
                              Mark as Traded
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-md">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{user?.name}</h4>
                      <p className="text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <input
                      type="text"
                      value={user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <button
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                    disabled={profileLoading}
                    onClick={async () => {
                      setProfileLoading(true);
                      setProfileMsg('');
                      try {
                        await authAPI.updateProfile({ name: profileForm.name, email: profileForm.email, location: profileForm.location });
                        setProfileMsg('Profile updated!');
                        await refreshUser();
                      } catch (e) {
                        setProfileMsg('Failed to update profile');
                      } finally {
                        setProfileLoading(false);
                      }
                    }}
                  >
                    {profileLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                  {profileMsg && <div className="text-green-600 text-sm mt-2">{profileMsg}</div>}
                </div>
                <div className="mt-8">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">My Reviews</h4>
                  {reviewsLoading ? (
                    <div className="text-gray-500">Loading reviews...</div>
                  ) : userReviews.length === 0 ? (
                    <div className="text-gray-400">No reviews yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {userReviews.map((review, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current mr-0.5" />
                            ))}
                            <span className="text-xs text-gray-500 ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-gray-800 text-sm mb-1">{review.review || <span className="italic text-gray-400">No comment</span>}</div>
                          <div className="text-xs text-gray-500">From: {review.raterName || 'Anonymous'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Item Modal */}
        {addModalOpen && (
          <AddItemModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
          />
        )}

        {/* Edit Item Modal */}
        {editModalOpen && editItem && (
          <EditItemModal
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setEditItem(null); }}
            item={editItem}
            onItemUpdated={async () => {
              if (user?.id) await fetchUserItems(user.id);
              setEditModalOpen(false);
              setEditItem(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Delete Item</h2>
              <p className="mb-6">Are you sure you want to delete this item?</p>
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => { setDeleteModalOpen(false); setDeleteItemId(null); }}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={async () => {
                    if (deleteItemId) {
                      await itemsAPI.deleteItem(deleteItemId);
                      if (user?.id) fetchUserItems(user.id);
                    }
                    setDeleteModalOpen(false);
                    setDeleteItemId(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showRatingModal && ratingItemId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Rate This Trade</h2>
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    className={star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}
                  >
                    <Star className="h-6 w-6" fill={star <= ratingValue ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                rows={3}
                placeholder="Leave a review (optional)"
                value={ratingReview}
                onChange={e => setRatingReview(e.target.value)}
              />
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => { setShowRatingModal(false); setRatingItemId(null); setRatingValue(5); setRatingReview(''); }}
                  disabled={ratingLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={ratingLoading}
                  onClick={async () => {
                    setRatingLoading(true);
                    try {
                      await tradeAPI.rateTrade(ratingItemId, ratingValue, ratingReview);
                      toast.success('Thank you for rating this trade!');
                      setShowRatingModal(false);
                      setRatingItemId(null);
                      setRatingValue(5);
                      setRatingReview('');
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to submit rating');
                    } finally {
                      setRatingLoading(false);
                    }
                  }}
                >
                  {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;