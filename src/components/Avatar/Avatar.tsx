import { Avatar as MuiAvatar, SxProps } from '@mui/material';

import colors from '@/styles/themes/colors';

const stringAvatar = (name: string) => ({
  children: name
    .split(' ')
    .map(word => word[0])
    .join(''),
});

interface AvatarProps {
  name: string;
  sx?: SxProps;
}

const Avatar = ({ name }: AvatarProps) => (
  <MuiAvatar {...stringAvatar(`${name}`)} sx={{ backgroundColor: colors.blue100, color: colors.blue400 }} />
);

export default Avatar;
