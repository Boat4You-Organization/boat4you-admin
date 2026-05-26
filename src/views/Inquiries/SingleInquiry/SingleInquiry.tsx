import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Button, Container, Grid, Stack, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { getSelectedInquiry, toggleChangeInquiryStatusModal } from '@/valtio/inquiries/inquiries.actions';
import { useInquiriesStore } from '@/valtio/inquiries/inquiries.store';
import StatusInquiryModal from '@/views/Inquiries/partials/StatusInquiryModal';

import styles from './SingleInquiry.module.scss';
import SingleInquiryInformation from './SingleInquiryInformation';
import SingleInquiryNavigation from './SingleInquiryNavigation';

const SingleInquiry = () => {
  const { t } = useTranslation();

  const { selectedInquiry, changeInquiryStatusModalOpen } = useInquiriesStore();

  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      return;
    }

    getSelectedInquiry(Number(id));
  }, [id]);

  if (!selectedInquiry) {
    return null;
  }

  const handleSendOffer = (): void => {
    const externalUrl = `${import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000'}/search?yid=${selectedInquiry.yachtId}&inquiryId=${selectedInquiry.id}`;

    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <StatusInquiryModal isSinglePage isOpen={changeInquiryStatusModalOpen} onClose={toggleChangeInquiryStatusModal} />
      <Layout>
        <Container disableGutters className={styles.container}>
          <Grid container spacing={2.5} alignItems="flex-start" className={styles.containerContent}>
            <Grid size={{ xs: 12, md: 8 }} className={styles.inquiriesContent}>
              <SingleInquiryInformation selectedInquiry={selectedInquiry} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} className={styles.inquiriesActions}>
              <Typography variant="h3" fontWeight={700} pb={3}>
                {t('inquiries.manage-inquiry')}
              </Typography>
              <Stack direction="column" spacing={2}>
                <Button fullWidth size="large" onClick={handleSendOffer}>
                  {t('inquiries.send-offer')}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                  onClick={toggleChangeInquiryStatusModal}
                >
                  {t('inquiries.change-status')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <SingleInquiryNavigation selectedInquiry={selectedInquiry} />
        </Container>
      </Layout>
    </>
  );
};

export default SingleInquiry;
