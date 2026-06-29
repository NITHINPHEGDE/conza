import api from './axiosInstance';

export const walletAPI = {
  getBalance: async () => {
    const res = await api.get('/wallet/balance');
    return res.data;
  },
};
