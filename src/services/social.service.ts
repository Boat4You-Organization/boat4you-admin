import { api } from '@/config/axios.config';

import { createSocialApi } from './social.api';

/** Objave endpoints bound to the admin's axios instance (JWT, refresh). */
const SocialService = createSocialApi(api);

export const API_URL = import.meta.env.VITE_BOAT_API_URL || '';

export default SocialService;
