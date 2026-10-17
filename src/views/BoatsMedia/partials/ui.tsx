import { ReactNode, useCallback, useState } from 'react';

import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import { bbCardSx, bbColors } from '@/styles/bb';

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export const SectionCard = ({ icon, title, subtitle, actions, children }: SectionCardProps) => (
  <Box component="section" sx={{ ...bbCardSx, p: { xs: 1.75, sm: 2.5 }, mb: 2 }}>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      gap={1}
      sx={{ mb: 1.75 }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
        <Box sx={{ color: bbColors.navy700, display: 'flex' }} aria-hidden>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={{ fontSize: 15, fontWeight: 800, color: bbColors.navy900 }}>
            {title}
          </Typography>
          {subtitle && <Typography sx={{ fontSize: 12, color: bbColors.gray500, mt: 0.25 }}>{subtitle}</Typography>}
        </Box>
      </Stack>
      {actions && (
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
    {children}
  </Box>
);

export interface ConfirmRequest {
  title: string;
  text: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
}

/** One confirm dialog per view: `ask({...})` opens it, the action runs after the click. */
export const useConfirm = () => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = useCallback(() => setRequest(null), []);

  const dialog = (
    <ModalRoot
      open={request !== null}
      onClose={close}
      title={request?.title}
      confirmBtnText={request?.confirmText}
      cancelBtnText="Cancel"
      onCancel={close}
      onConfirm={() => {
        const action = request?.onConfirm;

        close();
        action?.();
      }}
      width={480}
    >
      <Typography sx={{ fontSize: 13.5, color: bbColors.navy900, whiteSpace: 'pre-line' }}>{request?.text}</Typography>
    </ModalRoot>
  );

  return { ask: setRequest, dialog };
};

export const buttonSx = {
  textTransform: 'none',
  fontSize: 12.5,
  fontWeight: 700,
  borderRadius: '6px',
  boxShadow: 'none',
} as const;

export const primaryButtonSx = {
  ...buttonSx,
  backgroundColor: bbColors.yellow500,
  color: bbColors.yellowText,
  '&:hover': { backgroundColor: '#ffca2e', boxShadow: 'none' },
  '&.Mui-disabled': { backgroundColor: '#fce8a3', color: bbColors.yellowText },
} as const;

export const secondaryButtonSx = {
  ...buttonSx,
  color: bbColors.navy900,
  borderColor: bbColors.gray300,
  backgroundColor: bbColors.white,
  '&:hover': { borderColor: bbColors.navy700, backgroundColor: bbColors.gray75 },
} as const;

export const dangerButtonSx = {
  ...buttonSx,
  color: bbColors.red600,
  borderColor: '#f3c1b7',
  '&:hover': { borderColor: bbColors.red600, backgroundColor: bbColors.red100 },
} as const;

export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
}

/** Small read-only result table (image hygiene); scrolls sideways on a phone. */
export const ResultTable = <T,>({ columns, rows, empty }: { columns: Column<T>[]; rows: T[]; empty: string }) => {
  if (rows.length === 0) {
    return <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, py: 1 }}>{empty}</Typography>;
  }

  return (
    <Box sx={{ overflowX: 'auto', maxHeight: 360, border: `1px solid ${bbColors.gray200}`, borderRadius: '8px' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map(c => (
              <TableCell key={c.label} sx={{ fontSize: 11.5, fontWeight: 800, backgroundColor: bbColors.gray75 }}>
                {c.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            // eslint-disable-next-line react/no-array-index-key -- read-only rows, never reordered
            <TableRow key={i}>
              {columns.map(c => (
                <TableCell key={c.label} sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {c.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box sx={{ px: 1.25, py: 0.75, borderRadius: '8px', backgroundColor: bbColors.gray100, minWidth: 92 }}>
    <Typography sx={{ fontSize: 10.5, color: bbColors.gray500, fontWeight: 700, textTransform: 'uppercase' }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: 15, fontWeight: 800, color: bbColors.navy900 }}>{value}</Typography>
  </Box>
);
