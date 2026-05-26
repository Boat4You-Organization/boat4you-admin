import { Paper } from '@mui/material';
import Typography from '@mui/material/Typography';

interface EmptyStateProps {
  isOpen: boolean;
  message: string;
}

const EmptyState = ({ isOpen, message }: EmptyStateProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Paper variant="outlined">
      <Typography variant="body1" fontWeight={600} align="center">
        {message}
      </Typography>
    </Paper>
  );
};

export default EmptyState;
