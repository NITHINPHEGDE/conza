import { create } from 'zustand'
import { mockTransactions, mockPayouts, mockCommissions, mockRevenueSummary } from '../../mock/dashboard'

const useFinanceStore = create((set) => ({
  transactions: mockTransactions,
  payouts: mockPayouts,
  commissions: mockCommissions,
  revenueSummary: mockRevenueSummary,
  loading: false,
  period: 'monthly',
  setPeriod: (period) => set({ period }),
}))

export default useFinanceStore
