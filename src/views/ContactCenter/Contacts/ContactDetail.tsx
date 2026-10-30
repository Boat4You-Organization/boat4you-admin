/* The contact page: the client card at full width (its conversations link to /contact-center/c/:id). */
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Box } from '@mui/material';

import ClientCard from '@/views/ContactCenter/Conversations/ClientCard';
import { cc } from '@/views/ContactCenter/ui';

const ContactDetail = ({ id }: { id: number }) => {
  const { t } = useTranslation('contactCenter');

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Box
        component={RouterLink}
        to="/contact-center/contacts"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 36,
          fontSize: 13.5,
          fontWeight: 600,
          textDecoration: 'none',
          color: cc.ink,
        }}
      >
        ← {t('tab.contacts')}
      </Box>
      <ClientCard key={id} contactId={id} layout="page" />
    </Box>
  );
};

export default ContactDetail;
