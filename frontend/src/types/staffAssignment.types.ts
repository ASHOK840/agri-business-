export type AssignmentStatus = 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type AssignmentPaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface StaffAssignment {
  id: string;
  purchaseId: string;
  staffId: string;
  assignedDate: string;
  bagsHandled: number | null;
  labourRatePerBag: string; // Decimal serializes as string over JSON
  totalLabourAmount: number;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  purchase: { id: string; purchaseNumber: string };
  staff: { id: string; staffCode: string; name: string };
  // Live payment status against totalLabourAmount — same figure
  // StaffPaymentSection shows on the assignment's own detail page.
  totalPaid: number;
  outstandingAmount: number;
  paymentStatus: AssignmentPaymentStatus;
}

export interface CreateAssignmentFormData {
  purchaseId: string;
  staffId: string;
  assignedDate: string;
  bagsHandled: string;
  labourRatePerBag: string;
}

export interface UpdateAssignmentFormData {
  assignedDate: string;
  bagsHandled: string;
  labourRatePerBag: string;
}

export interface StaffWorkload {
  staffId: string;
  staffCode: string;
  staffName: string;
  assignmentCount: number;
  totalBagsHandled: number;
  totalLabourAmount: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssignmentListResponse {
  data: StaffAssignment[];
  pagination: PaginationInfo;
}
