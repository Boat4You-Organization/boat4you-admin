import { Document, Page, Text, View } from '@react-pdf/renderer';

import { Locale, i18n } from '@/i18nPdf';
import { InvoiceModel } from '@/models/invoices.model';
import DateTime from '@/utils/static/DateTime';

import {
  LogoSVG,
  formatMoney,
  renderFooter,
  renderItemsTable,
  renderMetaStrip,
  renderParty,
  renderPaymentBox,
  renderSummary,
} from './InvoicePDF.helpers';
import { styles } from './InvoicePDF.styles';

interface InvoicePDFProps {
  invoice: InvoiceModel;
  locale: Locale;
}

const ISSUER = {
  name: 'Cusmanich d.o.o.',
  street: 'Vrboran 37',
  city: 'HR-21000 Split',
  oib: '87394862517',
  iban: 'HR3924020061101202108',
  bank: 'Erste&Steiermarkische Bank d.d.',
  swift: 'ESBCHR22',
  issuedBy: 'Mario Kuzmanić',
  place: 'Split',
};

/**
 * Invoice PDF (redesigned 22.8.2026, Mario: "račun je previše bezvezan"):
 * navy header band, meta strip, issuer/recipient cards, a proper items
 * table, summary with base / VAT / total due, payment-details box with
 * IBAN + reference, issued-by line and the legal footer. Money renders in
 * the locale's format (1.234,56 for HR, 1,234.56 for EN) with EUR.
 */
const InvoicePDF = ({ invoice, locale }: InvoicePDFProps) => {
  const {
    invoiceNumber,
    invoiceDate,
    vatAmount,
    vatPercentage,
    includeVat,
    recipientName,
    recipientStreet,
    recipientCity,
    recipientZipCode,
    recipientCountry,
    totalPrice,
    recipientVatCode,
    priceWithoutVat,
    invoiceItem,
  } = invoice || {};

  const t = i18n[locale];
  const number = invoiceNumber?.toString() ?? '';
  const money = (value: unknown) => `${formatMoney(value, locale)} EUR`;
  const dateLabel = DateTime.formatHR(DateTime.date(invoiceDate));
  const vatPct = Number(vatPercentage) || 0;
  const hasVat = Boolean(includeVat) && vatPct > 0;
  const vatPctLabel = Number.isInteger(vatPct) ? String(vatPct) : formatMoney(vatPct, locale);

  // Recipient address lines: data entry sometimes packs zip+city into the
  // street field, so don't repeat the city when it's already there.
  const street = recipientStreet ?? '';
  const zipCity = [recipientZipCode, recipientCity].filter(Boolean).join(' ');
  const cityRepeated = Boolean(recipientCity) && street.includes(recipientCity ?? '');
  const recipientLines = [street, cityRepeated ? '' : zipCity, String(recipientCountry ?? '')];
  const referenceNumber = number.replace(/[^0-9]/g, '') || number;

  return (
    <Document title={`${t.invoiceTitle} ${number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          <View>
            <LogoSVG />
            <View style={styles.bandCompany}>
              <Text style={styles.bandCompanyName}>{ISSUER.name}</Text>
              <Text style={styles.bandCompanyLine}>
                {ISSUER.street}, {ISSUER.city}
              </Text>
              <Text style={styles.bandCompanyLine}>
                {t.vatId}: {ISSUER.oib}
              </Text>
            </View>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.invoiceTitle}>{t.invoiceTitle}</Text>
            <Text style={styles.invoiceNumber}>
              {t.invoiceNumberLabel} {number}
            </Text>
          </View>
        </View>
        <View style={styles.accent} />

        <View style={styles.body}>
          {renderMetaStrip([
            { label: t.issueDate, value: dateLabel },
            { label: t.issuePlace, value: ISSUER.place },
            { label: t.deliveryDate, value: dateLabel },
            { label: t.paymentMethod, value: t.bankTransfer },
          ])}

          <View style={styles.parties}>
            {renderParty({
              label: t.issuer,
              name: ISSUER.name,
              lines: [ISSUER.street, ISSUER.city, `${t.iban}: ${ISSUER.iban}`],
              vatLabel: t.vatId,
              vatId: ISSUER.oib,
            })}
            {renderParty({
              label: t.recipient,
              name: recipientName ?? '',
              lines: recipientLines,
              vatLabel: t.vatId,
              vatId: recipientVatCode,
            })}
          </View>

          {renderItemsTable({
            headers: {
              no: t.colNo,
              description: t.colDescription,
              qty: t.colQty,
              unitPrice: t.colUnitPrice,
              amount: t.colAmount,
            },
            description: invoiceItem ?? '',
            unitPrice: money(priceWithoutVat),
            amount: money(priceWithoutVat),
          })}

          {renderSummary({
            baseLabel: t.base,
            base: money(priceWithoutVat),
            vatLabel: hasVat ? `${t.vat} ${vatPctLabel} %` : null,
            vat: hasVat ? money(vatAmount) : null,
            noVatNote: null,
            totalLabel: t.totalDue,
            total: money(totalPrice),
          })}

          {/* Statutory reverse-charge clause — REQUIRED verbatim on every
              invoice issued without VAT (foreign recipients; Mario
              28.8.2026). Full-width so the long citation stays readable. */}
          {!hasVat && <Text style={styles.vatExemptClause}>{t.noVat}</Text>}

          {renderPaymentBox({
            title: t.paymentDetails,
            cells: [
              { label: t.bank, value: ISSUER.bank },
              { label: t.iban, value: ISSUER.iban },
              { label: t.swift, value: ISSUER.swift },
              { label: t.model, value: 'HR00' },
              { label: t.reference, value: referenceNumber },
              { label: t.paymentDescription, value: `${t.paymentDescriptionValue} ${number}` },
            ],
          })}

          <View style={styles.signatureRow}>
            <View>
              <Text style={styles.issuedBy}>{t.issuedBy}</Text>
              <Text style={styles.issuedByName}>{ISSUER.issuedBy}</Text>
            </View>
            <Text style={styles.computerNote}>{t.computerNote}</Text>
          </View>
        </View>

        {renderFooter({ text: t.footerText })}
      </Page>
    </Document>
  );
};

export default InvoicePDF;
