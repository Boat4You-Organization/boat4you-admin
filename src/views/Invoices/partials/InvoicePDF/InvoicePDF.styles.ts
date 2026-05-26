import { Font, StyleSheet } from '@react-pdf/renderer';

import colors from '@/styles/themes/colors';

Font.register({
  family: 'Inter',
  fonts: [{ src: '/fonts/Inter/Inter-Regular.ttf' }, { src: '/fonts/Inter/Inter-SemiBold.ttf', fontWeight: 600 }],
});

Font.register({
  family: 'Raleway',
  fonts: [
    { src: '/fonts/Raleway/Raleway-Regular.ttf' },
    { src: '/fonts/Raleway/Raleway-SemiBold.ttf', fontWeight: 600 },
  ],
});

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Raleway',
    padding: '24px 16px',
    backgroundColor: colors.white,
    fontSize: 10,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  companyInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  companyText: {
    fontSize: 10,
    fontWeight: 400,
    color: colors.black950,
  },
  invoiceBox: {
    border: `1px solid ${colors.black200}`,
    backgroundColor: colors.white,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  invoiceRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minWidth: 200,
  },
  invoiceLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.black950,
  },
  invoiceValue: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 700,
    color: colors.black950,
  },
  lineDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.black200,
    marginVertical: 16,
  },
  doubleDivider: {
    width: '100%',
    marginVertical: 16,
  },
  lineDividerThin: {
    width: '100%',
    height: 1,
    backgroundColor: colors.black200,
    marginVertical: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.black950,
    marginBottom: 8,
  },
  invoiceTitleSection: {
    textAlign: 'center',
    marginVertical: 24,
  },
  invoiceTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 700,
    color: colors.black950,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 16,
    borderBottom: `1px solid ${colors.black200}`,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: `1px solid ${colors.black200}`,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.black950,
    paddingVertical: 8,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  tableCell: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.black950,
    paddingVertical: 8,
  },
  summarySection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  summaryRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 140,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.black950,
  },
  summaryValue: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: 500,
    color: colors.black950,
    textAlign: 'right',
  },
  paymentSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 98,
    gap: 24,
  },
  paymentRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.black950,
  },
  paymentText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: 500,
    color: colors.black950,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    textAlign: 'center',
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 7,
    fontWeight: 400,
    color: colors.black950,
    lineHeight: 1.4,
  },
});
