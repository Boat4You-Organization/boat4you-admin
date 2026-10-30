import { ThemeOptions } from '@mui/material';

import { bbColors, bbFont, bbShadow } from '@/styles/bb';

import colors from './colors';
import typography from './typography';

const overrides: ThemeOptions['components'] = {
  MuiButtonBase: {
    defaultProps: {
      disableTouchRipple: true,
    },
  },
  MuiButton: {
    defaultProps: {
      variant: 'contained',
      disableElevation: true,
    },
    styleOverrides: {
      // Broker Desk v2.2: height 36 (30 small, 44 large / mobile), radius 10, 13/700, 6px icon gap.
      root: {
        width: 'fit-content',
        minHeight: 36,
        borderRadius: 10,
        fontFamily: bbFont.stack,
        fontWeight: 700,
        letterSpacing: 0,
        boxShadow: 'none',
        whiteSpace: 'nowrap',
        transition: 'background-color .15s, border-color .15s, color .15s',
        '&:hover': {
          boxShadow: 'none',
        },
        '&:active': {
          boxShadow: 'none',
        },
        '& .MuiButton-startIcon': { marginRight: 6, marginLeft: -2 },
        '& .MuiButton-endIcon': { marginLeft: 6, marginRight: -2 },
      },
      fullWidth: {
        width: '100%',
      },
      sizeSmall: {
        minHeight: 30,
        fontSize: 12,
        fontWeight: 700,
        padding: '0 10px',
      },
      sizeMedium: {
        fontSize: 13,
        fontWeight: 700,
        padding: '0 14px',
      },
      sizeLarge: {
        minHeight: 44,
        fontSize: 14,
        fontWeight: 700,
        padding: '0 18px',
      },
      // Primary — the single yellow call-to-action of a screen.
      containedPrimary: {
        backgroundColor: bbColors.yellow500,
        color: bbColors.yellowText,
        fontWeight: 800,
        boxShadow: bbShadow.yellowCta,
        '&:hover': {
          backgroundColor: bbColors.yellowHover,
          boxShadow: bbShadow.yellowCta,
        },
        '&:active': {
          backgroundColor: '#f7c83d',
          boxShadow: bbShadow.yellowCta,
        },
        '&.Mui-disabled': {
          backgroundColor: bbColors.yellowDisabled,
          color: '#8c7a4a',
          boxShadow: 'none',
        },
      },
      // Secondary — navy, the second strong action.
      containedSecondary: {
        backgroundColor: bbColors.navy900,
        color: bbColors.white,
        '&:hover': {
          backgroundColor: bbColors.navy800,
        },
        '&.Mui-disabled': {
          backgroundColor: '#c9d0d9',
          color: bbColors.white,
        },
      },
      // Tertiary (legacy `info` contained) — white with a hairline border.
      containedInfo: {
        backgroundColor: bbColors.white,
        color: bbColors.navy900,
        border: `1px solid ${bbColors.fieldBorder}`,
        '&:hover': {
          backgroundColor: bbColors.foam50,
        },
        '&.Mui-disabled': {
          backgroundColor: bbColors.gray75,
          color: bbColors.gray450,
        },
      },
      // Destructive filled — only inside a confirmation.
      containedError: {
        backgroundColor: bbColors.red600,
        color: bbColors.white,
        '&:hover': {
          backgroundColor: bbColors.red700,
        },
        '&.Mui-disabled': {
          backgroundColor: '#e9b3a8',
          color: bbColors.white,
        },
      },
      containedSuccess: {
        backgroundColor: bbColors.green600,
        color: bbColors.white,
        '&:hover': {
          backgroundColor: bbColors.green700,
        },
      },
      // Tertiary — outlined.
      outlined: {
        backgroundColor: bbColors.white,
        color: bbColors.navy900,
        borderColor: bbColors.fieldBorder,
        '&:hover': {
          backgroundColor: bbColors.foam50,
          borderColor: bbColors.gray450,
        },
        '&.Mui-disabled': {
          backgroundColor: bbColors.gray75,
          color: bbColors.gray450,
          borderColor: bbColors.gray200,
        },
      },
      outlinedError: {
        color: bbColors.red700,
        borderColor: bbColors.red200,
        '&:hover': {
          backgroundColor: bbColors.red100,
          borderColor: bbColors.red200,
        },
        '&.Mui-disabled': {
          color: '#d9a79f',
          borderColor: '#f3ddd8',
        },
      },
      // Ghost — text.
      text: {
        color: bbColors.navy900,
        '&:hover': {
          backgroundColor: bbColors.gray100,
        },
        '&.Mui-disabled': {
          color: bbColors.gray450,
        },
      },
      textError: {
        color: bbColors.red700,
        '&:hover': {
          backgroundColor: bbColors.red100,
        },
      },
      textInfo: {
        color: bbColors.navy900,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        color: bbColors.gray500,
        '&:hover': {
          backgroundColor: bbColors.gray100,
          color: bbColors.navy900,
        },
        '&:active': {
          backgroundColor: bbColors.gray200,
          color: bbColors.navy900,
        },
      },
      sizeSmall: {
        width: 28,
        height: 28,
      },
      sizeMedium: {
        width: 36,
        height: 36,
      },
      sizeLarge: {
        width: 44,
        height: 44,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      // Fields: 36px high, radius 10, 13px text; focus = navy.700 border + 4px aura.
      root: {
        borderRadius: 10,
        backgroundColor: bbColors.white,
        fontFamily: bbFont.stack,
        fontSize: 13,
        color: bbColors.navy900,
        '& .MuiSvgIcon-root': {
          color: bbColors.gray500,
        },
        '&:hover': {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: bbColors.gray450,
          },
        },
        '&.Mui-focused': {
          boxShadow: bbShadow.focusRing,
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1,
            borderColor: bbColors.navy700,
          },
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: bbColors.red600,
        },
        '&.Mui-disabled': {
          backgroundColor: bbColors.gray50,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: bbColors.gray200,
          },
          '& .MuiOutlinedInput-input': {
            color: '#8792a0',
            WebkitTextFillColor: '#8792a0',
          },
        },
        '@media (max-width: 767px)': {
          fontSize: 16,
        },
      },
      input: {
        padding: '8.5px 10px',
        color: bbColors.navy900,
        '&::placeholder': {
          color: bbColors.gray500,
          opacity: 1,
        },
      },
      inputSizeSmall: {
        padding: '5.5px 10px',
      },
      notchedOutline: {
        borderColor: bbColors.fieldBorder,
      },
      multiline: {
        padding: 0,
        '& .MuiOutlinedInput-input': {
          padding: 10,
          minHeight: 88,
          resize: 'none',
        },
      },
    },
  },
  MuiInputAdornment: {
    styleOverrides: {
      root: {
        color: bbColors.gray500,
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        fontFamily: bbFont.stack,
        fontSize: 12,
        marginLeft: 0,
        marginRight: 0,
        color: bbColors.gray500,
        '&.Mui-error': {
          color: bbColors.red700,
        },
      },
    },
  },
  MuiPickersTextField: {
    styleOverrides: {
      root: {
        '& .MuiPickersInputBase-root': {
          borderRadius: 10,
          backgroundColor: colors.white,

          '& .MuiSvgIcon-root': {
            color: bbColors.gray500,
          },

          '& .MuiPickersOutlinedInput-notchedOutline': {
            borderColor: bbColors.fieldBorder,
            borderWidth: 1,
          },

          '&:hover:not(.Mui-focused):not(.Mui-disabled)': {
            '& .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: colors.black500,
              borderWidth: 1,
            },
            '& .MuiSvgIcon-root': {
              color: colors.black200,
            },
          },

          fontSize: 13,

          '& .MuiPickersInputBase-sectionsContainer': {
            padding: '8.5px 0',
            opacity: 1,

            '& .MuiPickersSectionList-root': {
              color: colors.black500,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              letterSpacing: 'inherit',

              '& span[aria-valuenow="Empty"]': {
                color: colors.black500,
              },

              '& span[aria-valuenow]:not([aria-valuenow="Empty"])': {
                color: colors.black950,
              },

              '& span': {
                color: colors.black500,
              },

              '& .MuiPickersSectionList-section[aria-valuenow]:not([aria-valuenow="Empty"])': {
                color: colors.black950,
              },
            },
          },

          '& span[aria-valuenow="Empty"]': {
            color: colors.black500,
          },

          '& span[aria-valuenow]:not([aria-valuenow="Empty"])': {
            color: colors.black950,
          },

          '& span': {
            color: colors.black500,
          },

          '& .MuiPickersSectionList-section[aria-valuenow]:not([aria-valuenow="Empty"])': {
            color: colors.black950,
          },

          '&.Mui-focused': {
            boxShadow: bbShadow.focusRing,
            '& .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: colors.blue500,
              borderWidth: 1,
            },
            '& .MuiSvgIcon-root': {
              color: colors.black200,
            },
            '& .MuiPickersSectionList-root': {
              color: colors.black950,

              '& span': {
                color: colors.black950,
              },
            },
          },

          '&.Mui-disabled': {
            '& .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: colors.black200,
            },
            '& .MuiPickersInputBase-sectionsContainer, & .MuiSvgIcon-root': {
              color: colors.black200,
            },
          },
        },
      },
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      // Label always above the field, 12/600 gray.600.
      root: {
        fontFamily: bbFont.stack,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        color: bbColors.gray600,
        marginBottom: 4,
        '&.Mui-focused': {
          color: bbColors.gray600,
        },
        '&.Mui-error': {
          color: bbColors.red700,
        },
      },
      asterisk: {
        color: bbColors.red600,
      },
    },
  },
  MuiContainer: {
    defaultProps: {
      maxWidth: false,
    },
    styleOverrides: {
      root: {
        paddingInline: '80px',
        '@media (max-width: 1024px)': {
          paddingInline: 16,
        },
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        padding: 0,
        border: `1px solid ${bbColors.gray200}`,
        boxShadow: bbShadow.raised,
      },
      list: {
        padding: 6,
        '&.MuiList-root': {
          gap: 2,
        },
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        boxShadow: bbShadow.raised,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        minHeight: 36,
        padding: '0 10px',
        fontFamily: bbFont.stack,
        fontSize: 13,
        color: bbColors.navy900,
        gap: 10,
        '@media (max-width: 768px)': {
          minHeight: 44,
        },
        '&:hover': {
          backgroundColor: bbColors.gray50,
        },
        '&:active': {
          backgroundColor: bbColors.gray100,
        },
        '&.Mui-selected': {
          backgroundColor: bbColors.selectedRow,
          '&:hover': { backgroundColor: bbColors.selectedRow },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        height: 22,
        borderRadius: 999,
        fontFamily: bbFont.stack,
        fontWeight: 700,
        backgroundColor: bbColors.gray100,
        color: bbColors.gray600,
      },
      label: {
        fontSize: 11.5,
        paddingInline: 9,
        overflow: 'visible',
      },
      sizeMedium: {
        height: 26,
      },
      colorSuccess: { backgroundColor: bbColors.green100, color: bbColors.green700 },
      colorError: { backgroundColor: bbColors.red100, color: bbColors.red700 },
      colorWarning: { backgroundColor: bbColors.amber100, color: bbColors.amber800 },
      colorInfo: { backgroundColor: bbColors.info100, color: bbColors.navy700 },
      colorPrimary: { backgroundColor: bbColors.navy900, color: bbColors.white },
      outlined: {
        backgroundColor: bbColors.white,
        borderColor: bbColors.fieldBorder,
        color: bbColors.navy900,
      },
      outlinedSecondary: {
        paddingInline: 4,
      },
      deleteIcon: {
        fontSize: 16,
        color: bbColors.gray450,
        '&:hover': { color: bbColors.gray600 },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: 0,
        '& > :not(style) ~ :not(style)': {
          marginLeft: 0,
        },
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        height: 4,
        padding: '10px 0',
      },
      thumb: {
        height: 20,
        width: 20,
        backgroundColor: colors.white,
        border: `1px solid ${colors.black200}`,
        '&::before, &::after': {
          backgroundColor: 'rgba(217, 228, 255, 0.70) 100%)',
        },
      },
      track: {
        backgroundColor: colors.blue500,
        height: 4,
      },
      rail: {
        backgroundColor: colors.blue100,
      },
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      // Segmented control: white slider on the grey track.
      root: {
        gap: 2,
        padding: 3,
        borderRadius: 10,
        backgroundColor: bbColors.gray150,
      },
      firstButton: {
        borderRadius: 7,
      },
      lastButton: {
        borderRadius: 7,
      },
      middleButton: {
        borderRadius: 7,
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        height: 30,
        padding: '0 12px',
        borderRadius: 7,
        border: 'none',
        fontFamily: bbFont.stack,
        fontSize: 12.5,
        fontWeight: 600,
        textTransform: 'none',
        backgroundColor: 'transparent',
        color: bbColors.gray600,
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,.6)',
          color: bbColors.navy900,
        },
        '&.Mui-selected': {
          backgroundColor: bbColors.white,
          color: bbColors.navy900,
          boxShadow: '0 1px 2px rgba(11,26,43,.15)',
          '&:hover': {
            backgroundColor: bbColors.white,
            color: bbColors.navy900,
          },
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontFamily: bbFont.stack,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.4,
        color: bbColors.white,
        backgroundColor: bbColors.navy900,
        padding: '6px 10px',
        borderRadius: 8,
      },
      arrow: {
        color: bbColors.navy900,
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        padding: 8,
        color: bbColors.gray450,
        '&.Mui-checked, &.MuiCheckbox-indeterminate': {
          color: bbColors.navy900,
        },
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        color: bbColors.gray450,
        '&.Mui-checked': {
          color: bbColors.navy900,
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      // 34×20 track, navy when on.
      root: {
        width: 50,
        height: 36,
        padding: '8px',
      },
      switchBase: {
        padding: 10,
        '&.Mui-checked': {
          transform: 'translateX(14px)',
          color: bbColors.white,
          '& + .MuiSwitch-track': {
            backgroundColor: bbColors.navy900,
            opacity: 1,
          },
        },
      },
      thumb: {
        width: 16,
        height: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,.2)',
      },
      track: {
        borderRadius: 999,
        backgroundColor: bbColors.gray300,
        opacity: 1,
      },
      // size="small": 28×16 track, 12px thumb, centred like the default size.
      sizeSmall: {
        width: 44,
        height: 32,
        padding: '8px',
        '& .MuiSwitch-switchBase': {
          padding: 10,
          '&.Mui-checked': { transform: 'translateX(12px)' },
        },
        '& .MuiSwitch-thumb': { width: 12, height: 12 },
      },
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      root: {
        padding: 0,
        '& .MuiOutlinedInput-root': {
          padding: '5px 10px',
          '& .MuiAutocomplete-input': {
            padding: 0,
          },
        },
        '& .MuiAutocomplete-tag': {
          backgroundColor: bbColors.gray100,
          color: bbColors.gray600,
          marginInline: 4,
          paddingBlock: 0,
          paddingInline: 8,
          borderRadius: '999px',

          '& .MuiChip-label': {
            paddingInline: 4,
          },

          '& .MuiChip-deleteIcon': {
            fontSize: 16,
            marginLeft: 4,
            color: colors.black400,
            '&:hover': {
              color: colors.black500,
            },
          },
        },
      },
      paper: {
        marginTop: 6,
        borderRadius: 12,
        border: `1px solid ${bbColors.gray200}`,
        boxShadow: bbShadow.raised,
      },
      listbox: {
        padding: 6,
        fontFamily: bbFont.stack,
        fontSize: 13,
        '& .MuiAutocomplete-option': {
          padding: '8px 10px',
          borderRadius: 8,
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 2,
          '&:last-of-type': {
            marginBottom: 0,
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        padding: 0,
        maxWidth: 'fit-content',
        maxHeight: '80vh',
        borderRadius: 16,
        border: `1px solid ${bbColors.gray200}`,
        boxShadow: bbShadow.modal,
        '@media (max-width: 768px)': {
          maxHeight: '100%',
        },
      },
    },
  },
  MuiBackdrop: {
    styleOverrides: {
      root: {
        '&:not(.MuiBackdrop-invisible)': {
          backgroundColor: 'rgba(11,26,43,.45)',
        },
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: '16px 20px',
        fontFamily: bbFont.stack,
        fontSize: 18,
        fontWeight: 800,
        color: bbColors.navy900,
        borderBottom: `1px solid ${bbColors.gray100}`,

        '@media (max-width: 768px)': {
          padding: '12px 16px',
        },
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        borderColor: bbColors.gray100,
        padding: '18px 20px',

        '@media (max-width: 768px)': {
          padding: 16,
        },
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '14px 20px',
        gap: 8,
        borderTop: `1px solid ${bbColors.gray100}`,
        backgroundColor: bbColors.gray75,

        '@media (max-width: 768px)': {
          flexDirection: 'column-reverse',
          padding: '12px 16px 16px',
        },
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        fontFamily: bbFont.stack,
        fontSize: '11px',
        fontWeight: 700,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        '&.MuiDivider-root': {
          marginBlock: 16,
          borderColor: bbColors.gray100,
        },
      },
    },
  },

  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      },
    },
  },
  MuiImageList: {
    styleOverrides: {
      root: {
        '&:nth-of-type(1)': {
          height: '418px',
        },
      },
    },
  },
  MuiImageListItem: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.black200,
        img: {
          transition: 'transform 225ms ease-in-out',
        },
        '&:hover': {
          img: {
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      // The one tab style: navy fill on a grey track (see bbTabSx).
      root: {
        minHeight: 36,
        padding: 3,
        borderRadius: 10,
        backgroundColor: bbColors.gray150,
        width: 'fit-content',
        maxWidth: '100%',
        '& .MuiTabScrollButton-root.Mui-disabled': {
          display: 'none',
        },
      },
      flexContainer: {
        gap: 2,
      },
      indicator: {
        display: 'none',
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: 30,
        height: 30,
        minWidth: 0,
        padding: '0 12px',
        borderRadius: 7,
        fontFamily: bbFont.stack,
        fontSize: 12.5,
        fontWeight: 600,
        textTransform: 'none',
        color: bbColors.gray600,
        '&:hover': {
          color: bbColors.navy900,
        },
        '&.Mui-selected': {
          backgroundColor: bbColors.navy900,
          color: bbColors.white,
        },
      },
    },
  },
  MuiList: {
    styleOverrides: {
      root: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: {
        ...typography.body1,
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        padding: 0,
      },
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 'auto',
      },
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      label: {
        ...typography.body1,
      },
    },
  },
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
    },
    styleOverrides: {
      root: {
        padding: 0,
        border: `1px solid ${bbColors.cardBorder}`,

        paper: {
          boxShadow: 'none',
        },

        '&:before': {
          display: 'none',
        },

        '&:first-of-type': {
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        },

        '&:last-of-type': {
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        padding: '10px 14px 10px 24px',
        flexDirection: 'row',
      },
      content: {
        margin: 0,
      },

      expandIconWrapper: {
        '& .MuiIcon-root': {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        padding: '0 14px 24px 24px',
        maxWidth: '644px',
      },
    },
  },
  MuiPaginationItem: {
    styleOverrides: {
      root: {
        height: 30,
        minWidth: 30,
        borderRadius: 8,
        backgroundColor: bbColors.white,
        color: bbColors.navy900,
        fontFamily: bbFont.stack,
        fontSize: 12.5,
        fontWeight: 600,
        '&:hover': {
          backgroundColor: bbColors.foam50,
        },
        '&.Mui-selected': {
          backgroundColor: bbColors.navy900,
          color: bbColors.white,
          cursor: 'default',
          pointerEvents: 'none',
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        backgroundColor: bbColors.gray100,
      },
      bar: {
        backgroundColor: bbColors.navy700,
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        color: 'inherit',
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        backgroundColor: bbColors.gray100,
        borderRadius: 5,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        fontFamily: bbFont.stack,
        fontSize: 13,
      },
      standardSuccess: { backgroundColor: bbColors.green100, color: bbColors.green700 },
      standardError: { backgroundColor: bbColors.red100, color: bbColors.red700 },
      standardWarning: { backgroundColor: bbColors.amber100, color: bbColors.amber800 },
      standardInfo: { backgroundColor: bbColors.info100, color: bbColors.navy700 },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: bbColors.navy700,
        fontWeight: 600,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: 14,
      },
    },
  },
};

export default overrides;
