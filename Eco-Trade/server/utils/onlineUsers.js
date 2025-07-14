// Online users tracking utility
const onlineUsers = new Map(); // userId -> socketId

const addOnlineUser = (userId, socketId) => {
  onlineUsers.set(userId, socketId);
};

const removeOnlineUser = (userId) => {
  onlineUsers.delete(userId);
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

module.exports = {
  addOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  isUserOnline,
  onlineUsers
}; 