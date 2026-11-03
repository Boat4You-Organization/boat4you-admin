/* "Recordings of this visit" in a conversation (P6 R2): shown only when the conversation's visit has a recording to play. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { linkSx } from '@/views/ContactCenter/common';

const RecordingsLink = ({ conversationId }: { conversationId: number }) => {
  const { t } = useTranslation('contactCenter');
  const [has, setHas] = useState(false);

  useEffect(() => {
    let current = true;

    setHas(false);
    ContactCenterService.recordings({ conversationId, from: dayjs().subtract(399, 'day').toISOString(), size: 1 })
      .then(({ data }) => current && setHas(data.length > 0))
      .catch(() => undefined);

    return () => {
      current = false;
    };
  }, [conversationId]);

  if (!has) return null;

  return (
    <Box
      component={RouterLink}
      to={`/contact-center/recording/list?conversationId=${conversationId}`}
      sx={{ ...linkSx, display: 'inline-block', fontSize: 12.5, mt: '6px' }}
    >
      {t('rec.conversationLink')}
    </Box>
  );
};

export default RecordingsLink;
