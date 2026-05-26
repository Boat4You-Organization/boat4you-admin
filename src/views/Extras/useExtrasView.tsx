import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { clearSelectedExtras } from '@/valtio/extras/extras.actions';

interface UseExtrasViewPayload {
  selectExtras: (event: React.MouseEvent<HTMLElement>) => void;
  closeExtrasModal: () => void;
}

const useExtrasView = (): UseExtrasViewPayload => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectExtras = (event: React.MouseEvent<HTMLElement>): void => {
    const {
      currentTarget: {
        dataset: { id },
      },
    } = event;

    if (!id) {
      return;
    }

    navigate(`/extras/${id}?${searchParams.toString()}`);
  };

  const closeExtrasModal = (): void => {
    clearSelectedExtras();
    navigate(`/extras?${searchParams.toString()}`);
  };

  return {
    selectExtras,
    closeExtrasModal,
  };
};

export default useExtrasView;
