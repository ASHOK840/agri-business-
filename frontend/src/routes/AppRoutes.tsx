import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import BusinessProfilePage from '../pages/BusinessProfilePage';
import ManageUsersPage from '../pages/users/ManageUsersPage';
import FarmerListPage from '../pages/farmers/FarmerListPage';
import FarmerFormPage from '../pages/farmers/FarmerFormPage';
import FarmerDetailPage from '../pages/farmers/FarmerDetailPage';
import CropListPage from '../pages/crops/CropListPage';
import CropFormPage from '../pages/crops/CropFormPage';
import CropDetailPage from '../pages/crops/CropDetailPage';
import StaffListPage from '../pages/staff/StaffListPage';
import StaffFormPage from '../pages/staff/StaffFormPage';
import StaffDetailPage from '../pages/staff/StaffDetailPage';
import BuyerListPage from '../pages/buyers/BuyerListPage';
import BuyerFormPage from '../pages/buyers/BuyerFormPage';
import BuyerDetailPage from '../pages/buyers/BuyerDetailPage';
import CropPriceListPage from '../pages/cropPrices/CropPriceListPage';
import CropPriceFormPage from '../pages/cropPrices/CropPriceFormPage';
import PurchaseListPage from '../pages/purchases/PurchaseListPage';
import PurchaseFormPage from '../pages/purchases/PurchaseFormPage';
import PurchaseDetailPage from '../pages/purchases/PurchaseDetailPage';
import AssignmentListPage from '../pages/staffAssignments/AssignmentListPage';
import AssignmentFormPage from '../pages/staffAssignments/AssignmentFormPage';
import AssignmentDetailPage from '../pages/staffAssignments/AssignmentDetailPage';
import StaffWorkloadPage from '../pages/staffAssignments/StaffWorkloadPage';
import StaffPaymentsListPage from '../pages/staffAssignments/StaffPaymentsListPage';
import TransporterListPage from '../pages/transportation/TransporterListPage';
import TransporterFormPage from '../pages/transportation/TransporterFormPage';
import DriverListPage from '../pages/transportation/DriverListPage';
import DriverFormPage from '../pages/transportation/DriverFormPage';
import VehicleListPage from '../pages/transportation/VehicleListPage';
import VehicleFormPage from '../pages/transportation/VehicleFormPage';
import TransportRecordListPage from '../pages/transportation/TransportRecordListPage';
import TransportRecordFormPage from '../pages/transportation/TransportRecordFormPage';
import TransportRecordDetailPage from '../pages/transportation/TransportRecordDetailPage';
import TransportPaymentsListPage from '../pages/transportation/TransportPaymentsListPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import InventoryMovementsPage from '../pages/inventory/InventoryMovementsPage';
import DispatchFormPage from '../pages/inventory/DispatchFormPage';
import AdjustmentFormPage from '../pages/inventory/AdjustmentFormPage';
import SaleListPage from '../pages/sales/SaleListPage';
import SaleFormPage from '../pages/sales/SaleFormPage';
import SaleDetailPage from '../pages/sales/SaleDetailPage';
import SaleProfitLossPage from '../pages/sales/SaleProfitLossPage';
import QualityStatusListPage from '../pages/quality/QualityStatusListPage';
import QualityStatusFormPage from '../pages/quality/QualityStatusFormPage';
import ExpenseListPage from '../pages/expenses/ExpenseListPage';
import ExpenseFormPage from '../pages/expenses/ExpenseFormPage';
import ExpenseDetailPage from '../pages/expenses/ExpenseDetailPage';
import ExpenseSummaryPage from '../pages/expenses/ExpenseSummaryPage';
import ExpenseCategoryListPage from '../pages/expenses/ExpenseCategoryListPage';
import ExpenseCategoryFormPage from '../pages/expenses/ExpenseCategoryFormPage';
import FarmerReceiptPage from '../pages/documents/FarmerReceiptPage';
import BuyerSalesInvoicePage from '../pages/documents/BuyerSalesInvoicePage';
import BuyerPaymentReceiptPage from '../pages/documents/BuyerPaymentReceiptPage';
import ReportsPage from '../pages/reports/ReportsPage';
import PaymentsListPage from '../pages/payments/PaymentsListPage';
import AuditLogPage from '../pages/audit/AuditLogPage';
import RoleRoute from './RoleRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/manage-users"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ManageUsersPage />
          </RoleRoute>
        }
      />
      <Route
        path="/business-profile"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <BusinessProfilePage />
          </RoleRoute>
        }
      />
      <Route
        path="/farmers"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <FarmerListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/farmers/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <FarmerFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/farmers/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <FarmerDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/farmers/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <FarmerFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/crops"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <CropListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/crops/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <CropFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/crops/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <CropDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/crops/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <CropFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <StaffListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <StaffFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <StaffDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <StaffFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/buyers"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <BuyerListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/buyers/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <BuyerFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/buyers/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <BuyerDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/buyers/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <BuyerFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/crop-prices"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <CropPriceListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/crop-prices/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <CropPriceFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/purchases"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <PurchaseListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/purchases/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <PurchaseFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/purchases/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <PurchaseDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff-assignments"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AssignmentListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff-assignments/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AssignmentFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff-assignments/workload"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <StaffWorkloadPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff-assignments/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AssignmentDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff-assignments/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AssignmentFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff-payments"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <StaffPaymentsListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/transporters"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <TransporterListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/transporters/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <TransporterFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/transporters/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <TransporterFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <DriverListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/drivers/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <DriverFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/drivers/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <DriverFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <VehicleListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/vehicles/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <VehicleFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/vehicles/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <VehicleFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/transport-records"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <TransportRecordListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/transport-records/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <TransportRecordFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/transport-records/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <TransportRecordDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/transport-payments"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <TransportPaymentsListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <InventoryPage />
          </RoleRoute>
        }
      />
      <Route
        path="/inventory/movements"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <InventoryMovementsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/inventory/dispatch"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <DispatchFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/inventory/adjustments"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AdjustmentFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <SaleListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/sales/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <SaleFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/sales/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <SaleDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/sales/:id/profit-loss"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <SaleProfitLossPage />
          </RoleRoute>
        }
      />
      <Route
        path="/quality-statuses"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <QualityStatusListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/quality-statuses/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <QualityStatusFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/quality-statuses/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <QualityStatusFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ExpenseListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/expenses/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ExpenseFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/expenses/summary"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ExpenseSummaryPage />
          </RoleRoute>
        }
      />
      <Route
        path="/expenses/:id"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ExpenseDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/expense-categories"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ExpenseCategoryListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/expense-categories/new"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ExpenseCategoryFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/expense-categories/:id/edit"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ExpenseCategoryFormPage />
          </RoleRoute>
        }
      />
      <Route
        path="/purchases/:purchaseId/receipt"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <FarmerReceiptPage kind="purchase" />
          </RoleRoute>
        }
      />
      <Route
        path="/purchases/:purchaseId/payment-receipt"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <FarmerReceiptPage kind="payment" />
          </RoleRoute>
        }
      />
      <Route
        path="/sales/:saleId/invoice"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <BuyerSalesInvoicePage />
          </RoleRoute>
        }
      />
      <Route
        path="/buyer-payments/:buyerPaymentId/receipt"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <BuyerPaymentReceiptPage />
          </RoleRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <ReportsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <PaymentsListPage />
          </RoleRoute>
        }
      />
      <Route
        path="/audit-log"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AuditLogPage />
          </RoleRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
