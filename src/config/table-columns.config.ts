export interface TableColumn {
  id: string;
  label: string;
  sortable: boolean;
}

export const customBoatTableColumns: TableColumn[] = [
  { id: 'modelName', label: 'table.custom-boats.model', sortable: true },
  { id: 'name', label: 'table.custom-boats.name', sortable: true },
  { id: 'countryId', label: 'table.custom-boats.location', sortable: true },
  { id: 'lowPrice', label: 'table.custom-boats.low-price', sortable: true },
];

// Column `id`s used as sort keys need to match the JPA property names on
// ReservationView (backend passes them straight into `Pageable.sort`). Pure
// display-only columns (user, route, derived prices) stay sortable: false.
export const bookingsTableColumns: TableColumn[] = [
  { id: 'reservationNumber', label: 'table.bookings.order-number', sortable: true },
  { id: 'user', label: 'table.bookings.user', sortable: false },
  { id: 'yachtName', label: 'table.bookings.boat', sortable: true },
  { id: 'agencyName', label: 'booking.charter-company', sortable: true },
  { id: 'reservationDateFrom', label: 'table.bookings.dates', sortable: true },
  { id: 'route', label: 'table.bookings.route', sortable: false },
  { id: 'reservationTotalPrice', label: 'table.bookings.price', sortable: true },
  { id: 'reservationAgencyPrice', label: 'table.bookings.agency-price', sortable: false },
  { id: 'reservationNetPrice', label: 'table.bookings.net-price', sortable: false },
  { id: 'reservationSysStatus', label: 'table.bookings.status', sortable: true },
  { id: 'reservationCreatedAt', label: 'table.bookings.booking-date', sortable: true },
];

export const invoicesTableColumns: TableColumn[] = [
  { id: 'invoicesNumber', label: 'table.invoices.invoices-number', sortable: false },
  { id: 'reservationNumber', label: 'table.invoices.reservation-number', sortable: false },
  { id: 'clientName', label: 'table.invoices.client', sortable: false },
  { id: 'price', label: 'table.invoices.price', sortable: false },
  { id: 'invoiceDate', label: 'table.invoices.date', sortable: true },
  { id: 'clientEmail', label: 'table.invoices.email', sortable: false },
  { id: 'clientPhoneNumber', label: 'table.invoices.phone-number', sortable: false },
];

export const inquiriesTableColumns: TableColumn[] = [
  { id: 'id', label: 'table.inquiries.inquiries-number', sortable: true },
  { id: 'yachtName', label: 'table.inquiries.boat', sortable: false },
  { id: 'location', label: 'table.inquiries.location', sortable: false },
  { id: 'dateFrom', label: 'table.inquiries.check-in', sortable: true },
  { id: 'dateTo', label: 'table.inquiries.check-out', sortable: true },
  { id: 'firstName', label: 'table.inquiries.name', sortable: true },
  { id: 'email', label: 'table.inquiries.email', sortable: true },
  { id: 'phone', label: 'table.inquiries.phone-number', sortable: true },
  { id: 'status', label: 'table.inquiries.status', sortable: true },
];

export const extrasTableColumns: TableColumn[] = [
  { id: 'name', label: 'table.extras.name', sortable: true },
  { id: 'matchKeys', label: 'table.extras.matchKeys', sortable: false },
];

export const agenciesTableColumns: TableColumn[] = [
  { id: 'name', label: 'table.agencies.name', sortable: true },
  { id: 'discount', label: 'table.agencies.max-discount', sortable: true },
  { id: 'email', label: 'table.agencies.email', sortable: true },
  { id: 'phoneNumber', label: 'table.agencies.phone-number', sortable: false },
  { id: 'skipExternalSystem', label: 'table.agencies.by-pass', sortable: true },
  { id: 'primarySource', label: 'table.agencies.primary-source', sortable: true },
  { id: 'active', label: 'table.agencies.status', sortable: false },
];

export const usersTableColumns: TableColumn[] = [
  { id: 'id', label: 'table.users.id', sortable: true },
  { id: 'name', label: 'table.users.name', sortable: true },
  { id: 'surname', label: 'table.users.surname', sortable: true },
  { id: 'email', label: 'table.users.email', sortable: true },
  { id: 'phoneNumber', label: 'table.users.phone-number', sortable: false },
  { id: 'role', label: 'table.users.role', sortable: false },
  { id: 'status', label: 'table.users.status', sortable: false },
];
