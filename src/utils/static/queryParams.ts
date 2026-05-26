import { SortDirection } from '@mui/material';

import { PAGE_SIZE } from '@/config/constants.config';
import { ReservationSysStatus } from '@/models/booking.model';
import { InquiriesStatus } from '@/models/inquiries.model';
import { InvoiceLanguage, InvoiceStatus, RecipientType } from '@/models/invoices.model';
import { UserRoleName, UserStatus } from '@/models/user.model';

export const createQueryParams = ({
  pageNumber,
  pageSize = PAGE_SIZE,
  search = '',
  name = '',
  sortBy,
  sortDirection,
  activeOnly,
  role,
  status,
}: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  name?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  activeOnly?: boolean;
  role?: UserRoleName;
  status?: UserStatus;
}): string => {
  const params = new URLSearchParams(
    Object.entries({
      pageNumber,
      pageSize,
      search: search.trim() || undefined,
      name: name.trim() || undefined,
      sortBy: sortBy || undefined,
      sortDirection: sortBy ? sortDirection && sortDirection?.toUpperCase() : undefined,
      activeOnly: activeOnly || undefined,
      role: role || undefined,
      userStatus: status || undefined,
    })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

  return `?${params.toString()}`;
};

export const createQueryParamsWithPage = ({
  pageNumber,
  pageSize = PAGE_SIZE,
  search = '',
  name = '',
  sortBy,
  sortDirection,
  activeOnly,
  manufacturerId,
  countryCode,
  primarySource,
  reservationStatus,
  userId,
  dateFrom,
  dateTo,
  email,
  firstName,
  lastName,
  inquiriesStatuses,
  id,
  paymentPhaseIds,
  reservationId,
  recipientType,
  recipientName,
  language,
  invoiceStatus,
  departureDate,
  agencyId,
}: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  name?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  activeOnly?: boolean;
  manufacturerId?: number;
  countryCode?: string;
  primarySource?: string;
  reservationStatus?: ReservationSysStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  inquiriesStatuses?: InquiriesStatus;
  id?: string;
  paymentPhaseIds?: number[];
  reservationId?: string;
  recipientType?: RecipientType | string;
  recipientName?: string;
  language?: InvoiceLanguage;
  invoiceStatus?: InvoiceStatus;
  departureDate?: string;
  agencyId?: string;
}): string => {
  let sort: string | undefined;

  if (sortBy) {
    const direction = sortDirection ? sortDirection.toUpperCase() : 'ASC';

    sort = `${sortBy},${direction}`;
  }

  const params = new URLSearchParams(
    Object.entries({
      page: pageNumber,
      size: pageSize,
      search: search.trim() || undefined,
      name: name.trim() || undefined,
      sort: sort || undefined,
      activeOnly: activeOnly || undefined,
      manufacturerIds: manufacturerId || undefined,
      countryCode: countryCode || undefined,
      primarySource: primarySource || undefined,
      status: reservationStatus || undefined,
      userId: userId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      email: email || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      statuses: inquiriesStatuses || undefined,
      id: id || undefined,
      paymentPhaseIds: paymentPhaseIds || undefined,
      reservationId: reservationId || undefined,
      recipientType: recipientType || undefined,
      recipientName: recipientName || undefined,
      language: language || undefined,
      invoiceStatus: invoiceStatus || undefined,
      departureDate: departureDate || undefined,
      agencyId: agencyId || undefined,
    })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

  return `?${params.toString()}`;
};
