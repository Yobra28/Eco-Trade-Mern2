import React, { useState } from 'react';
import { MapPin, Star, Calendar, MessageCircle, Package, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData, RecyclableItem } from '../context/DataContext';
import MapPreview from './MapPreview';
import { chatAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { tradeAPI } from '../services/api';
import { toast } from 'react-toastify';

interface ItemCardProps {
  item: RecyclableItem;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msgLoading, setMsgLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactBody, setContactBody] = useState('');
  const [contactStatus, setContactStatus] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const getStatusBadge = () => {
    switch (item.status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Available
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'traded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Traded
          </span>
        );
      default:
        return null;
    }
  };

  const getConditionColor = () => {
    switch (item.condition) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative">
          <img
            src={
              item.images && item.images.length > 0
                ? (typeof item.images[0] === 'string'
                    ? item.images[0] as string
                    : (item.images[0] instanceof File
                        ? URL.createObjectURL(item.images[0] as File)
                        : (item.images[0] as any)?.url))
                : '/placeholder.png'
            }
            alt={item.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 left-3">
            {getStatusBadge()}
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {item.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

          {item.location && (
            <div className="text-sm text-gray-500 mt-1">
              {typeof item.location === 'string' ? (
                <span>Address: {item.location}</span>
              ) : (
                <>
                  <span>Address: {(item.location as { address?: string }).address}</span>
                  {(item.location as { coordinates?: [number, number] }).coordinates && Array.isArray((item.location as { coordinates?: [number, number] }).coordinates) && (
                    <span> | Lat: {(item.location as { coordinates: [number, number] }).coordinates[1]}, Lng: {(item.location as { coordinates: [number, number] }).coordinates[0]}</span>
                  )}
                </>
              )}
            </div>
          )}

          {item.location && typeof item.location !== 'string' && (item.location as { coordinates?: [number, number] }).coordinates && Array.isArray((item.location as { coordinates?: [number, number] }).coordinates) && (
            <MapPreview lat={(item.location as { coordinates: [number, number] }).coordinates[1]} lng={(item.location as { coordinates: [number, number] }).coordinates[0]} address={(item.location as { address?: string }).address} />
          )}

          {/* Condition and Weight */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${getConditionColor()}`}>
              {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
            </span>
            {item.weight && (
              <span className="text-sm text-gray-500 flex items-center">
                <Package className="h-4 w-4 mr-1" />
                {typeof item.weight === 'object' && item.weight !== null
                  ? `${(item.weight as { value: number|string, unit: string }).value} ${(item.weight as { value: number|string, unit: string }).unit}`
                  : item.weight}
              </span>
            )}
          </div>

          {/* Location and Date */}
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="mr-4">
              {typeof item.location === 'string'
                ? item.location
                : (item.location && ((item.location as { address?: string }).address || ''))}
            </span>
            <Calendar className="h-4 w-4 mr-1" />
            <span>{
              (item.datePosted && !isNaN(new Date(item.datePosted).getTime()))
                ? new Date(item.datePosted).toLocaleDateString()
                : ((item as any).createdAt && !isNaN(new Date((item as any).createdAt).getTime()))
                  ? new Date((item as any).createdAt).toLocaleDateString()
                  : 'Unknown'
            }</span>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                >
                  #{tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>
              )}
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="h-8 w-8 rounded-full object-cover mr-2"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.user.name}</p>
                <div className="flex items-center">
                  {[...Array(Math.round(item.user.rating || 0))].map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-yellow-400 fill-current mr-0.5" />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{item.user.rating?.toFixed(1) || 'N/A'}</span>
                  {typeof item.user.totalTrades !== 'undefined' && (
                    <span className="text-xs text-gray-400 ml-2">({item.user.totalTrades} trades)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Grouped */}
          {user && user.id !== item.user.id && item.status === 'available' && (
            <div className="mt-6 flex flex-col sm:flex-row gap-2 items-stretch justify-center border-t border-gray-100 pt-4 max-w-2xl mx-auto w-full">
              <button
                aria-label="Message Seller"
                disabled={msgLoading}
                onClick={async () => {
                  const participantId = item.user._id || item.user.id;
                  if (!participantId || participantId.length !== 24) {
                    alert('Invalid seller ID');
                    return;
                  }
                  setMsgLoading(true);
                  try {
                    const chat = await chatAPI.createChat(participantId);
                    navigate('/chat');
                  } catch (e) {
                    // Optionally show error
                  } finally {
                    setMsgLoading(false);
                  }
                }}
                className="flex-1 bg-blue-600 text-white px-2 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {msgLoading ? 'Loading...' : 'Message Seller'}
              </button>
              {!requested && (
                <button
                  aria-label="Request Trade"
                  disabled={requesting}
                  onClick={async () => {
                    setRequested(true); // Optimistic UI
                    setRequesting(true);
                    try {
                      await tradeAPI.createRequest(item.id || (item as any)._id);
                      toast.success('Trade request sent!');
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to send request');
                      setRequested(false); // Revert if failed
                    } finally {
                      setRequesting(false);
                    }
                  }}
                  className={`flex-1 bg-green-600 text-white px-2 py-2 rounded-md text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm ${requesting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {requesting && (
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  )}
                  {requesting ? 'Requesting...' : 'Request Trade'}
                </button>
              )}
              <button
                className="flex-1 bg-blue-100 text-blue-800 px-2 py-2 rounded-md text-sm font-semibold hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
                onClick={() => setShowContactModal(true)}
                type="button"
              >
                Contact via Email
              </button>
            </div>
          )}
          {requested && (
            <div className="text-green-600 text-sm mt-2 text-center font-semibold">Trade request sent!</div>
          )}
        </div>
        {showContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">Contact {item.user.name} via Email</h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setContactStatus('');
                  setContactLoading(true);
                  try {
                    const res = await fetch('/api/users/contact-user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        toEmail: item.user.email,
                        subject: contactSubject || `Inquiry about: ${item.title}`,
                        message: contactBody,
                        fromEmail: user?.email || '',
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to send email');
                    setContactStatus('Email sent successfully!');
                    setContactBody('');
                    setContactSubject('');
                  } catch (e: any) {
                    setContactStatus(e.message || 'Failed to send email');
                  } finally {
                    setContactLoading(false);
                  }
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="Subject"
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Your message"
                  value={contactBody}
                  onChange={e => setContactBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  required
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    onClick={() => { setShowContactModal(false); setContactStatus(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={contactLoading}
                  >
                    {contactLoading ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
                {contactStatus && <div className="text-green-600 text-sm mt-2">{contactStatus}</div>}
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ItemCard;