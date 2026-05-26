import React, { useState } from 'react';

type UseToggleStatePayload = [boolean, () => void];

const useToggleState = (): UseToggleStatePayload => {
  const [value, setValue] = useState<boolean>(false);

  const toggleValue = React.useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggleValue];
};

export default useToggleState;
