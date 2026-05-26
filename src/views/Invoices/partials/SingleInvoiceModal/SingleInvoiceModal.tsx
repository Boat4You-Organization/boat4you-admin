import { useTranslation } from 'react-i18next';

import { Box, Divider, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import GridDisplay from '@/components/GridDisplay';
import ModalRoot from '@/components/ModalRoot';
import Boat from '@/components/SvgIcons/Boat';
import { People } from '@/components/SvgIcons/BoatFeatures';
import Money from '@/components/SvgIcons/Payment/Money';
import WideSelection from '@/components/SvgIcons/WhyChooseUs/WideSelection';
import { INVOICE_LANGUAGE_LABEL_MAP, RECIPIENT_TYPE_LABEL_MAP } from '@/models/invoices.model';
import colors from '@/styles/themes/colors';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';
import { useInvoicesStore } from '@/valtio/invoices/invoices.store';
import InvoicePDF from '@/views/Invoices/partials/InvoicePDF/InvoicePDF';
import PDFDownloadButton from '@/views/Invoices/partials/PDFDownloadButton';

interface SingleInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SingleInvoiceModal = ({ isOpen, onClose, onConfirm }: SingleInvoiceModalProps) => {
  const { isMobile } = useBreakpoint();
  const { selectedInvoice } = useInvoicesStore();
  const { t } = useTranslation();

  if (!selectedInvoice) {
    return null;
  }

  const {
    id,
    reservationNumber,
    invoiceNumber,
    invoiceDate,
    invoiceLanguage,
    includeVat,
    vatAmount,
    vatPercentage,
    priceWithoutVat,
    recipientType,
    recipientName,
    recipientCity,
    recipientStreet,
    recipientZipCode,
    recipientCountry,
    totalPrice,
    clientEmail,
    clientName,
    clientPhoneNumber,
    recipientVatCode,
    invoiceItem,
  } = selectedInvoice;

  const invoiceItems = [
    { label: 'invoices.invoice-details.invoice-number', value: invoiceNumber || id.toString() },
    { label: 'invoices.invoice-details.invoice-date', value: DateTime.formatHR(dayjs(invoiceDate)) },
    { label: 'invoices.invoice-details.invoice-language', value: t(INVOICE_LANGUAGE_LABEL_MAP[invoiceLanguage]) },
    ...(includeVat ? [{ label: 'invoices.invoice-details.invoice-vat', value: `${vatPercentage}%` }] : []),
  ];

  const recipientItems = [
    { label: 'invoices.recipient-details.recipient-type', value: t(RECIPIENT_TYPE_LABEL_MAP[recipientType]) },
    { label: 'invoices.recipient-details.recipient-name', value: recipientName },
    {
      label: 'invoices.recipient-details.recipient-city',
      value: recipientCity,
    },
    { label: 'invoices.recipient-details.recipient-street', value: recipientStreet },
    { label: 'invoices.recipient-details.recipient-country', value: recipientCountry },
    { label: 'invoices.recipient-details.recipient-zip', value: recipientZipCode },
    { label: 'invoices.recipient-details.recipient-vat-code', value: recipientVatCode },
  ];

  const bookingItems = [
    { label: 'invoices.booking-details.booking-number', value: reservationNumber },
    { label: 'invoices.booking-details.client-name', value: clientName },
    { label: 'invoices.booking-details.client-email', value: clientEmail },
    { label: 'invoices.booking-details.client-phone', value: clientPhoneNumber },
    { label: 'invoices.booking-details.invoice-item', value: invoiceItem },
  ];

  const renderTitleActions = () => (
    <PDFDownloadButton
      documents={{
        hr: <InvoicePDF invoice={selectedInvoice} locale="hr" />,
        en: <InvoicePDF invoice={selectedInvoice} locale="en" />,
      }}
      fileName={selectedInvoice.invoiceNumber.toString()}
    />
  );

  // const renderPDFPreview = () => (
  //   <PDFViewer style={{ width: '100%', height: '100vh' }}>
  //     <InvoicePDF invoice={selectedInvoice} locale="hr" />
  //   </PDFViewer>
  // );

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={onClose}
      title={`${t('common.invoice')} #${invoiceNumber || id.toString()}`}
      titleActions={renderTitleActions()}
      cancelBtnText={t('actions.cancel')}
      onCancel={onClose}
      confirmBtnText={t('actions.edit')}
      onConfirm={onConfirm}
    >
      <Stack sx={{ width: { xs: 'auto', md: 670 } }}>
        {/* {renderPDFPreview()} */}
        <Box>
          <Stack direction="row" alignItems="center" gap={1} pb={3}>
            <WideSelection size={32} />
            <Typography variant="h3" fontWeight={700}>
              {t('invoices.invoice-details.title')}
            </Typography>
          </Stack>
          <GridDisplay columns={2} items={invoiceItems} />
        </Box>
        <Divider
          sx={{
            '&.MuiDivider-root': {
              my: 3,
            },
          }}
        />
        <Box>
          <Stack direction="row" alignItems="center" gap={1} pb={3}>
            <People size={32} variant="secondary" />
            <Typography variant="h3" fontWeight={700}>
              {t('invoices.recipient-details.title')}
            </Typography>
          </Stack>
          <GridDisplay columns={2} items={recipientItems} />
        </Box>
        <Divider
          sx={{
            '&.MuiDivider-root': {
              my: 3,
            },
          }}
        />
        <Box>
          <Stack direction="row" alignItems="center" gap={1} pb={3}>
            <Boat size={32} variant="secondary" />
            <Typography variant="h3" fontWeight={700}>
              {t('invoices.booking-details.title')}
            </Typography>
          </Stack>
          <GridDisplay columns={2} items={bookingItems} />
        </Box>
        <Divider
          sx={{
            '&.MuiDivider-root': {
              my: 3,
            },
          }}
        />
        <Box>
          <Stack direction="row" alignItems="center" gap={1} pb={3}>
            <Money size={32} variant="secondary" />
            <Typography variant="h3" fontWeight={700}>
              {t('invoices.pricing-details.title')}
            </Typography>
          </Stack>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body1" fontWeight={700}>
                {t('invoices.pricing-details.price-without-vat')}
              </Typography>
              <Typography variant="body1" fontWeight={700} color={colors.blue500} display="flex" alignItems="center">
                {`${formatPrice(priceWithoutVat || 0)} €`}
              </Typography>
            </Stack>
            {includeVat && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight={700}>
                  {t('invoices.invoice-details.invoice-vat')} {`(${vatPercentage}%)`}
                </Typography>
                <Typography variant="body1">{`${formatPrice(vatAmount || 0)} €`}</Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body1" fontWeight={700}>
                {t('booking.total')}
              </Typography>
              <Typography variant="body1" fontWeight={700} color={colors.blue500} display="flex" alignItems="center">
                {`${formatPrice(totalPrice || 0)} €`}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </ModalRoot>
  );
};

export default SingleInvoiceModal;
