import React, { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Divider, Grid, Stack, Typography } from '@mui/material';
import { t } from 'i18next';

import Checkbox from '@/components/Checkbox';
import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import FormInputNumber from '@/components/Forms/FormInputNumber';
import Select from '@/components/Select';
import { COUNTRY_ARRAY, COUNTRY_NAME_MAP } from '@/config/countries.config';
import { UpdateInvoiceFormValues } from '@/config/forms/form-models.config';
import {
  INVOICE_LANGUAGE_ARRAY,
  INVOICE_LANGUAGE_LABEL_MAP,
  INVOICE_STATUS_ARRAY,
  INVOICE_STATUS_LABEL_MAP,
  RECIPIENT_TYPE_ARRAY,
  RECIPIENT_TYPE_LABEL_MAP,
} from '@/models/invoices.model';
import colors from '@/styles/themes/colors';
import useBookingAutocomplete from '@/utils/hooks/useBookingAutocomplete';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { FormValidator } from '@/utils/static/FormValidator';

const UpdateInvoiceForm = () => {
  const { isMobile } = useBreakpoint();
  const { control, watch, setValue, formState } = useFormContext<UpdateInvoiceFormValues>();

  const { includeVat, reservationId, totalPrice, vatPercentage } = watch();
  const { dirtyFields } = formState;

  // Total price is the master figure (Mario 22.8.2026): as soon as the
  // broker edits it (or the VAT %), derive the net and the VAT amount so
  // the three can never drift apart (stored invoices had 515.04 + 128.77
  // next to a 804.76 total). Untouched forms keep their stored values —
  // only a user edit (dirty total / VAT % / checkbox) triggers the recompute.
  useEffect(() => {
    if (!dirtyFields.totalPrice && !dirtyFields.vatPercentage && !dirtyFields.includeVat) return;

    const total = Number(totalPrice);

    if (!Number.isFinite(total)) return;

    const pct = includeVat ? Number(vatPercentage) || 0 : 0;
    const net = Math.round((total / (1 + pct / 100)) * 100) / 100;
    const vat = Math.round((total - net) * 100) / 100;

    setValue('priceWithoutVat', net as never, { shouldDirty: true });
    setValue('vatAmount', (includeVat ? vat : null) as never, { shouldDirty: true });
  }, [totalPrice, vatPercentage, includeVat, dirtyFields.totalPrice, dirtyFields.vatPercentage, dirtyFields.includeVat, setValue]);

  const renderBookingInput = useBookingAutocomplete({
    disabled: true,
    reservationId,
  });

  const renderRecipientTypeInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      options={RECIPIENT_TYPE_ARRAY.map(item => ({
        id: item,
        label: t(RECIPIENT_TYPE_LABEL_MAP[item]),
      }))}
      label={t('form.invoice.recipient-type')}
      placeholder={t('form.invoice.input-recipient-type')}
      error={error}
    />
  );

  const renderRecipientCountryInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      options={COUNTRY_ARRAY.map(item => ({
        id: item,
        label: t(COUNTRY_NAME_MAP[item]),
      }))}
      label={t('form.invoice.recipient-country')}
      placeholder={t('form.invoice.input-recipient-country')}
      error={error}
    />
  );

  const renderInvoiceLanguageInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      options={INVOICE_LANGUAGE_ARRAY.map(item => ({
        id: item,
        label: t(INVOICE_LANGUAGE_LABEL_MAP[item]),
      }))}
      label={t('form.invoice.select-language')}
      placeholder={t('form.invoice.select-language')}
      error={error}
    />
  );

  const renderInvoiceStatusInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      options={INVOICE_STATUS_ARRAY.map(item => ({
        id: item,
        label: t(INVOICE_STATUS_LABEL_MAP[item]),
      }))}
      label={t('form.invoice.select-status')}
      placeholder={t('form.invoice.select-status')}
      error={error}
    />
  );

  return (
    <Stack sx={{ width: { xs: 'auto', md: 670 } }}>
      <Typography component="p" variant="h4" fontWeight={700} color={colors.black950} pb={3}>
        {t('form.invoice.reservation-information')}
      </Typography>
      <Stack spacing={3}>
        {/* Booking link is OPTIONAL — manual/standalone invoices have none,
            and a required disabled field made them unsavable. */}
        <FormInput name="reservationId" renderInput={renderBookingInput} />
        {/* Mario's paper contract number — filing key, searchable. */}
        <FormInput
          name="contractNumber"
          formLabel={t('form.invoice.contract-number')}
          placeholder={t('form.invoice.input-contract-number')}
        />
        <FormInput
          name="invoiceItem"
          formLabel={t('form.invoice.invoice-item')}
          placeholder={t('form.invoice.input-invoice-item')}
          multiline
        />
      </Stack>
      <Divider
        sx={{
          '&.MuiDivider-root': {
            my: 3,
          },
        }}
      />
      <Typography component="p" variant="h4" fontWeight={700} color={colors.black950} pb={3}>
        {t('form.invoice.recipient-information')}
      </Typography>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <FormInput name="recipientType" renderInput={renderRecipientTypeInput} validate={FormValidator.isNotEmpty} />
        <FormInput
          name="recipientName"
          formLabel={t('form.invoice.recipient-name')}
          placeholder={t('form.invoice.input-recipient-name')}
          validate={FormValidator.isNotEmpty}
        />
      </Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <FormInput
          name="recipientCity"
          formLabel={t('form.invoice.recipient-city')}
          placeholder={t('form.invoice.input-recipient-city')}
          validate={FormValidator.isNotEmpty}
        />
        <FormInput
          name="recipientStreet"
          formLabel={t('form.invoice.recipient-street')}
          placeholder={t('form.invoice.input-recipient-street')}
          validate={FormValidator.isNotEmpty}
        />
      </Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <FormInput
          name="recipientZipCode"
          formLabel={t('form.invoice.recipient-code')}
          placeholder={t('form.invoice.input-recipient-code')}
          validate={FormValidator.isNotEmpty}
        />
        <FormInput
          name="recipientCountry"
          renderInput={renderRecipientCountryInput}
          validate={FormValidator.isNotEmpty}
        />
      </Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
        <FormInput
          name="recipientVatCode"
          formLabel={t('form.invoice.recipient-vat-code')}
          placeholder={t('form.invoice.input-recipient-vat-code')}
          validate={FormValidator.isNotEmpty}
        />
      </Stack>
      <Divider
        sx={{
          '&.MuiDivider-root': {
            my: 3,
          },
        }}
      />
      <Typography component="p" variant="h4" fontWeight={700} color={colors.black950} pb={3}>
        {t('form.invoice.invoice-information')}
      </Typography>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <FormInput
          name="invoiceNumber"
          formLabel={t('form.invoice.invoice-number')}
          placeholder={t('form.invoice.input-invoice-number')}
          validate={FormValidator.isNotEmpty}
        />
        <FormInput
          name="invoiceLanguage"
          renderInput={renderInvoiceLanguageInput}
          validate={FormValidator.isNotEmpty}
        />
        <FormInput name="invoiceStatus" renderInput={renderInvoiceStatusInput} />
      </Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <FormInputNumber
          name="priceWithoutVat"
          formLabel={t('form.invoice.price-without-vat')}
          placeholder={t('form.invoice.input-price-without-vat')}
          validate={FormValidator.isNumberRequired}
        />
        <FormInputNumber
          name="totalPrice"
          formLabel={t('form.invoice.total-price')}
          placeholder={t('form.invoice.input-total-price')}
          validate={FormValidator.isNumberRequired}
        />
      </Stack>
      <Grid container spacing={2.5} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="includeVat"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={!!field.value}
                onChange={event => field.onChange(event.target.checked)}
                label={t('form.invoice.include-vat')}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {includeVat && (
            <FormInputNumber
              name="vatPercentage"
              formLabel={t('form.invoice.vat-percentage')}
              placeholder={t('form.invoice.input-vat-percentage')}
            />
          )}
        </Grid>
        {includeVat && (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormInputNumber
              name="vatAmount"
              formLabel={t('form.invoice.vat-amount')}
              placeholder={t('form.invoice.input-vat-amount')}
            />
          </Grid>
        )}
      </Grid>
    </Stack>
  );
};

export default UpdateInvoiceForm;
