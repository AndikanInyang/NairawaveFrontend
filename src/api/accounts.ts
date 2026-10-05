import api from './client';

export interface Account {
  id: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'FIXED_DEPOSIT';
  balance: number;
  currency: string;
  active: boolean;
  bankName: string;
  createdAt: string;
}

export const accountsApi = {
  list: () =>
    api.get<ApiEnvelope<Account[]>>('/accounts'),

  getById: (id: number) =>
    api.get<ApiEnvelope<Account>>(`/accounts/${id}`),

  getBalance: (id: number) =>
    api.get<ApiEnvelope<{ balance: number }>>(`/accounts/${id}/balance`),

  create: (data: { accountType: string }) =>
    api.post<ApiEnvelope<Account>>('/accounts', data),
};

export interface Account {
  id: number
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  active: boolean
  bankName: string
  createdAt: string
}