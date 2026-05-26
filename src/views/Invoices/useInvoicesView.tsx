import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';
import { pdf } from '@react-pdf/renderer';

import Check from '@/components/SvgIcons/Check';
import Download from '@/components/SvgIcons/Download';
import Edit from '@/components/SvgIcons/Edit';
import { Locale } from '@/i18nPdf';
import colors from '@/styles/themes/colors';
import {
  clearSelectedInvoice,
  findInvoice,
  isInvoiceForDrafted,
  toggleMarkAsPaidInvoiceModal,
  toggleUpdateInvoiceModal,
} from '@/valtio/invoices/invoices.actions';
import { invoicesStore } from '@/valtio/invoices/invoices.store';

import InvoicePDF from './partials/InvoicePDF';

interface UseInvoicesViewPayload {
  selectInvoice: (event: React.MouseEvent<HTMLElement>) => void;
  closeInvoiceModal: () => void;
  renderRowActions: (index: number) => React.ReactElement | false;
}

const useInvoicesView = (): UseInvoicesViewPayload => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  const selectInvoice = (event: React.MouseEvent<HTMLElement>): void => {
    const {
      currentTarget: {
        dataset: { id },
      },
    } = event;

    if (!id) {
      return;
    }

    navigate(`/invoices/${id}?${searchParams.toString()}`);
  };

  const closeInvoiceModal = (): void => {
    clearSelectedInvoice();
    navigate(`/invoices?${searchParams.toString()}`);
  };

  const handleUpdateInvoice = async (e: React.MouseEvent<HTMLLIElement>): Promise<void> => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findInvoice(index);
    toggleUpdateInvoiceModal(true);
  };

  const handleDownloadInvoice = async (e: React.MouseEvent<HTMLLIElement>): Promise<void> => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    try {
      findInvoice(index);

      const invoice = invoicesStore.selectedInvoice;

      if (!invoice) {
        return;
      }

      const getLocale = (lang: string): Locale => {
        switch (lang) {
          case 'hr':
          case 'hr-HR':
            return 'hr';
          case 'en':
          case 'en-US':
          default:
            return 'en';
        }
      };

      const currentLocale = getLocale(i18n.language);

      const pdfDocument = <InvoicePDF invoice={invoice} locale={currentLocale} />;

      const blob = await pdf(pdfDocument).toBlob();

      const link = document.createElement('a');

      link.href = URL.createObjectURL(blob);
      link.download = `invoice-${invoice.invoiceNumber}-${currentLocale.toUpperCase()}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(link.href);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error downloading invoice:', error);
    }
  };

  const handleMarkAsPaidInvoice = async (e: React.MouseEvent<HTMLLIElement>): Promise<void> => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findInvoice(index);
    toggleMarkAsPaidInvoiceModal(true);
  };

  const renderRowActions = (index: number): React.ReactElement | false => (
    <MenuList disablePadding sx={{ gap: 0.5 }}>
      <MenuItem data-index={index} onClick={handleUpdateInvoice}>
        <ListItemIcon>
          <Edit size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.updateInvoice')}
        </Typography>
      </MenuItem>
      <MenuItem data-index={index} onClick={handleDownloadInvoice}>
        <ListItemIcon>
          <Download size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.download')}
        </Typography>
      </MenuItem>
      <MenuItem data-index={index} onClick={handleMarkAsPaidInvoice} disabled={!isInvoiceForDrafted(index)}>
        <ListItemIcon>
          <Check size={20} fill={colors.green500} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.markAsSent')}
        </Typography>
      </MenuItem>
    </MenuList>
  );

  return {
    selectInvoice,
    closeInvoiceModal,
    renderRowActions,
  };
};

export default useInvoicesView;
