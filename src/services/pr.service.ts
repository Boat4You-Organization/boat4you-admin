import { api } from '@/config/axios.config';

import { createPrApi } from './pr.api';

/** PR module endpoints bound to the admin's axios instance (JWT, refresh). */
const PrService = createPrApi(api);

export default PrService;
