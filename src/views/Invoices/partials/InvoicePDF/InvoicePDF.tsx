import { Document, Page } from '@react-pdf/renderer';

import { Locale, i18n } from '@/i18nPdf';
import { InvoiceLanguage, InvoiceModel } from '@/models/invoices.model';
import DateTime from '@/utils/static/DateTime';

import {
  renderBuyerSection,
  renderFooter,
  renderHeader,
  renderInvoiceTitle,
  renderPaymentSection,
  renderServicesTable,
  renderSummary,
} from './InvoicePDF.helpers';
import { styles } from './InvoicePDF.styles';

interface InvoicePDFProps {
  invoice: InvoiceModel;
  locale: Locale;
}

const InvoicePDF = ({ invoice, locale }: InvoicePDFProps) => {
  const {
    invoiceNumber,
    invoiceDate,
    vatAmount,
    recipientName,
    recipientStreet,
    totalPrice,
    recipientVatCode,
    priceWithoutVat,
    invoiceLanguage,
    invoiceItem,
  } = invoice || {};

  const t = i18n[locale];
  // API money fields arrive as numbers, but a freshly edited invoice can hold
  // strings/nulls for a moment — coerce so a stray value can't kill the PDF.
  const money = (value: unknown) => (Number(value) || 0).toFixed(2);
  const invoiceNumberLabel = invoiceNumber?.toString() ?? '';

  return (
    <Document title={invoiceNumberLabel}>
      <Page size="A4" style={styles.page}>
        {renderHeader({
          companyName: 'Cusmanich d.o.o.',
          companyAddress: 'Vrboran 37, HR-21000 Split',
          companyOib: '87394862517',
          companyIban: 'HR3924020061101202108',
          invoiceNumber: invoiceNumberLabel,
          invoiceDate: DateTime.formatHR(DateTime.date(invoiceDate)),
          invoiceLabel: t.invoice,
          invoiceDateLabel: t.date,
        })}
        {renderBuyerSection({
          title: t.customer,
          name: recipientName,
          address: recipientStreet,
          oib: recipientVatCode,
        })}
        {renderInvoiceTitle({ title: t.invoice, invoiceNumber: invoiceNumberLabel })}
        {renderServicesTable({
          descriptionLabel: t.description,
          invoiceItem,
        })}
        {renderSummary({
          inTotalLabel: t.inTotal,
          inTotalPrice: money(priceWithoutVat),
          taxLabel: t.tax,
          taxValue: money(vatAmount),
          totalLabel: t.total,
          totalPrice: money(totalPrice),
          currency: invoiceLanguage === InvoiceLanguage.EN ? 'Euro' : 'Eur',
        })}
        {renderPaymentSection({
          paymentMethodLabel: t.paymentMethod,
          paymentMethod: t.bankTransfer,
          deliveryDateLabel: t.deliveryDate,
          deliveryDate: DateTime.formatHR(DateTime.date(invoiceDate)),
        })}
        {renderFooter({
          text: t.footerText,
        })}
      </Page>
    </Document>
  );
};

export default InvoicePDF;
