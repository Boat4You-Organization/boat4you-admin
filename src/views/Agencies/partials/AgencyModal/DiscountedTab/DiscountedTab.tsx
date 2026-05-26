import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, CircularProgress, Stack, Typography } from '@mui/material';

import Checkbox from '@/components/Checkbox';
import { AgencyModel, AgencyYachtModel } from '@/models/agencies.model';
import AgenciesService from '@/services/agencies.service';
import colors from '@/styles/themes/colors';

interface DiscountedTabProps {
  agency: AgencyModel;
}

const DiscountedTab = ({ agency }: DiscountedTabProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agenciesYachts, setAgenciesYachts] = useState<AgencyYachtModel[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (agency.id) {
      (async (): Promise<void> => {
        setIsLoading(true);

        const content = await AgenciesService.getYachtsAgency(agency.id);

        setAgenciesYachts(content);
        setIsLoading(false);
      })();
    }
  }, [agency.id]);

  return (
    <Stack direction="column" spacing={3}>
      <Typography variant="body1" color={colors.black950}>
        {t('common.discount-not-applicable')}
      </Typography>

      <Stack direction="column" spacing={1}>
        {isLoading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : (
          agenciesYachts.map(({ id, name, excludeDiscount }) => (
            <Box
              key={id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
              }}
            >
              <Checkbox checked={excludeDiscount || false} disabled />

              <Typography variant="body2" color={colors.black950} sx={{ userSelect: 'none' }}>
                {name} - {id}
              </Typography>
            </Box>
          ))
        )}
      </Stack>
    </Stack>
  );
};

export default DiscountedTab;
