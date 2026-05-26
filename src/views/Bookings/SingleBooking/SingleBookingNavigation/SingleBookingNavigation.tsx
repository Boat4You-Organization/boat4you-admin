import { useTranslation } from 'react-i18next';

import { Button, Container, Stack } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import ChevronUp from '@/components/SvgIcons/ChevronUp';
import useToggleState from '@/utils/hooks/useToggleState';
import {
  toggleCancelBookingModal,
  toggleConfirmBookingModal,
  toggleMarkAsPaidBookingModal,
  toggleSyncBookingModal,
} from '@/valtio/bookings/bookings.actions';

import styles from './SingleBookingNavigation.module.scss';

interface SingleBookingNavigationProps {
  isBookingEditable: boolean;
  isBookingCancellable: boolean;
  showConfirmBooking: boolean;
  showMarkAsPaid: boolean;
}

const SingleBookingNavigation = ({
  isBookingEditable: _isBookingEditable,
  isBookingCancellable,
  showConfirmBooking,
  showMarkAsPaid,
}: SingleBookingNavigationProps) => {
  const [isModalOpen, toggleModal] = useToggleState();
  const { t } = useTranslation();

  return (
    <>
      <Stack className={styles.container}>
        <Container disableGutters>
          <Button
            fullWidth
            color="secondary"
            size="large"
            endIcon={<ChevronUp />}
            sx={{ justifyContent: 'space-between' }}
            onClick={toggleModal}
          >
            {t('booking.manage-booking')}
          </Button>
        </Container>
      </Stack>
      <ModalRoot
        open={isModalOpen}
        onClose={toggleModal}
        title={t('booking.manage-booking')}
        confirmBtnText={t('booking.cancel-booking')}
        onConfirm={toggleCancelBookingModal}
        ConfirmBtnProps={{
          color: 'error',
          disabled: !isBookingCancellable,
        }}
      >
        <Stack direction="column" spacing={2}>
          <Button fullWidth size="large" onClick={toggleSyncBookingModal}>
            {t('booking.sync-booking')}
          </Button>
          {showConfirmBooking && (
            <Button color="secondary" fullWidth size="large" onClick={toggleConfirmBookingModal}>
              {t('booking.confirm-booking')}
            </Button>
          )}
          {showMarkAsPaid && (
            <Button color="secondary" fullWidth size="large" onClick={toggleMarkAsPaidBookingModal}>
              {t('booking.mark-as-paid')}
            </Button>
          )}
        </Stack>
      </ModalRoot>
    </>
  );
};

export default SingleBookingNavigation;
