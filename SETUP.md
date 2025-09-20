# Shiv Accounts Cloud - Complete Setup Guide

This guide will help you set up and run the complete Shiv Accounts Cloud system with both frontend and backend.

## 📁 Project Structure

```
shiv-accounts-cloud/
├── frontend/                 # React TypeScript Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React Context providers
│   │   ├── types/           # TypeScript type definitions
│   │   └── ...
│   ├── public/              # Static assets
│   ├── package.json
│   └── ...
├── backend/                 # Node.js Express Backend
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── server.js            # Main server file
│   ├── package.json
│   └── ...
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (Recommended) - [Download](https://code.visualstudio.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Deeptiwakchaure/shiv-account.git
cd shiv-account
```

### Step 2: Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```env
   MONGO_URI=mongodb://localhost:27017/shiv-accounts-cloud
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
   JWT_EXPIRE=7d
   HSN_API_BASE_URL=https://services.gst.gov.in/commonservices/hsn/search/qsearch
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   - **Local MongoDB**: Start MongoDB service
   - **MongoDB Atlas**: Use your connection string in `.env`

5. **Start Backend Server**
   ```bash
   npm run dev
   ```
   
   Backend will run on: `http://localhost:5000`

### Step 3: Frontend Setup

1. **Open new terminal and navigate to project root**
   ```bash
   cd ..  # Go back to project root
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Frontend Development Server**
   ```bash
   npm start
   ```
   
   Frontend will run on: `http://localhost:3000`

### Step 4: Verify Installation

1. **Backend Health Check**
   - Visit: `http://localhost:5000/api/health`
   - Should return: `{"success": true, "message": "Shiv Accounts Cloud API is running"}`

2. **Frontend Application**
   - Visit: `http://localhost:3000`
   - Should show the login page

3. **Test Login**
   - Email: `admin@shivfurniture.com`
   - Password: `admin123`

## 🔧 Development Commands

### Backend Commands
```bash
cd backend

# Development
npm run dev          # Start with nodemon (auto-restart)

# Production
npm start            # Start production server

# Testing
npm test             # Run tests

# Database
npm run seed         # Seed database with sample data
```

### Frontend Commands
```bash
# Development
npm start            # Start development server

# Production Build
npm run build        # Create production build

# Testing
npm test             # Run tests

# Linting
npm run lint         # Run ESLint
```

## 🗄️ Database Setup

### Option 1: Local MongoDB

1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Follow installation instructions for your OS

2. **Start MongoDB Service**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is running**
   ```bash
   mongosh
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create MongoDB Atlas Account**
   - Visit: https://www.mongodb.com/atlas
   - Sign up for free account

2. **Create Cluster**
   - Choose free tier (M0)
   - Select region closest to you
   - Create cluster

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password

4. **Update .env file**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shiv-accounts-cloud
   ```

## 🔐 Default User Accounts

The system comes with pre-configured user accounts:

### Admin User
- **Email**: `admin@shivfurniture.com`
- **Password**: `admin123`
- **Role**: Admin (Full access)

### Accountant User
- **Email**: `accountant@shivfurniture.com`
- **Password**: `acc123`
- **Role**: Accountant (Limited access)

## 📱 Features Overview

### ✅ Implemented Features

#### Frontend
- **Authentication System** - Login/logout with role-based access
- **Dashboard** - Real-time analytics and quick actions
- **Master Data Management**:
  - Contact Master (Customers & Vendors)
  - Product Master (Products & Services)
  - Tax Master (Tax rules and rates)
  - Chart of Accounts (Ledger management)
- **Transaction Management**:
  - Purchase Orders (Fully functional)
  - Placeholder for other transaction modules
- **Reports**:
  - Balance Sheet
  - Profit & Loss Statement
  - Stock Report
  - Partner Ledger
- **Responsive Design** - Works on all devices

#### Backend
- **JWT Authentication** - Secure user authentication
- **MongoDB Integration** - Database operations with Mongoose
- **RESTful API** - Well-structured API endpoints
- **Input Validation** - Request validation with express-validator
- **Error Handling** - Centralized error handling
- **Rate Limiting** - API security
- **HSN Code Integration** - GST HSN API integration
- **Role-based Access** - Admin, Accountant, Contact roles

### 🚧 Coming Soon Features

- Complete transaction modules (Vendor Bills, Sales Orders, Customer Invoices)
- Payment processing and tracking
- Advanced reporting with charts
- Export functionality (PDF/Excel)
- Email notifications
- File upload for documents
- Advanced search and filtering

## 🛠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **Solution**: Make sure MongoDB is running locally or check your Atlas connection string

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::5000
   ```
   **Solution**: Change PORT in backend/.env file or kill the process using the port

3. **CORS Error**
   ```
   Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy
   ```
   **Solution**: Check FRONTEND_URL in backend/.env file

4. **JWT Secret Error**
   ```
   Error: secretOrPrivateKey has a value of undefined
   ```
   **Solution**: Set JWT_SECRET in backend/.env file

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Backend
DEBUG=* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### Contact Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/contacts` | Get all contacts | Yes |
| GET | `/api/contacts/:id` | Get single contact | Yes |
| POST | `/api/contacts` | Create contact | Yes (Admin/Accountant) |
| PUT | `/api/contacts/:id` | Update contact | Yes (Admin/Accountant) |
| DELETE | `/api/contacts/:id` | Delete contact | Yes (Admin) |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | Yes |
| GET | `/api/products/:id` | Get single product | Yes |
| POST | `/api/products` | Create product | Yes (Admin/Accountant) |
| PUT | `/api/products/:id` | Update product | Yes (Admin/Accountant) |
| DELETE | `/api/products/:id` | Delete product | Yes (Admin) |

### HSN Code Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/hsn/search` | Search HSN codes | Yes |
| GET | `/api/hsn/validate/:code` | Validate HSN code | Yes |
| GET | `/api/hsn/popular` | Get popular HSN codes | Yes |

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

### Backend Deployment (Heroku)

1. **Install Heroku CLI**
   - Download from: https://devcenter.heroku.com/articles/heroku-cli

2. **Login and Create App**
   ```bash
   heroku login
   heroku create shiv-accounts-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGO_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is proprietary software developed for Shiv Accounts Cloud.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Happy Coding! 🚀**
