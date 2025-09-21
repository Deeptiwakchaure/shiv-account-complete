import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
}

const NotificationSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { products, customerInvoices, vendorBills } = useData();

  // Generate notifications based on business logic
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Low stock notifications
    const lowStockProducts = products.filter(product => product.stock <= 10);
    if (lowStockProducts.length > 0) {
      newNotifications.push({
        id: 'low-stock',
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''} running low on stock`,
        action: 'View Stock Report',
        actionUrl: '/reports/stock',
        timestamp: new Date(),
        read: false
      });
    }

    // Overdue invoices
    const overdueInvoices = customerInvoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate < new Date() && invoice.status !== 'Paid';
    });
    if (overdueInvoices.length > 0) {
      newNotifications.push({
        id: 'overdue-invoices',
        type: 'error',
        title: 'Overdue Invoices',
        message: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} are overdue`,
        action: 'View Invoices',
        actionUrl: '/transactions/customer-invoices',
        timestamp: new Date(),
        read: false
      });
    }

    // Due this week
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const dueThisWeek = customerInvoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate <= weekFromNow && dueDate >= new Date() && invoice.status !== 'Paid';
    });
    
    if (dueThisWeek.length > 0) {
      newNotifications.push({
        id: 'due-this-week',
        type: 'info',
        title: 'Invoices Due Soon',
        message: `${dueThisWeek.length} invoice${dueThisWeek.length > 1 ? 's' : ''} due within 7 days`,
        action: 'View Invoices',
        actionUrl: '/transactions/customer-invoices',
        timestamp: new Date(),
        read: false
      });
    }

    // Unpaid bills
    const unpaidBills = vendorBills.filter(bill => bill.status !== 'Paid');
    if (unpaidBills.length > 0) {
      newNotifications.push({
        id: 'unpaid-bills',
        type: 'warning',
        title: 'Unpaid Bills',
        message: `${unpaidBills.length} vendor bill${unpaidBills.length > 1 ? 's' : ''} pending payment`,
        action: 'View Bills',
        actionUrl: '/transactions/vendor-bills',
        timestamp: new Date(),
        read: false
      });
    }

    // Success notifications (example)
    if (customerInvoices.length > 0) {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthInvoices = customerInvoices.filter(invoice => 
        new Date(invoice.invoiceDate) >= thisMonth
      );
      
      if (thisMonthInvoices.length >= 10) {
        newNotifications.push({
          id: 'monthly-milestone',
          type: 'success',
          title: 'Monthly Milestone',
          message: `Great! You've created ${thisMonthInvoices.length} invoices this month`,
          timestamp: new Date(),
          read: false
        });
      }
    }

    setNotifications(newNotifications);
  }, [products, customerInvoices, vendorBills]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };



  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.timestamp.toLocaleTimeString()}
                          </div>
                          <div className="flex items-center space-x-2">
                            {notification.action && (
                              <button
                                onClick={() => {
                                  markAsRead(notification.id);
                                  if (notification.actionUrl) {
                                    window.location.href = notification.actionUrl;
                                  }
                                }}
                                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                              >
                                {notification.action}
                              </button>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
