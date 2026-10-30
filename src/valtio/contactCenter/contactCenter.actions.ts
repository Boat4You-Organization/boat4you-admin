import ContactCenterService from '@/services/contactCenter.service';

import { contactCenterStore } from './contactCenter.store';

/** Reads the unread count; a failed read keeps the last value (the next poll tries again). */
export async function refreshContactCenterUnread(): Promise<void> {
  const { data } = await ContactCenterService.unreadCount();

  contactCenterStore.unreadCount = data.count;
}
