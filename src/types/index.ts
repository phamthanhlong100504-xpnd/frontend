// Customer Types
export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  creditScore?: number;
  cccd?: string;
}

export interface Collateral {
  id: number;
  type: string;
  description: string;
  valuationValue: number;
}

export interface LoanOffer {
  id: number;
  product: number;
  name: string;
  interestRate: number;
  penaltyRate: number;
  overdueInterestRate: number;
  overduePrincipleRate: number;
  maxAmount: number;
  termMonths: number;
}

export interface User {
  id: number;
  userName: string;
  password: string;
  phoneNumber: string;
  email: string;
  name: string;
}

export interface LoanPaymentSchedule {
  id: string;
  scheduleId?: string | null;
  termNo: number;
  dueDate: string;
  penaltyFee: number;
  overdueInterest: number;
  overduePrinciple?: number;
  interestDue: number;
  principalDue: number;
  penaltyDue?: number;
  status: string;
  penaltyFeePaid: number;
  overdueInterestPaid: number;
  overduePrinciplePaid?: number;
  interestPaid: number;
  principlePaid: number;
  contractId?: string;
  contractCode?: string;
  overdueInterestRate?: number;
  overduePrincipleRate?: number;
  interestRate?: number;
  principleDueRate?: number;
  interestDueRate?: number;
}

export interface Contract {
  id: string;
  code: string;
  status: string;
  loanAmount: number;
  signedDate: string;
  productPrice: number;
  prepaidAmount: number;
  customer?: Customer;
  user?: User;
  loanOffer?: LoanOffer;
  parentContract?: Contract | null;
  collaterals?: Collateral[];
  paymentSchedules: LoanPaymentSchedule[];
}

export interface ApiResponse<T = Record<string, unknown>> {
  code: number;
  message: string;
  data: T;
}

export interface PaymentRequest {
  scheduleId: string;
  amount: number;
}

export interface OutstandingDebtStatisticsRequest {
  // Backend thường cho phép null/empty để lấy toàn bộ dữ liệu.
  fromDate?: string | null;
  endDate?: string | null;
  minDebt?: number | null;
  maxDebt?: number | null;
  customerId?: string | null;
}

export interface DebtStatisticSchedule {
  termNo: number;
  dueDate: string;
  penaltyFee: number;
  overdueInterest: number;
  interestDue: number;
  principalDue: number;
  status: string;
  penaltyFeePaid: number;
  overdueInterestPaid: number;
  interestPaid: number;
  principlePaid: number;
}

export interface DebtStatisticContract {
  loanPaymentSchedules: DebtStatisticSchedule[];
  signDate: string;
  overdue: number;
  penalty: number;
  debt: number;
  principleRemaining: number;
  interestRemaining: number;
}

export interface CustomerDebtStatistic {
  contracts: DebtStatisticContract[];
  totalDebt: number;
  totalInterestRemaining: number;
  totalPrincipleRemaining: number;
  totalPenalty: number;
  totalOverdue: number;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
}

export interface OutstandingDebtStatisticsData {
  customerStatistics: CustomerDebtStatistic[];
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxCode: string;
  deletedAt?: string | null;
  status?: string;
}

export interface UpdateSupplierRequest {
  name: string;
  email: string;
  phone: string;
  taxCode: string;
  status: string;
}

export interface CreateSupplierRequest {
  name: string;
  email: string;
  phone: string;
  taxCode: string;
}

export interface SupplierProduct {
  id: string;
  name: string;
  status: string;
}

export interface ImportOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  importDate: string | null;
}
