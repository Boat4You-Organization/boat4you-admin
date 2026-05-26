import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { PAGE_NUMBER, SortDirection } from '@/config/constants.config';

export interface SearchParams {
  search: string;
  page: number;
  sortBy: string;
  sortDirection: SortDirection;
  bookingStatus: string;
  customer: string;
  startDate: string;
  endDate: string;
  inquiryStatus: string;
  country: string;
  source: string;
  userRole: string;
  userStatus: string;
  invoiceStatus: string;
  invoiceReservation: string;
  recipientType: string;
  departureDate: string;
  invoiceAgency: string;
}

const defaultParams: SearchParams = {
  search: '',
  page: PAGE_NUMBER,
  sortBy: '',
  sortDirection: 'asc',
  bookingStatus: '',
  customer: '',
  startDate: '',
  endDate: '',
  inquiryStatus: '',
  country: '',
  source: '',
  userRole: '',
  userStatus: '',
  invoiceStatus: '',
  invoiceReservation: '',
  recipientType: '',
  departureDate: '',
  invoiceAgency: '',
};

const useQueryParams = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getParam = <T>(key: keyof SearchParams, defaultValue: T): T => {
    const value = searchParams.get(key);

    if (value === null) return defaultValue;

    if (typeof defaultValue === 'boolean') return (value === 'true') as T;

    if (typeof defaultValue === 'number') return (Number(value) || defaultValue) as T;

    return value as T;
  };

  const getParamsFromUrl = (): SearchParams => ({
    search: getParam('search', defaultParams.search),
    page: getParam('page', defaultParams.page),
    sortBy: getParam('sortBy', defaultParams.sortBy),
    sortDirection: getParam('sortDirection', defaultParams.sortDirection),
    bookingStatus: getParam('bookingStatus', defaultParams.bookingStatus),
    customer: getParam('customer', defaultParams.customer),
    startDate: getParam('startDate', defaultParams.startDate),
    endDate: getParam('endDate', defaultParams.endDate),
    inquiryStatus: getParam('inquiryStatus', defaultParams.inquiryStatus),
    country: getParam('country', defaultParams.country),
    source: getParam('source', defaultParams.source),
    userRole: getParam('userRole', defaultParams.userRole),
    userStatus: getParam('userStatus', defaultParams.userStatus),
    invoiceStatus: getParam('invoiceStatus', defaultParams.invoiceStatus),
    invoiceReservation: getParam('invoiceReservation', defaultParams.invoiceReservation),
    recipientType: getParam('recipientType', defaultParams.recipientType),
    departureDate: getParam('departureDate', defaultParams.departureDate),
    invoiceAgency: getParam('invoiceAgency', defaultParams.invoiceAgency),
  });

  const params = getParamsFromUrl();

  const updateParams = (updates: Partial<SearchParams>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const defaultValue = defaultParams[key as keyof SearchParams];

      if (value === defaultValue || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    const queryString = newParams.toString();
    const newUrl = queryString ? `${location.pathname}?${queryString}` : location.pathname;

    navigate(newUrl, { replace: true });
  };

  const setParam = <K extends keyof SearchParams>(key: K | Partial<SearchParams>, value?: SearchParams[K]) => {
    if (typeof key === 'string') {
      updateParams({ [key]: value });
    } else {
      updateParams(key);
    }
  };

  const resetParams = () => {
    navigate(location.pathname, { replace: true });
  };

  const createQueryString = (customParams: Partial<SearchParams> = {}) => {
    const mergedParams = { ...params, ...customParams };
    const urlParams = new URLSearchParams();

    Object.entries(mergedParams).forEach(([key, value]) => {
      const defaultValue = defaultParams[key as keyof SearchParams];

      if (value !== defaultValue && value !== '') {
        urlParams.set(key, String(value));
      }
    });

    return urlParams.toString();
  };

  const handleSort = (sortBy: string, sortDirection: SortDirection) => {
    if (sortBy === params.sortBy && sortDirection === 'asc') {
      updateParams({ sortBy: '', sortDirection: 'asc', page: 1 });
    } else {
      updateParams({ sortBy, sortDirection, page: 1 });
    }
  };

  const handleSearch = (search: string) => {
    updateParams({
      search,
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page });
  };

  return {
    params,
    setParam,
    resetParams,
    createQueryString,
    queryParams: createQueryString(),
    handleSort,
    handleSearch,
    handlePageChange,
  };
};

export default useQueryParams;
