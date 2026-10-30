/* The contact page: the client card at full width (its conversations link to /contact-center/c/:id). */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Box, Button } from '@mui/material';

import { bbColors } from '@/styles/bb';
import ClientCard from '@/views/ContactCenter/Conversations/ClientCard';

const ContactDetail = ({ id }: { id: number }) => {
  const { t } = useTranslation('contactCenter');
  const navigate = useNavigate();

  return (
    <Box>
      <Button size="small" onClick={() => navigate('/contact-center/contacts')} sx={{ mb: 1 }}>
        ← {t('tab.contacts')}
      </Button>
      <Box sx={{ bgcolor: '#fff', border: `1px solid ${bbColors.gray100}`, borderRadius: 2, p: 2, maxWidth: 900 }}>
        <ClientCard key={id} contactId={id} />
      </Box>
    </Box>
  );
};

export default ContactDetail;
