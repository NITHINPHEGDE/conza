import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useModeStore = create((set) => ({
  mode: 'materials', // 'materials' | 'rental'

  setMode: async (mode) => {
    set({ mode });
    await AsyncStorage.setItem('vendorMode', mode);
  },

  loadMode: async () => {
    const saved = await AsyncStorage.getItem('vendorMode');
    if (saved) set({ mode: saved });
  },
}));

export default useModeStore;