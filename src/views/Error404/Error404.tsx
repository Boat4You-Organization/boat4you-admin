import { useTranslation } from 'react-i18next';

import { Container, Paper, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';

import Layout from '@/components/Layout';
import colors from '@/styles/themes/colors';

const Error404 = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <Container component="section" disableGutters sx={{ height: '100%', paddingBottom: 3 }}>
        <Paper elevation={0} sx={{ height: '100%' }}>
          <Stack alignItems="center" justifyContent="center" height="100%" gap={3}>
            <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500}>
              {t('common.not-found')}
            </Typography>
            <Typography
              variant="body1"
              align="center"
              color={colors.black500}
              dangerouslySetInnerHTML={{
                __html: t('common.not-found-description'),
              }}
            />
          </Stack>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Error404;
