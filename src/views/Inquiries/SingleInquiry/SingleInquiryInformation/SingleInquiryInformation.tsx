import { useTranslation } from 'react-i18next';

import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import FlagIcon from '@/components/FlagIcon';
import { InquiriesModel } from '@/models/inquiries.model';
import colors from '@/styles/themes/colors';
import DateTime from '@/utils/static/DateTime';

import styles from './SingleInquiryInformation.module.scss';
import SingleInquiryInformationItem from './SingleInquiryInformationItem';

interface SingleInquiryInformationProps {
  selectedInquiry: InquiriesModel;
}

const SingleInquiryInformation = ({ selectedInquiry }: SingleInquiryInformationProps) => {
  const { t } = useTranslation();
  const {
    mainImage,
    modelName,
    countryCode,
    location,
    yachtName,
    dateFrom,
    dateTo,
    name,
    surname,
    email,
    phone,
    message,
  } = selectedInquiry;

  const hasValidDates = dateFrom && dateTo && dayjs(dateFrom).isValid() && dayjs(dateTo).isValid();
  const dateValue = hasValidDates
    ? `${DateTime.formatLong(dayjs(dateFrom))} - ${DateTime.formatLong(dayjs(dateTo))} (${DateTime.daysBetween(dayjs(dateFrom), dayjs(dateTo))} ${DateTime.daysBetween(dayjs(dateFrom), dayjs(dateTo)) > 1 ? 'days' : 'day'})`
    : t('inquiries.dates-not-specified');

  return (
    <Stack className={styles.container}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box className={styles.boatImage}>
          <img
            loading="lazy"
            sizes="auto"
            src={`${import.meta.env.VITE_BOAT_API_URL}/public/image/${mainImage}`}
            alt={`${yachtName} banner`}
            className={styles.image}
          />
        </Box>
        <Stack direction="column" spacing={1} justifyContent="space-between">
          <Stack>
            <Stack direction="row" spacing={1.5}>
              <Typography component="p" variant="h3" fontWeight={700}>
                {modelName} | {yachtName}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FlagIcon countryCode={countryCode} />
              <Typography variant="body1">{location}</Typography>
            </Stack>
          </Stack>
          <SingleInquiryInformationItem label={t('inquiries.dates')} value={dateValue} />
        </Stack>
      </Stack>
      <Divider sx={{ borderColor: colors.black200, paddingBlock: 1 }} />
      <Stack direction="column">
        <Typography component="p" variant="h3" fontWeight={700} pb={3}>
          {t('inquiries.user-info')}
        </Typography>
        <Grid container spacing={3}>
          {name && surname && (
            <Grid size={{ xs: 12, md: 4 }}>
              <SingleInquiryInformationItem label={t('inquiries.full-name')} value={`${name} ${surname}`} />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 4 }}>
            <SingleInquiryInformationItem label={t('inquiries.email')} value={email} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SingleInquiryInformationItem label={t('inquiries.phone')} value={phone} />
          </Grid>
          <Grid size={12}>
            <SingleInquiryInformationItem label={t('inquiries.message')} value={message} />
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  );
};

export default SingleInquiryInformation;
