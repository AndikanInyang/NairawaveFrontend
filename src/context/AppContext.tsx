import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { accountsApi, type Account } from '../api/accounts';
import {
  transactionsApi,
  type TransactionDTO,
  type TransferRequest,
  type PaymentRequest,
} from '../api/transactions';

// Types 

export type Screen =
  | 'dashboard'
  | 'send'
  | 'receive'
  | 'airtime'
  | 'data'
  | 'bills'
  | 'transactions';

export interface AppContextType {
  // Navigation
  screen: Screen;
  navigate: (s: Screen) => void;

  // Account data (from DB)
  accounts: Account[];
  primaryAccount: Account | null;
  balance: number;
  isLoadingAccounts: boolean;
  refreshAccounts: () => Promise<void>;

  // Transactions (from DB)
  transactions: TransactionDTO[];
  isLoadingTransactions: boolean;
  hasMoreTransactions: boolean;
  refreshTransactions: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;

  // Actions (hit backend)
  transfer: (data: TransferRequest) => Promise<TransactionDTO>;
  makePayment: (data: PaymentRequest) => Promise<TransactionDTO>;

  // UI
  showToast: (message: string, type?: 'success' | 'error') => void;

  // User (derived from auth)
  user: {
    name: string;
    phone: string;
    accountNumber: string;
    bankName: string;
    initials: string;
  };
}

//  Context 

const AppCtx = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

//  Provider

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();

  // Navigation
  const [screen, setScreen] = useState<Screen>('dashboard');

  // Account state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Transaction state
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [txPage, setTxPage] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);

  // Derived
  const primaryAccount = accounts.length > 0 ? accounts[0] : null;
  const balance = primaryAccount?.balance ?? 0;

  const userDisplay = {
    name: authUser ? `${authUser.firstName} ${authUser.lastName}` : '',
    phone: authUser?.phoneNumber ?? '',
    accountNumber: primaryAccount?.accountNumber ?? '',
    bankName: 'NairaWave MFB',
    initials: authUser
      ? `${authUser.firstName[0]}${authUser.lastName[0]}`
      : '',
  };

  //  Fetch accounts 

  const refreshAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true);
      const { data } = await accountsApi.list();
      setAccounts(data.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  //  Fetch transactions 

   const refreshTransactions = useCallback(async (acctNum?: string) => {
    const targetAcct = acctNum || primaryAccount?.accountNumber;
    if (!targetAcct) return;
    try {
      setIsLoadingTransactions(true);
      setTxPage(0);
      const { data } = await transactionsApi.history(
        targetAcct,
        0,
        20
      );
      setTransactions(data.data.content);
      // Spring Data Page uses "number" for current page index
      const currentPage = (data.data as any).number ?? data.data.page ?? 0;
      setHasMoreTransactions(currentPage < data.data.totalPages - 1);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [primaryAccount?.accountNumber]);

  const loadMoreTransactions = useCallback(async () => {
    if (!primaryAccount || !hasMoreTransactions) return;
    const nextPage = txPage + 1;
    try {
      const { data } = await transactionsApi.history(
        primaryAccount.accountNumber,
        nextPage,
        20
      );
      setTransactions((prev) => [...prev, ...data.data.content]);
      setTxPage(nextPage);
      setHasMoreTransactions(data.data.page < data.data.totalPages - 1);
    } catch (err) {
      console.error('Failed to load more transactions:', err);
    }
  }, [primaryAccount, txPage, hasMoreTransactions]);

  //  Initial data load 
  useEffect(() => {
    if (authUser) {
      refreshAccounts();
    }
  }, [authUser, refreshAccounts]);

  useEffect(() => {
    if (primaryAccount) {
      refreshTransactions();
    }
  }, [primaryAccount?.id, refreshTransactions]);

  //  Actions

  const transfer = async (payload: TransferRequest): Promise<TransactionDTO> => {
    const { data } = await transactionsApi.transfer(payload);
    // Refresh with source account number immediately
    await Promise.all([
      refreshAccounts(),
      refreshTransactions(payload.sourceAccountNumber)
    ]);
    return data.data;
  };


  const makePayment = async (payload: PaymentRequest): Promise<TransactionDTO> => {
    const { data } = await transactionsApi.payment(payload);
    // Refresh with source account number immediately
    await Promise.all([
      refreshAccounts(),
      refreshTransactions(payload.accountNumber)
    ]);
    return data.data;
  };

  //  Toast 
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg: message, type });
    setTimeout(() => setToast(null), 3500);
  };

  //  Navigate 

  const navigate = (s: Screen) => setScreen(s);

  const ctx: AppContextType = {
    screen,
    navigate,
    accounts,
    primaryAccount,
    balance,
    isLoadingAccounts,
    refreshAccounts,
    transactions,
    isLoadingTransactions,
    hasMoreTransactions,
    refreshTransactions,
    loadMoreTransactions,
    transfer,
    makePayment,
    showToast,
    user: userDisplay,
  };

  return (
    <AppCtx.Provider value={ctx}>
      {children}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50
            px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2
            text-sm font-semibold whitespace-nowrap animate-slide-up
            ${toast.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}`}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {toast.type === 'success' ? (
              <polyline points="20,6 9,17 4,12" />
            ) : (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            )}
          </svg>
          {toast.msg}
        </div>
      )}
    </AppCtx.Provider>
  );
}