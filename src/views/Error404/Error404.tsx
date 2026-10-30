import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { ErrorCard } from '@/components/Desk';
import Layout from '@/components/Layout';
import { bbColors } from '@/styles/bb';

const Error404 = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <ErrorCard code="404" tone="info" illustration="sailboat" title={t('common.not-found')}>
        <Typography
          align="center"
          sx={{ fontSize: 13.5, color: bbColors.gray600, maxWidth: 440, lineHeight: 1.55 }}
          dangerouslySetInnerHTML={{
            __html: t('common.not-found-description'),
          }}
        />
      </ErrorCard>
    </Layout>
  );
};

export default Error404;
