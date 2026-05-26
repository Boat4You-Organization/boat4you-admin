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

  return (
    <Document title={invoiceNumber.toString()}>
      <Page size="A4" style={styles.page}>
        {renderHeader({
          companyName: 'Cusmanich d.o.o.',
          companyAddress: 'Vrboran 37, HR-21000 Split',
          companyOib: '87394862517',
          companyIban: 'HR3924020061101202108',
          invoiceNumber,
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
        {renderInvoiceTitle({ title: t.invoice, invoiceNumber })}
        {renderServicesTable({
          descriptionLabel: t.description,
          invoiceItem,
        })}
        {renderSummary({
          inTotalLabel: t.inTotal,
          inTotalPrice: `${priceWithoutVat.toFixed(2)}`,
          taxLabel: t.tax,
          taxValue: `${vatAmount.toFixed(2)}`,
          totalLabel: t.total,
          totalPrice: `${totalPrice.toFixed(2)}`,
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
