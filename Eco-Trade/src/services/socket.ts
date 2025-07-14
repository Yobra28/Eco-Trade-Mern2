import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId);
    }
  }

  sendMessage(chatId: string, content: string) {
    if (this.socket) {
      this.socket.emit('send_message', { chatId, content });
    }
  }

  // Typing indicator methods
  startTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('typing_start', { chatId });
    }
  }

  stopTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', { chatId });
    }
  }

  onTypingStart(callback: (data: { chatId: string; userId: string; userName: string }) => void) {
    if (this.socket) {
      this.socket.on('typing_started', callback);
    }
  }

  onTypingStop(callback: (data: { chatId: string; userId: string }) => void) {
    if (this.socket) {
      this.socket.on('typing_stopped', callback);
    }
  }

  offTypingStart() {
    if (this.socket) {
      this.socket.off('typing_started');
    }
  }

  offTypingStop() {
    if (this.socket) {
      this.socket.off('typing_stopped');
    }
  }

  // Online status methods
  onUserOnline(callback: (data: { userId: string; userName: string }) => void) {
    if (this.socket) {
      this.socket.on('user_online', callback);
    }
  }

  onUserOffline(callback: (data: { userId: string; userName: string }) => void) {
    if (this.socket) {
      this.socket.on('user_offline', callback);
    }
  }

  offUserOnline() {
    if (this.socket) {
      this.socket.off('user_online');
    }
  }

  offUserOffline() {
    if (this.socket) {
      this.socket.off('user_offline');
    }
  }

  onMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  onNewMessageNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification:new_message', callback);
    }
  }

  offNewMessageNotification() {
    if (this.socket) {
      this.socket.off('notification:new_message');
    }
  }

  onItemStatusNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification:item_status', callback);
    }
  }

  offItemStatusNotification() {
    if (this.socket) {
      this.socket.off('notification:item_status');
    }
  }

  onTradeRequestNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification:trade_request', callback);
    }
  }
  offTradeRequestNotification() {
    if (this.socket) {
      this.socket.off('notification:trade_request');
    }
  }
  onTradeRequestStatusNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification:trade_request_status', callback);
    }
  }
  offTradeRequestStatusNotification() {
    if (this.socket) {
      this.socket.off('notification:trade_request_status');
    }
  }
  onTradeCompletedNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification:trade_completed', callback);
    }
  }
  offTradeCompletedNotification() {
    if (this.socket) {
      this.socket.off('notification:trade_completed');
    }
  }

  offMessage() {
    if (this.socket) {
      this.socket.off('receive_message');
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();