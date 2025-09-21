# 🚀 Quick Start Guide - Shiv Accounts Cloud

## 🎯 **Step-by-Step Testing Guide**

### **1. Start the System**
```bash
# Option 1: Use the batch file (Windows)
double-click start-servers.bat

# Option 2: Manual start
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
npm start
```

### **2. First Time Setup**

#### **Register Admin User:**
1. Go to http://localhost:3000
2. Click "Register" 
3. Create admin account:
   - Name: `Admin User`
   - Email: `admin@shivaccounts.com`
   - Password: `admin123`
   - Role: `Admin`

#### **Login:**
1. Use the credentials you just created
2. You'll be redirected to the Dashboard

### **3. Set Up Master Data**

#### **Create Contacts:**
1. Go to **Masters → Contacts**
2. Add a Customer:
   - Name: `ABC Corporation`
   - Type: `Customer`
   - Email: `abc@corp.com`
   - Mobile: `9876543210`
3. Add a Vendor:
   - Name: `XYZ Suppliers`
   - Type: `Vendor`
   - Email: `xyz@suppliers.com`

#### **Create Products:**
1. Go to **Masters → Products**
2. Add a Product:
   - Name: `Office Chair`
   - Type: `Product`
   - Category: `Furniture`
   - HSN Code: `9401`
   - Sale Price: `2500`
   - Purchase Price: `2000`

#### **Set Up Taxes:**
1. Go to **Masters → Taxes**
2. Add GST:
   - Name: `GST 18%`
   - Rate: `18`
   - Type: `GST`

### **4. Test Transaction Workflows**

#### **Create Purchase Order:**
1. Go to **Transactions → Purchase Orders**
2. Click "Add Purchase Order"
3. Select vendor: `XYZ Suppliers`
4. Add items: `Office Chair` (Qty: 10)
5. Save and mark as "Received"

#### **Convert to Vendor Bill:**
1. In Purchase Orders list
2. Click "Convert to Bill" for the received PO
3. Verify bill is created automatically

#### **Create Sales Order:**
1. Go to **Transactions → Sales Orders**
2. Create order for customer: `ABC Corporation`
3. Add items: `Office Chair` (Qty: 5)
4. Mark as "Confirmed"

#### **Convert to Customer Invoice:**
1. In Sales Orders list
2. Click "Convert to Invoice"
3. Verify invoice is created

### **5. Test Contact Portal**

#### **Create Contact User:**
1. Go to **Masters → Contacts**
2. Edit `ABC Corporation`
3. Check "Create User Account"
4. Set password: `customer123`
5. Save

#### **Test Contact Login:**
1. Logout from admin account
2. Login with:
   - Email: `abc@corp.com`
   - Password: `customer123`
3. You'll see the Contact Portal
4. View invoices, bills, payments

### **6. Test Reporting**

#### **Generate Reports:**
1. Login as Admin/Accountant
2. Go to **Reports**
3. Test each report:
   - **Balance Sheet** - Shows financial position
   - **Profit & Loss** - Shows income/expenses
   - **Stock Report** - Shows inventory levels
   - **Partner Ledger** - Shows contact transactions

#### **Export Reports:**
1. Open any report
2. Click "Export PDF" or "Export CSV"
3. Verify files download correctly

### **7. Test Payment Processing**

#### **Record Payment:**
1. Go to **Transactions → Payments**
2. Create payment:
   - Type: `Received` (from customer)
   - Contact: `ABC Corporation`
   - Amount: `12500`
   - Link to invoice created earlier

### **8. Test Advanced Features**

#### **HSN Code Search:**
1. When creating products
2. Try typing in HSN field
3. See auto-suggestions appear

#### **Inventory Tracking:**
1. Check stock levels after transactions
2. Verify movements are recorded
3. Test low stock alerts

---

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Sales Cycle**
```
Create Customer → Create Product → Create Sales Order → 
Convert to Invoice → Record Payment → Check Reports
```

### **Scenario 2: Complete Purchase Cycle**
```
Create Vendor → Create Product → Create Purchase Order → 
Convert to Bill → Record Payment → Check Stock
```

### **Scenario 3: Contact Portal**
```
Create Contact User → Login as Contact → 
View Invoices → Check Payment History
```

---

## 🔍 **What to Verify**

### **✅ Functionality Checklist:**
- [ ] User registration and login
- [ ] Admin dashboard loads
- [ ] Master data CRUD operations
- [ ] Transaction creation and conversion
- [ ] Contact portal access
- [ ] Report generation and export
- [ ] Payment processing
- [ ] Inventory tracking
- [ ] HSN code integration
- [ ] Real-time updates

### **✅ UI/UX Checklist:**
- [ ] Responsive design on mobile
- [ ] Loading states work
- [ ] Toast notifications appear
- [ ] Forms validate properly
- [ ] Navigation is intuitive
- [ ] Search and filters work

### **✅ Security Checklist:**
- [ ] Role-based access works
- [ ] Contact users see only their data
- [ ] Unauthorized routes redirect
- [ ] JWT tokens expire properly

---

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **Backend Not Starting:**
- Check if port 5001 is free
- Verify MongoDB is running
- Check console for error messages

#### **Frontend Not Connecting:**
- Verify backend is running on port 5001
- Check browser console for errors
- Ensure CORS is configured

#### **Login Issues:**
- Verify user exists in database
- Check password is correct
- Clear browser cache/localStorage

---

## 🎉 **Success Indicators**

When everything works correctly, you should see:
- ✅ Smooth navigation between pages
- ✅ Data saves and loads correctly
- ✅ Reports generate with real data
- ✅ Contact portal shows filtered data
- ✅ Export functions work
- ✅ No console errors
- ✅ Professional UI throughout

---

**🎯 Your Shiv Accounts Cloud system is now ready for production use!**

Test thoroughly and enjoy your complete ERP solution! 🚀
