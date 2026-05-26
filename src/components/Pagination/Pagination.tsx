import React from 'react';

import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { PaginationItem, Stack } from '@mui/material';
import MuiPagination from '@mui/material/Pagination';

import useBreakpoint from '@/utils/hooks/useBreakpoint';

interface PaginationProps {
  page: number;
  onChange: (page: number) => void;
  count: number;
}

const Pagination = ({ page, onChange, count }: PaginationProps) => {
  const { isMobile } = useBreakpoint();
  const handlePageChange = (event: React.ChangeEvent<unknown>, selectedPage: number) => {
    onChange(selectedPage);
  };

  return (
    <Stack direction="row" width="100%" justifyContent={{ xs: 'center', md: 'flex-start' }}>
      <MuiPagination
        shape="rounded"
        count={count}
        onChange={handlePageChange}
        page={page}
        siblingCount={isMobile ? 0 : 1}
        renderItem={item => (
          <PaginationItem
            {...item}
            size="large"
            slots={{
              previous: ChevronLeft,
              next: ChevronRight,
            }}
          />
        )}
      />
    </Stack>
  );
};

export default Pagination;
