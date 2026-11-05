import { Navigate } from 'react-router-dom';

import Loader from '@/components/Loader';
import { navigationForUser } from '@/config/navigation.config';
import { browserStorage, landingPath, workspacesFor } from '@/utils/workspace';
import { useAuthStore } from '@/valtio/auth/auth.store';

/**
 * `/` opens the workspace used last in this browser: Charter → Bookings, Marketing → Contact Center.
 * Waits for the session to be restored so the user's roles are known; a remembered workspace this user
 * cannot open (a MANAGER after a SYSTEM_ADMIN on the same browser) falls back to Bookings.
 */
const WorkspaceLanding = () => {
  const { user, authenticating } = useAuthStore();

  if (authenticating) return <Loader />;

  return <Navigate to={landingPath(browserStorage(), workspacesFor(navigationForUser(user)))} replace />;
};

export default WorkspaceLanding;
