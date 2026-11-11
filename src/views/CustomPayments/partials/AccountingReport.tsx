import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';
import { saveAs } from 'file-saver';

import CardPaymentsService from '@/services/card-payments.service';
import { bbColors, bbSegmentSx } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';

/**
 * "PDF for accounting": the Mollie payments, refunds and transfers to the bank of a period as one PDF, made by the
 * API (`GET /admin/payments-report`). The days are Croatian calendar days, both inclusive.
 */

const ISO = 'YYYY-MM-DD';

// The API accepts at most a year and a day (a full calendar year, leap or not).
const MAX_DAYS = 366;

const PROBLEM_ID = 'accounting-report-problem';

const PRESETS = ['thisMonth', 'lastMonth'] as const;

type Preset = (typeof PRESETS)[number];

const presetRange = (preset: Preset): [string, string] => {
  const today = dayjs();

  if (preset === 'thisMonth') return [today.startOf('month').format(ISO), today.format(ISO)];

  const last = today.subtract(1, 'month');

  return [last.startOf('month').format(ISO), last.endOf('month').format(ISO)];
};

const rangeProblem = (start: Dayjs, end: Dayjs): 'rangeInvalid' | 'rangeTooLong' | null => {
  if (end.isBefore(start)) return 'rangeInvalid';

  return end.diff(start, 'day') > MAX_DAYS ? 'rangeTooLong' : null;
};

const dateFieldSx = {
  width: 142,
  '& .MuiOutlinedInput-root': {
    fontSize: 12,
    borderRadius: '6px',
    backgroundColor: bbColors.white,
    '& fieldset': { borderColor: bbColors.gray300 },
  },
  '& .MuiInputLabel-root': { fontSize: 12 },
} as const;

const AccountingReport = () => {
  const { t } = useTranslation('custom-payments');
  const [[from, to], setRange] = useState<[string, string]>(() => presetRange('thisMonth'));
  const [loading, setLoading] = useState(false);

  const start = dayjs(from);
  const end = dayjs(to);
  const complete = start.isValid() && end.isValid();
  const problem = complete ? rangeProblem(start, end) : null;
  const valid = complete && !problem;
  const activePreset = PRESETS.find(preset => {
    const [presetFrom, presetTo] = presetRange(preset);

    return presetFrom === from && presetTo === to;
  });

  const download = async () => {
    if (!valid || loading) return;

    setLoading(true);

    const pdf = await CardPaymentsService.getPaymentsReport(from, to);

    setLoading(false);

    if (!pdf) {
      showToast({ status: 'error', text: t('report.failed') });

      return;
    }

    saveAs(pdf, `boat4you-uplate-${from}-${to}.pdf`);
  };

  return (
    <Box
      sx={{
        backgroundColor: bbColors.white,
        border: `1px solid ${bbColors.gray200}`,
        borderRadius: '10px',
        px: 1.5,
        py: 1.25,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.25,
      }}
    >
      <Box sx={{ mr: 0.5 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: bbColors.navy900 }}>{t('report.title')}</Typography>
        <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>{t('report.hint')}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {PRESETS.map(preset => (
          <Box
            key={preset}
            component="button"
            type="button"
            aria-pressed={preset === activePreset}
            onClick={() => setRange(presetRange(preset))}
            sx={{ ...bbSegmentSx(preset === activePreset), border: `1px solid ${bbColors.gray200}` }}
          >
            {t(`report.${preset}`)}
          </Box>
        ))}
      </Box>

      <TextField
        type="date"
        size="small"
        label={t('report.from')}
        value={from}
        onChange={e => setRange([e.target.value, to])}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || undefined } }}
        sx={dateFieldSx}
      />
      <TextField
        type="date"
        size="small"
        label={t('report.to')}
        value={to}
        onChange={e => setRange([from, e.target.value])}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { min: from || undefined, 'aria-describedby': problem ? PROBLEM_ID : undefined },
        }}
        error={!valid}
        sx={dateFieldSx}
      />

      <Button
        variant="contained"
        size="small"
        disabled={!valid || loading}
        onClick={download}
        startIcon={
          loading ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfOutlinedIcon sx={{ fontSize: 16 }} />
        }
        sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, borderRadius: '6px', boxShadow: 'none' }}
      >
        {t(loading ? 'report.preparing' : 'report.download')}
      </Button>

      {problem && (
        <Typography id={PROBLEM_ID} role="status" sx={{ flexBasis: '100%', fontSize: 11, color: bbColors.red700 }}>
          {t(`report.${problem}`)}
        </Typography>
      )}
    </Box>
  );
};

export default AccountingReport;
