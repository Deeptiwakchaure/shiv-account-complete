# Shiv Accounts Cloud - Backend API

A comprehensive Node.js backend API for the Shiv Accounts Cloud accounting and invoicing system.

## 🚀 Features

- **JWT Authentication** - Secure user authentication and authorization
- **MongoDB Integration** - Robust database operations with Mongoose
- **RESTful API** - Well-structured API endpoints
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Centralized error handling
- **Rate Limiting** - API rate limiting for security
- **HSN Code Integration** - Integration with GST HSN API
- **Role-based Access** - Admin, Accountant, and Contact user roles

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/shiv-accounts-cloud
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-here
   HSN_API_BASE_URL=https://services.gst.gov.in/commonservices/hsn/search/qsearch
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   - Local MongoDB: `mongod`
   - MongoDB Atlas: Use connection string in `.env`

5. **Run the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Contacts
- `GET /api/contacts` - Get all contacts (with pagination & search)
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact (soft delete)
- `GET /api/contacts/type/:type` - Get contacts by type

### Products
- `GET /api/products` - Get all products (with pagination & search)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (soft delete)
- `GET /api/products/stock/low` - Get low stock products

### HSN Codes
- `GET /api/hsn/search` - Search HSN codes using GST API
- `GET /api/hsn/validate/:hsnCode` - Validate HSN code format
- `GET /api/hsn/popular` - Get popular HSN codes

### Reports (Coming Soon)
- `GET /api/reports/balance-sheet` - Balance sheet report
- `GET /api/reports/profit-loss` - Profit & Loss report
- `GET /api/reports/stock` - Stock report
- `GET /api/reports/partner-ledger` - Partner ledger report

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Models

### User
- User authentication and profile management
- Role-based access control (Admin, Accountant, Contact)

### Contact
- Customer and vendor management
- Contact information and business details
- Balance tracking

### Product
- Product and service catalog
- Inventory management
- HSN code integration

### Invoice (Coming Soon)
- Customer invoice management
- Line items and calculations
- Payment tracking

### Expense (Coming Soon)
- Vendor bill management
- Expense tracking
- Payment processing

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt password hashing
- **Input Validation** - Express-validator for request validation
- **Rate Limiting** - API rate limiting to prevent abuse
- **CORS Protection** - Cross-origin resource sharing configuration
- **Helmet Security** - Security headers middleware

## 🔧 Development

### Project Structure
```
backend/
├── models/          # MongoDB models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── scripts/         # Database scripts
├── server.js        # Main server file
└── package.json     # Dependencies
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run seed` - Seed database with sample data

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/shiv-accounts-cloud` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `HSN_API_BASE_URL` | GST HSN API URL | GST API URL |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🚀 Deployment

### Local Development
1. Install MongoDB locally
2. Clone repository
3. Install dependencies: `npm install`
4. Configure environment variables
5. Start server: `npm run dev`

### Production Deployment
1. Set up MongoDB Atlas or cloud MongoDB
2. Configure production environment variables
3. Install dependencies: `npm install --production`
4. Start server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software developed for Shiv Accounts Cloud.

## 📞 Support

For support and questions, please contact the development team.
