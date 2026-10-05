import api from './client';

export interface TransactionDTO {
  id: number;
  referenceNumber: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT';
  category: 'transfer' | 'airtime' | 'data' | 'electricity' | 'receive';
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
  createdAt: string;
  sourceAccountNumber?: string;
  destinationAccountNumber?: string;

  clientReference?: string
  meterType?: 'prepaid' | 'postpaid'
  token?: string

}

export interface TransferRequest {
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  amount: number;
  description: string;
  category?: string;
}

export interface PaymentRequest {
  accountNumber: string;
  amount: number;
  category: string;
  provider: string;
  recipientId: string;
  description: string;

  clientReference?: string
  meterType?: 'prepaid' | 'postpaid'
  token?: string
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export const transactionsApi = {
  transfer: (data: TransferRequest) =>
    api.post<ApiEnvelope<TransactionDTO>>('/transactions/transfer', data),

  deposit: (data: { accountNumber: string; amount: number; description: string }) =>
    api.post<ApiEnvelope<TransactionDTO>>('/transactions/deposit', data),

  payment: (data: PaymentRequest) =>
    api.post<ApiEnvelope<TransactionDTO>>('/transactions/payment', data),

  history: (accountNumber: string, page = 0, size = 20) =>
    api.get<ApiEnvelope<PaginatedResponse<TransactionDTO>>>('/transactions/history', {
      params: { accountNumber, page, size },
    }),

  getByRef: (ref: string) =>
    api.get<ApiEnvelope<TransactionDTO>>(`/transactions/${ref}`),
};

export interface BankResolveResponse {
  accountName: string
  bankCode: string
  accountNumber: string
  bankName: string
}

export interface BankTransferRequest {
  sourceAccountNumber: string
  bankCode: string
  destinationAccountNumber: string
  accountName: string
  amount: number
  narration?: string
  clientReference?: string
}

export interface BankTransferResponse {
  referenceNumber: string
  status: string
  amount: number
  fee: number
  destinationAccountName: string
  destinationAccountNumber: string
  bankName: string
  message: string
}

export const bankTransferApi = {
  resolve: (bankCode: string, accountNumber: string) =>
    api.get<ApiEnvelope<BankResolveResponse>>('/transfers/bank/resolve', {
      params: { bankCode, accountNumber }
    }),

  transfer: (data: BankTransferRequest) =>
    api.post<ApiEnvelope<BankTransferResponse>>('/transfers/bank', {
      ...data,
      clientReference: data.clientReference ?? crypto.randomUUID()
    }),
}