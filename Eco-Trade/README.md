# EcoTrade ♻️

**EcoTrade** is a full-featured MERN stack platform for sustainable trading, recycling, and community-driven waste management. It connects individuals, collectors, and organizations to foster a circular economy and reduce landfill waste.

---

## 🌱 Project Mission
Empower everyone to:
- List, trade, or donate recyclable/reusable items
- Discover and request items from others
- Connect, chat, and arrange trades securely
- Track environmental impact and promote eco-friendly habits

---

## 🚀 Key Features
- **User Authentication** (JWT, role-based, password reset)
- **Item Listings** with image uploads (Cloudinary)
- **Location-based Search & Mapping**
- **Real-time Chat** (Socket.io)
- **Trade Requests & Status Tracking**
- **Admin Dashboard** for platform management
- **User Ratings & Reviews**
- **Responsive, Mobile-first UI**
- **Email Notifications** (trade, password, contact)
- **Security Best Practices** (Helmet, CORS, rate limiting, validation)

---

## 🛠️ Tech Stack
**Frontend:**
- React.js (TypeScript)
- Tailwind CSS
- React Router
- Socket.io Client
- Lucide React Icons

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io
- Cloudinary (image uploads)
- Express Validator

**Security:**
- Helmet, CORS, bcrypt, express-rate-limit

---

## 📦 Project Structure
```
Eco-Trade/
├── src/                # Frontend React app
│   ├── components/     # UI components (ItemCard, AddItemModal, etc.)
│   ├── pages/          # Main pages (Home, Dashboard, Marketplace, Chat, etc.)
│   ├── context/        # React Context providers (Auth, Data)
│   ├── services/       # API & socket services
│   └── ...
├── server/             # Backend Node.js app
│   ├── models/         # Mongoose models (User, Item, Chat, TradeRequest, etc.)
│   ├── routes/         # API endpoints (auth, items, chat, users)
│   ├── middleware/     # Auth, validation, upload, socketAuth
│   ├── config/         # Config files (Cloudinary, etc.)
│   └── index.js        # Server entry point
└── ...
```

---

## ⚡ Quick Start
### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Cloudinary account (for images)

### Setup
1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd Eco-Trade
   ```
2. **Install dependencies**
   ```bash
   npm install           # Frontend
   cd server && npm install  # Backend
   cd ..
   ```
3. **Configure environment**
   - Copy and edit `server/.env.example` to `server/.env` with your MongoDB, JWT, and Cloudinary credentials.
4. **Run the app**
   ```bash
   npm run dev:full      # Start frontend & backend together
   # or
   npm run dev           # Frontend only
   npm run server:dev    # Backend only
   ```
5. **Access**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## 🔑 API Highlights
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `PUT /api/auth/profile` — Update profile
- `GET /api/items` — List items
- `POST /api/items` — Create item (with images, location, weight, dimensions)
- `PUT /api/items/:id` — Update item
- `DELETE /api/items/:id` — Delete item
- `POST /api/items/:id/request` — Create trade request
- `POST /api/items/:id/favorite` — Toggle favorite
- `GET /api/chat` — User chats
- `POST /api/chat/:id/messages` — Send message
- `POST /api/users/contact-user` — Contact seller via email

---

## 🖥️ Main UI Pages
- **Home**: Project intro, impact stats, and call to action
- **Marketplace**: Browse, search, and filter items
- **Dashboard**: Manage your listings, trades, and profile
- **Chat**: Real-time messaging with other users
- **Admin**: Platform management (admin only)
- **Auth**: Login, register, password reset

---

## 🌍 Environmental Impact
EcoTrade helps:
- **Reduce landfill waste**
- **Promote reuse and recycling**
- **Build eco-conscious communities**
- **Support the circular economy**

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch
3. Commit and push your changes
4. Open a Pull Request

---

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.

---

**Made with ❤️ for a sustainable future!**