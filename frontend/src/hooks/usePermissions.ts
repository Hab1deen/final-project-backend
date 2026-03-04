import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';

  const permissions = {
    // Quotations
    canCreateQuotation: true, // ทุกคนสร้างได้
    canEditQuotation: true,
    canDeleteQuotation: isAdmin, // เฉพาะ Admin
    canConvertToInvoice: true,

    // Invoices
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: isAdmin, // เฉพาะ Admin
    canRecordPayment: true,

    // Products
    canCreateProduct: true,
    canEditProduct: true,
    canDeleteProduct: isAdmin, // เฉพาะ Admin

    // Customers
    canCreateCustomer: true,
    canEditCustomer: true,
    canDeleteCustomer: isAdmin, // เฉพาะ Admin



    // Admin Panel
    canAccessAdminPanel: isAdmin,
    canManageUsers: isAdmin,

    // Settings
    canEditOwnProfile: true,
    canChangeOwnPassword: true,
  };

  return { permissions, isAdmin, isUser };
};