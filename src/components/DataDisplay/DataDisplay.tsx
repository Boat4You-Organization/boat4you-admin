import { Box, Stack, Theme, useMediaQuery } from '@mui/material';

import DataCard, { DataCardProps } from '@/components/DataCard';
import Table, { TableProps } from '@/components/Table';

import styles from './DataDisplay.module.scss';

interface DataDisplayProps extends TableProps {
  cardData?: Array<{
    id: string;
    title: string;
    description?: string;
    avatar?: React.ReactNode;
    items?: DataCardProps['items'];
    chipLabel?: DataCardProps['chipLabel'];
    chipColor?: DataCardProps['chipColor'];
    date?: string;
  }>;
  onCardClick?: DataCardProps['onCardClick'];
}

const DataDisplay = ({
  columns,
  rows,
  rowActions,
  onRowClick,
  showSkeleton,
  sortDirection,
  sortBy,
  onSort,
  noResultsMessage,
  groupBy,
  cardData,
  onCardClick,
}: DataDisplayProps) => {
  const customBreakpoint = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  if (customBreakpoint && cardData) {
    return (
      <Stack spacing={2} className={styles.dataMobile}>
        {cardData.map((card, index) => (
          <Box key={card.id}>
            <DataCard
              chipLabel={card.chipLabel}
              chipColor={card.chipColor}
              avatar={card.avatar}
              title={card.title}
              items={card.items}
              dataId={card.id}
              date={card.date}
              description={card.description}
              onCardClick={onCardClick}
              showSkeleton={showSkeleton}
              rowActions={rowActions}
              rowIndex={index}
            />
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Stack className={styles.dataDesktop}>
      <Table
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={onSort}
        onRowClick={onRowClick}
        rowActions={rowActions}
        showSkeleton={showSkeleton}
        columns={columns}
        rows={rows}
        noResultsMessage={noResultsMessage}
        groupBy={groupBy}
      />
    </Stack>
  );
};

export default DataDisplay;
