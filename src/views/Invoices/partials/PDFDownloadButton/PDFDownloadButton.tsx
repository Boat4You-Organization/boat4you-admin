import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, LinearProgress, Menu, MenuItem, Typography } from '@mui/material';
import { DocumentProps, pdf } from '@react-pdf/renderer';

import Download from '@/components/SvgIcons/Download';
import { Locale } from '@/i18nPdf';
import colors from '@/styles/themes/colors';
import useBreakpoint from '@/utils/hooks/useBreakpoint';

interface PDFDownloadButtonProps {
  fileName: string;
  documents: Record<Locale, React.ReactElement<DocumentProps>>;
  disabled?: boolean;
}

const PDFDownloadButton = ({ fileName, documents, disabled }: PDFDownloadButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null);
  const [shouldDownload, setShouldDownload] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const open = Boolean(anchorEl);
  const { isMobile } = useBreakpoint();
  const { t } = useTranslation();

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDownloadRequest = async (locale: Locale) => {
    setSelectedLocale(locale);
    setIsPreparing(true);
    try {
      setShouldDownload(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setSelectedLocale(null);
      setShouldDownload(false);
    }
  };

  useEffect(() => {
    const download = async () => {
      if (!shouldDownload || !selectedLocale) return;

      try {
        const blob = await pdf(documents[selectedLocale]).toBlob();
        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = `Invoice-${fileName}-${selectedLocale.toUpperCase()}.pdf`;
        link.click();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        return;
      } finally {
        setShouldDownload(false);
        setSelectedLocale(null);
        setIsPreparing(false);
        handleClose();
      }
    };

    download();
  }, [shouldDownload, selectedLocale, documents, fileName, handleClose]);

  const renderMenuItem = (id: string, locale: Locale) => (
    <MenuItem key={locale} onClick={() => handleDownloadRequest(locale)} disabled={isPreparing}>
      <Typography component="div" variant="body2" sx={{ '& > img': { mr: 1 } }}>
        <img
          loading="lazy"
          width="20"
          srcSet={`https://flagcdn.com/w40/${id.toLowerCase()}.png 2x`}
          src={`https://flagcdn.com/w20/${id.toLowerCase()}.png`}
          alt={locale}
        />
        {`Invoice-${fileName}-${locale.toUpperCase()}.pdf`}
        {selectedLocale === locale && isPreparing && (
          <Box sx={{ height: 4, mt: 0.5 }}>
            <LinearProgress />
          </Box>
        )}
      </Typography>
    </MenuItem>
  );

  return (
    <>
      {isMobile ? (
        <Button color="secondary" variant="outlined" onClick={handleClick} disabled={disabled}>
          <Download size={18} fill={disabled ? colors.black200 : colors.black} />
        </Button>
      ) : (
        <Button
          color="secondary"
          variant="outlined"
          startIcon={<Download size={18} fill={disabled ? colors.black200 : colors.black} />}
          onClick={handleClick}
          disabled={disabled}
        >
          {t('actions.download-pdf')}
        </Button>
      )}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            sx: {
              gap: 1,
            },
          },
        }}
      >
        {renderMenuItem('HR', 'hr')}
        {renderMenuItem('US', 'en')}
      </Menu>
    </>
  );
};

export default PDFDownloadButton;
