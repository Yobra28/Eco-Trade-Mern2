import React, { createContext, useContext, useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';

export interface RecyclableItem {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  images: string[] | File[];
  location: {
    address: string;
    coordinates: [number, number];
    city?: string;
    state?: string;
    zipCode?: string;
  };
  user: {
    id: string;
    _id?: string;
    name: string;
    avatar: string;
    rating: number;
    totalTrades?: number;
    email?: string;
  };
  datePosted: string;
  status: 'available' | 'pending' | 'traded';
  weight?: string;
  dimensions?: string;
  tags: string[];
}

interface DataContextType {
  items: RecyclableItem[];
  addItem: (item: Omit<RecyclableItem, 'id' | 'datePosted' | 'status'> & { location: { address: string; coordinates?: [number, number]; city?: string; state?: string; zipCode?: string }; user?: any; images?: any }) => void;
  updateItemStatus: (id: string, status: RecyclableItem['status']) => void;
  itemsLoading: boolean;
  itemsError: string | null;
  userItems: RecyclableItem[];
  userItemsLoading: boolean;
  userItemsError: string | null;
  fetchUserItems: (userId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<RecyclableItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [userItems, setUserItems] = useState<RecyclableItem[]>([]);
  const [userItemsLoading, setUserItemsLoading] = useState(false);
  const [userItemsError, setUserItemsError] = useState<string | null>(null);

  const fetchItems = async () => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const response = await itemsAPI.getItems();
      setItems(response.items || []);
    } catch (error: any) {
      setItemsError(error.message || 'Failed to fetch items');
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchUserItems = async (userId: string) => {
    setUserItemsLoading(true);
    setUserItemsError(null);
    try {
      const response = await itemsAPI.getUserItems(userId);
      setUserItems(response.items || []);
    } catch (error: any) {
      setUserItemsError(error.message || 'Failed to fetch user items');
    } finally {
      setUserItemsLoading(false);
    }
  };



  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async (newItem: Omit<RecyclableItem, 'id' | 'datePosted' | 'status'> & { location: { address: string; coordinates?: [number, number]; city?: string; state?: string; zipCode?: string }; user?: any; images?: any }) => {
    // Prepare FormData for file upload support (future)
    const formData = new FormData();
    formData.append('title', newItem.title);
    formData.append('description', newItem.description);
    formData.append('category', newItem.category);
    formData.append('condition', newItem.condition);
    formData.append('location[address]', newItem.location.address);
    if (newItem.location.coordinates) {
      formData.append('location[coordinates][]', String(newItem.location.coordinates[0])); // lng
      formData.append('location[coordinates][]', String(newItem.location.coordinates[1])); // lat
    }
    if (newItem.location.city) formData.append('location[city]', newItem.location.city);
    if (newItem.location.state) formData.append('location[state]', newItem.location.state);
    if (newItem.location.zipCode) formData.append('location[zipCode]', newItem.location.zipCode);
    // Weight as nested fields
    if (newItem.weight && typeof newItem.weight === 'object' && (newItem.weight as { value?: string; unit?: string }).value) {
      const weight = newItem.weight as { value?: string; unit?: string };
      formData.append('weight[value]', String(weight.value));
      formData.append('weight[unit]', String(weight.unit || 'kg'));
    }
    // Dimensions as nested fields
    if (
      newItem.dimensions &&
      typeof newItem.dimensions === 'object' &&
      (newItem.dimensions as { length?: string; width?: string; height?: string; unit?: string }).length &&
      (newItem.dimensions as { length?: string; width?: string; height?: string; unit?: string }).width &&
      (newItem.dimensions as { length?: string; width?: string; height?: string; unit?: string }).height
    ) {
      const dims = newItem.dimensions as { length?: string; width?: string; height?: string; unit?: string };
      formData.append('dimensions[length]', String(dims.length));
      formData.append('dimensions[width]', String(dims.width));
      formData.append('dimensions[height]', String(dims.height));
      formData.append('dimensions[unit]', String(dims.unit || 'cm'));
    }
    if (newItem.tags && newItem.tags.length > 0) {
      newItem.tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
      formData.append('tags', newItem.tags.join(','));
    }
    // Accept image file(s) from local machine
    if (newItem.images && newItem.images.length > 0) {
      for (const img of newItem.images) {
        formData.append('images', img);
      }
    }

    // Debug log: print all FormData entries before sending
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    try {
      const response = await itemsAPI.createItem(formData);
      // After adding, refresh the list from backend
      await fetchItems();
    } catch (error: any) {
      console.error('Failed to add item:', error);
      throw error?.response?.data || error;
    }
  };

  const updateItemStatus = async (id: string, status: RecyclableItem['status']) => {
    const formData = new FormData();
    formData.append('status', status);
    try {
      await itemsAPI.updateItem(id, formData);
      await fetchItems();
      // Optionally refresh user items if userId is available
      // if (userId) await fetchUserItems(userId);
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      items,
      addItem,
      updateItemStatus,
      itemsLoading,
      itemsError,
      userItems,
      userItemsLoading,
      userItemsError,
      fetchUserItems,
    }}>
      {children}
    </DataContext.Provider>
  );
};