import i18n from '@/i18n/i18n';

export const formatNumber = (num: number) => num.toLocaleString();

export const formatPrice = (num: number): string => {
  const locale = i18n.language || 'hr';

  return num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
