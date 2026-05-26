import { ElementType, ReactNode, isValidElement } from 'react';

import { Stack, Typography } from '@mui/material';

import colors from '@/styles/themes/colors';

interface SingleInquiryInformationItemProps {
  icon?: ElementType;
  label?: string;
  value: string | ReactNode;
}

const SingleInquiryInformationItem = ({ icon: Icon, label, value }: SingleInquiryInformationItemProps) => (
  <Stack direction="column">
    {label && (
      <Typography component="p" variant="h4" fontWeight={700}>
        {label}
      </Typography>
    )}
    <Stack direction="row" alignItems="center" spacing={1}>
      {Icon && <Icon fill={colors.black400} size={24} />}
      {isValidElement(value) ? value : <Typography variant="body1">{value}</Typography>}
    </Stack>
  </Stack>
);

export default SingleInquiryInformationItem;
