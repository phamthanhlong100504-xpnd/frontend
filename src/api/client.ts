import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  Customer,
  Contract,
  LoanPaymentSchedule,
  PaymentRequest,
  OutstandingDebtStatisticsData,
  OutstandingDebtStatisticsRequest,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ImportOrder,
  SupplierProduct,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeSchedule = (schedule: LoanPaymentSchedule): LoanPaymentSchedule => ({
  ...schedule,
  penaltyDue: schedule.penaltyDue ?? schedule.penaltyFee ?? 0,
  overduePrinciple: schedule.overduePrinciple ?? 0,
  overduePrinciplePaid: schedule.overduePrinciplePaid ?? 0,
});

const normalizeSupplier = (supplier: Supplier): Supplier => ({
  ...supplier,
  status: supplier.deletedAt == null ? 'ACTIVE' : 'INACTIVE',
});

export const customerApi = {
  search: (params: { name?: string; cccd?: string }): Promise<ApiResponse<Customer[]>> =>
    apiClient
      .post('/customers/search', {
        name: params.name ?? null,
        cccd: params.cccd ?? null,
      })
      .then((res: AxiosResponse<ApiResponse<Customer[]>>) => res.data),

  getActiveContracts: (customerId: string): Promise<ApiResponse<Contract[]>> =>
    apiClient
      .get(`/payments/${customerId}/contracts/active`)
      .then((res: AxiosResponse<ApiResponse<Contract[]>>) => res.data),

  getPaymentSchedule: (
    customerId: string,
    contractId: string
  ): Promise<ApiResponse<LoanPaymentSchedule[]>> =>
    apiClient
      .get(`/payments/${customerId}/schedule/${contractId}`)
      .then((res: AxiosResponse<ApiResponse<LoanPaymentSchedule[]>>) => ({
        ...res.data,
        data: res.data.data.map(normalizeSchedule),
      })),

  executePayment: (
    customerId: string,
    request: PaymentRequest
  ): Promise<ApiResponse<LoanPaymentSchedule>> =>
    apiClient
      .post(`/payments/${customerId}/contracts/payment`, request)
      .then((res: AxiosResponse<ApiResponse<LoanPaymentSchedule>>) => ({
        ...res.data,
        data: normalizeSchedule(res.data.data),
      })),
};

export const statisticsApi = {
  getOutstandingDebt: (
    params: OutstandingDebtStatisticsRequest
  ): Promise<ApiResponse<OutstandingDebtStatisticsData>> =>
    apiClient
      .post('/statistics/customer/outstanding-debt/detail', {
        fromDate: params.fromDate ?? null,
        endDate: params.endDate ?? null,
        minDebt: params.minDebt ?? null,
        maxDebt: params.maxDebt ?? null,
        customerId: params.customerId ?? null,
      })
      .then((res: AxiosResponse<ApiResponse<OutstandingDebtStatisticsData>>) => res.data),

  // Backward-compatible alias (component đang dùng tên này)
  getOutstandingDebtDetail: (
    params: OutstandingDebtStatisticsRequest = {}
  ): Promise<ApiResponse<OutstandingDebtStatisticsData>> => statisticsApi.getOutstandingDebt(params),
};

export const supplierApi = {
  getAll: (): Promise<ApiResponse<Supplier[]>> =>
    apiClient
      .get('/suppliers')
      .then((res: AxiosResponse<ApiResponse<Supplier[]>>) => ({
        ...res.data,
        data: res.data.data.map(normalizeSupplier),
      })),

  // Backward-compatible aliases
  getSuppliers: (): Promise<ApiResponse<Supplier[]>> => supplierApi.getAll(),

  create: (data: CreateSupplierRequest): Promise<ApiResponse<Supplier>> =>
    apiClient
      .post('/suppliers', data)
      .then((res: AxiosResponse<ApiResponse<Supplier>>) => res.data),

  createSupplier: (data: CreateSupplierRequest): Promise<ApiResponse<Supplier>> => supplierApi.create(data),

  update: (id: string, data: UpdateSupplierRequest): Promise<ApiResponse<Supplier>> =>
    apiClient
      .put(`/suppliers/${id}`, data)
      .then((res: AxiosResponse<ApiResponse<Supplier>>) => res.data),

  updateSupplier: (id: string, data: UpdateSupplierRequest): Promise<ApiResponse<Supplier>> =>
    supplierApi.update(id, data),

  delete: (id: string): Promise<ApiResponse<null>> =>
    apiClient
      .delete(`/suppliers/${id}`)
      .then((res: AxiosResponse<ApiResponse<null>>) => res.data),

  deleteSupplier: (id: string): Promise<ApiResponse<null>> => supplierApi.delete(id),

  // Import orders by supplier name (per backend)
  getPendingImportOrders: (name: string): Promise<ApiResponse<ImportOrder[]>> =>
    apiClient
      .get('/import-orders/pending', { params: { name } })
      .then((res: AxiosResponse<ApiResponse<ImportOrder[]>>) => res.data),

  getCompletedImportOrders: (name: string): Promise<ApiResponse<ImportOrder[]>> =>
    apiClient
      .get('/import-orders/completed', { params: { name } })
      .then((res: AxiosResponse<ApiResponse<ImportOrder[]>>) => res.data),

  // Legacy endpoint (keep in case BE still supports it)
  getImportOrders: (supplierId: string): Promise<ApiResponse<ImportOrder[]>> =>
    apiClient
      .get(`/suppliers/${supplierId}/import-orders`)
      .then((res: AxiosResponse<ApiResponse<ImportOrder[]>>) => res.data),

  getProducts: (supplierId: string): Promise<ApiResponse<SupplierProduct[]>> =>
    apiClient
      .get(`/suppliers/${supplierId}/products`)
      .then((res: AxiosResponse<ApiResponse<SupplierProduct[]>>) => res.data),

  getSupplierProducts: (supplierId: string): Promise<ApiResponse<SupplierProduct[]>> =>
    supplierApi.getProducts(supplierId),
};

