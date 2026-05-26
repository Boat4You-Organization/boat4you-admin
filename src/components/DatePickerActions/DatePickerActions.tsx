import { useTranslation } from 'react-i18next';

import { Button, DialogActions } from '@mui/material';
import { usePickerActionsContext } from '@mui/x-date-pickers';
import { PickersActionBarProps } from '@mui/x-date-pickers/PickersActionBar';

const DatePickerActions: React.FC<PickersActionBarProps> = ({ actions, className }) => {
  const { t } = useTranslation('common');
  const { acceptValueChanges, cancelValueChanges, clearValue } = usePickerActionsContext();

  return (
    <DialogActions className={className}>
      {actions?.includes('clear') && (
        <Button variant="text" onClick={clearValue}>
          {t('clear')}
        </Button>
      )}
      {actions?.includes('cancel') && (
        <Button variant="outlined" onClick={acceptValueChanges}>
          {t('cancel')}
        </Button>
      )}
      {actions?.includes('accept') && <Button onClick={cancelValueChanges}>OK</Button>}
    </DialogActions>
  );
};

export default DatePickerActions;
