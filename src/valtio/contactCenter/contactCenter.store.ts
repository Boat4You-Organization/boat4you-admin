import { proxy, useSnapshot } from 'valtio';

interface ContactCenterStore {
  /** Conversations waiting to be read, for the menu badge (polled every 30 s by the header). */
  unreadCount: number;
}

export const contactCenterStore = proxy<ContactCenterStore>({ unreadCount: 0 });

export const useContactCenterStore = () => useSnapshot(contactCenterStore);
