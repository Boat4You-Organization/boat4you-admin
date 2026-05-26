import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Table as MuiTable,
  Skeleton,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import cx from 'clsx';

import EmptyState from '@/components/EmptyState';
import MeatballsMenu from '@/components/MeatballsMenu';
import { SortDirection } from '@/config/constants.config';
import { TableColumn } from '@/config/table-columns.config';
import colors from '@/styles/themes/colors';

import styles from './Table.module.scss';

export interface TableProps {
  columns: TableColumn[];
  rows: ({ key: string; isSystemUser?: boolean } & Record<string, React.ReactNode>)[];
  rowActions?: (itemIndex: number) => React.ReactNode;
  onRowClick?: React.MouseEventHandler<HTMLElement>;
  showSkeleton?: boolean;
  sortDirection?: SortDirection;
  sortBy?: string;
  onSort?: (sortBy: string, sortDirection: SortDirection) => void;
  noResultsMessage?: string;
  groupBy?: string;
}

const Table = ({
  columns,
  rows,
  rowActions,
  onRowClick,
  showSkeleton,
  sortDirection,
  sortBy,
  onSort,
  noResultsMessage = 'common.no-records',
  groupBy,
}: TableProps) => {
  const { t } = useTranslation();

  const noResults = !rows.length && !showSkeleton;

  const handleSort = (id: string) => {
    if (!onSort) {
      return;
    }

    const isAsc = sortBy === id && sortDirection === 'asc';
    const direction = isAsc ? 'desc' : 'asc';

    onSort(id, direction);
  };

  return (
    <Box position="relative">
      <TableContainer className={styles.container}>
        <MuiTable>
          <TableHead>
            <TableRow>
              {columns.map(({ id, label, sortable }) => (
                <TableCell key={id} sortDirection={sortBy === id ? sortDirection : false}>
                  {sortable && sortDirection ? (
                    <TableSortLabel
                      active={sortBy === id}
                      direction={sortBy === id ? sortDirection : 'asc'}
                      onClick={() => handleSort(id)}
                    >
                      <Typography variant="body1" color={colors.black500}>
                        {t(label)}
                      </Typography>
                    </TableSortLabel>
                  ) : (
                    <Typography variant="body1" color={colors.black500}>
                      {t(label)}
                    </Typography>
                  )}
                </TableCell>
              ))}
              {rowActions && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody className={cx({ [styles.noResults]: noResults })}>
            {rows.map((row, rowIndex) => {
              const isNewGroup = groupBy && (rowIndex === 0 || row[groupBy] !== rows[rowIndex - 1][groupBy]);

              return (
                <React.Fragment key={row.key}>
                  {isNewGroup && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className={styles.group}>
                        <Typography variant="body1">{row[groupBy]}</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow data-id={row.key} onClick={onRowClick} className={cx({ [styles.clickable]: onRowClick })}>
                    {columns.map(column => {
                      const content = row[column.id];
                      const cell =
                        typeof content === 'string' ? <Typography variant="body1">{content}</Typography> : content;

                      return (
                        <TableCell key={column.id}>
                          {showSkeleton ? <Skeleton variant="text">{cell}</Skeleton> : cell}
                        </TableCell>
                      );
                    })}
                    {rowActions && (
                      <TableCell align="right">
                        <MeatballsMenu>
                          {typeof rowActions === 'function' ? rowActions(rowIndex) : rowActions}
                        </MeatballsMenu>
                      </TableCell>
                    )}
                  </TableRow>
                </React.Fragment>
              );
            })}
            {noResults && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  sx={{
                    '&.MuiTableCell-root': {
                      paddingInline: 0,
                    },
                  }}
                >
                  <EmptyState isOpen message={t(noResultsMessage)} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </Box>
  );
};

export default Table;
