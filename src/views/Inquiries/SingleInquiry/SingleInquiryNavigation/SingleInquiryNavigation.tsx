import { useTranslation } from 'react-i18next';

import { Button, Container, Stack } from '@mui/material';

import { InquiriesModel } from '@/models/inquiries.model';
import { toggleChangeInquiryStatusModal } from '@/valtio/inquiries/inquiries.actions';

import styles from './SingleInquiryNavigation.module.scss';

interface SingleInquiryNavigationProps {
  selectedInquiry: InquiriesModel;
}

const SingleInquiryNavigation = ({ selectedInquiry }: SingleInquiryNavigationProps) => {
  const { t } = useTranslation();

  const handleSendOffer = (): void => {
    const externalUrl = `${import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000'}/search?inquiryId=${selectedInquiry.id}`;

    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Stack className={styles.container}>
      <Container disableGutters>
        <Stack direction="column" spacing={2}>
          <Button fullWidth size="large" onClick={handleSendOffer}>
            {t('inquiries.send-offer')}
          </Button>
          <Button variant="contained" color="secondary" fullWidth size="large" onClick={toggleChangeInquiryStatusModal}>
            {t('inquiries.change-status')}
          </Button>
        </Stack>
      </Container>
    </Stack>
  );
};

export default SingleInquiryNavigation;
