import { Box } from '@mui/material';

import styles from './FlagIcon.module.scss';

const FlagIcon = ({ countryCode }: { countryCode: string }) => (
  <Box className={styles.countryWrapper}>
    <img
      loading="lazy"
      sizes="auto"
      src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
      alt={`${countryCode} flag`}
      className={styles.country}
    />
  </Box>
);

export default FlagIcon;
