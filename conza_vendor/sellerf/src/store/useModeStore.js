import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useModeStore = create((set, get) => ({
  mode:       'materials', // 'materials' | 'rental'
  sellerType: 'both',      // 'material' | 'rental' | 'both' — mirrors the vendor's registered sellerType
  canToggle:  true,        // only 'both' vendors may switch mode / see the toggle

  // Called whenever we know the logged-in vendor's sellerType (login, register,
  // and app-boot session restore). Locks `mode` to the vendor's single allowed
  // listing type when they registered as 'material' or 'rental' only, so every
  // screen that reads `mode` automatically shows/creates only that type.
  setModeFromSellerType: async (sellerType) => {
    const type = sellerType || 'both';
    if (type === 'material') {
      set({ sellerType: type, mode: 'materials', canToggle: false });
      await AsyncStorage.setItem('vendorMode', 'materials');
    } else if (type === 'rental') {
      set({ sellerType: type, mode: 'rental', canToggle: false });
      await AsyncStorage.setItem('vendorMode', 'rental');
    } else {
      set({ sellerType: 'both', canToggle: true });
      const saved = await AsyncStorage.getItem('vendorMode');
      if (saved) set({ mode: saved });
    }
  },

  setMode: async (mode) => {
    // Single-type vendors can never switch mode, even via a direct call —
    // the toggle is hidden for them, but this guard covers any other path.
    if (!get().canToggle) return;
    set({ mode });
    await AsyncStorage.setItem('vendorMode', mode);
  },

  loadMode: async () => {
    if (!get().canToggle) return;
    const saved = await AsyncStorage.getItem('vendorMode');
    if (saved) set({ mode: saved });
  },
}));

export default useModeStore;