import { api } from '@/config/axios.config';

import { createYachtMediaApi } from './yacht-media.api';

/** Boats · Media endpoints bound to the admin's axios instance (JWT, refresh); the logic lives in yacht-media.api.ts. */
const YachtMediaService = createYachtMediaApi(api);

export const API_URL = import.meta.env.VITE_BOAT_API_URL || '';

/** Resized copy of a stored image (immutable per id and width, cached a year). */
export const imageUrl = (id: number, width: number) => `${API_URL}/public/image/${id}?width=${width}`;

export const CUSTOMER_WEB_URL = import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000';

export default YachtMediaService;
