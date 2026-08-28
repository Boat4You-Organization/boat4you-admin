import React, { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Box, Button, Divider, Grid, Stack, TextField, Typography } from '@mui/material';
import { t } from 'i18next';

import Autocomplete from '@/components/Autocomplete';
import Checkbox from '@/components/Checkbox';
import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import FormInputNumber from '@/components/Forms/FormInputNumber';
import Select from '@/components/Select';
import { COUNTRY_ARRAY, COUNTRY_NAME_MAP, CountryIsoEnum, getCountryCodeFromName } from '@/config/countries.config';
import { CreateInvoiceFormValues } from '@/config/forms/form-models.config';
import { AgencyModel } from '@/models/agencies.model';
import {
  INVOICE_LANGUAGE_ARRAY,
  INVOICE_LANGUAGE_LABEL_MAP,
  InvoiceLanguage,
  RECIPIENT_TYPE_ARRAY,
  RECIPIENT_TYPE_LABEL_MAP,
  RecipientType,
} from '@/models/invoices.model';
import AgenciesService from '@/services/agencies.service';
import colors from '@/styles/themes/colors';
import useBookingAutocomplete from '@/utils/hooks/useBookingAutocomplete';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { FormValidator } from '@/utils/static/FormValidator';
import { showToast } from '@/valtio/global/global.actions';

/**
 * Manual invoice form. COMPANY recipients get an agency picker backed by the
 * live agency registry (synced partners + manual entries) with an inline
 * "add new agency" flow — every boat in Greece runs its own company, so the
 * registry must be extendable right from here (Mario, 26.8.2026). Picking an
 * agency prefills the recipient block; every field stays editable.
 */

const emptyNewAgency = {
  name: '',
  address: '',
  city: '',
  zip: '',
  country: '',
  vatCode: '',
  email: '',
  iban: '',
};

const CreateInvoiceForm = () => {
  const { isMobile } = useBreakpoint();
  const { control, watch, setValue, formState } = useFormContext<CreateInvoiceFormValues>();

  const { includeVat, recipientType, totalPrice, vatPercentage } = watch();
  const { dirtyFields } = formState;

  const [agencies, setAgencies] = useState<AgencyModel[]>([]);
  // The picked agency is pinned into the options list: selecting one makes
  // MUI write its full label into the input, our debounced search then runs
  // on that label, finds nothing, and the option set would no longer contain
  // the picked id — the visible value flickered away (Mario's "glitch",
  // 26.8.2026). Pinning keeps the selection renderable regardless of what
  // the live search currently returns.
  const [selectedAgency, setSelectedAgency] = useState<AgencyModel | null>(null);
  const [agencySearch, setAgencySearch] = useState('');
  const [showNewAgency, setShowNewAgency] = useState(false);
  const [newAgency, setNewAgency] = useState(emptyNewAgency);
  const [savingAgency, setSavingAgency] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Same master-figure logic as UpdateInvoiceForm (Mario 22.8.2026): the
  // total drives net + VAT so the three never drift apart.
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

  // Debounced server-side agency search — the registry holds thousands of
  // partner companies, so we never load it whole.
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      const { content } = await AgenciesService.getAgencies(0, agencySearch || undefined);

      setAgencies(content);
    }, 300);

    return () => clearTimeout(searchDebounce.current);
  }, [agencySearch]);

  const prefillFromAgency = (agency: AgencyModel) => {
    setValue('recipientName', agency.name || '', { shouldDirty: true });
    setValue('recipientCity', agency.city || '', { shouldDirty: true });
    setValue('recipientStreet', agency.address || '', { shouldDirty: true });
    setValue('recipientZipCode', agency.zip || '', { shouldDirty: true });
    setValue('recipientVatCode', agency.vatCode || '', { shouldDirty: true });

    const countryCode = agency.country ? getCountryCodeFromName(agency.country) : CountryIsoEnum.HR;

    setValue('recipientCountry', countryCode as never, { shouldDirty: true });
    // Mirror the auto-invoice language rule: Croatian recipients get HR PDFs.
    setValue('invoiceLanguage', countryCode === CountryIsoEnum.HR ? InvoiceLanguage.HR : InvoiceLanguage.EN, {
      shouldDirty: true,
    });
  };

  const handleAgencyPicked = (id: string) => {
    setValue('agencyId', id as never, { shouldDirty: true });

    if (!id) {
      setSelectedAgency(null);

      return;
    }

    const agency = agencies.find(a => a.id.toString() === id) || selectedAgency;

    if (agency) {
      setSelectedAgency(agency);
      prefillFromAgency(agency);
    }
  };

  const handleSaveNewAgency = async () => {
    if (!newAgency.name.trim()) {
      showToast({ status: 'error', text: t('form.invoice.agency-name-required') });

      return;
    }

    setSavingAgency(true);

    const { payload, message } = await AgenciesService.createAgency({
      ...newAgency,
      name: newAgency.name.trim(),
    });

    setSavingAgency(false);

    if (!payload) {
      showToast({ status: 'error', text: message || t('toast-messages.create-agency-failed') });

      return;
    }

    showToast({ status: 'success', text: t('toast-messages.create-agency-successfully') });
    setAgencies(prev => [payload, ...prev]);
    setSelectedAgency(payload);
    setShowNewAgency(false);
    setNewAgency(emptyNewAgency);
    setValue('agencyId', payload.id.toString() as never, { shouldDirty: true });
    prefillFromAgency(payload);
  };

  const renderBookingInput = useBookingAutocomplete({});

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

  const newAgencyField = (key: keyof typeof emptyNewAgency, label: string, required = false) => (
    <TextField
      size="small"
      fullWidth
      required={required}
      label={label}
      value={newAgency[key]}
      onChange={e => setNewAgency(prev => ({ ...prev, [key]: e.target.value }))}
    />
  );

  return (
    <Stack sx={{ width: { xs: 'auto', md: 670 } }}>
      <Typography component="p" variant="h4" fontWeight={700} color={colors.black950} pb={3}>
        {t('form.invoice.recipient-information')}
      </Typography>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <FormInput name="recipientType" renderInput={renderRecipientTypeInput} validate={FormValidator.isNotEmpty} />
        <Controller
          name="agencyId"
          control={control}
          render={({ field }) => (
            <Box sx={{ width: '100%' }}>
              <Autocomplete
                value={field.value}
                options={[
                  ...(selectedAgency ? [selectedAgency] : []),
                  ...agencies.filter(agency => agency.id !== selectedAgency?.id),
                ].map(agency => ({
                  id: agency.id.toString(),
                  label: [agency.name, agency.city, agency.country].filter(Boolean).join(' — '),
                }))}
                onChange={handleAgencyPicked}
                onInputChange={setAgencySearch}
                label={t('form.invoice.agency')}
                TextFieldProps={{ placeholder: t('form.invoice.search-agency') }}
                disabled={recipientType !== RecipientType.COMPANY}
                clearable
              />
              {recipientType === RecipientType.COMPANY && (
                <Button
                  size="small"
                  onClick={() => setShowNewAgency(open => !open)}
                  sx={{ textTransform: 'none', fontSize: 12, mt: 0.5, p: 0 }}
                >
                  {showNewAgency ? t('actions.cancel') : `+ ${t('form.invoice.add-new-agency')}`}
                </Button>
              )}
            </Box>
          )}
        />
      </Stack>

      {showNewAgency && recipientType === RecipientType.COMPANY && (
        <Box
          sx={{
            border: `1px dashed ${colors.blue300}`,
            borderRadius: '10px',
            p: 2,
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>{t('form.invoice.add-new-agency')}</Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 6 }}>{newAgencyField('name', t('form.invoice.recipient-name'), true)}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{newAgencyField('vatCode', t('form.invoice.recipient-vat-code'))}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{newAgencyField('address', t('form.invoice.recipient-street'))}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{newAgencyField('city', t('form.invoice.recipient-city'))}</Grid>
            <Grid size={{ xs: 12, md: 3 }}>{newAgencyField('zip', t('form.invoice.recipient-code'))}</Grid>
            <Grid size={{ xs: 12, md: 3 }}>{newAgencyField('country', t('form.invoice.recipient-country'))}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{newAgencyField('email', 'Email')}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{newAgencyField('iban', 'IBAN')}</Grid>
          </Grid>
          <Button
            variant="contained"
            size="small"
            disabled={savingAgency}
            onClick={handleSaveNewAgency}
            sx={{ textTransform: 'none', mt: 1.5 }}
          >
            {t('form.invoice.save-agency')}
          </Button>
        </Box>
      )}

      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <FormInput
          name="recipientName"
          formLabel={t('form.invoice.recipient-name')}
          placeholder={t('form.invoice.input-recipient-name')}
          validate={FormValidator.isNotEmpty}
        />
        <FormInput
          name="recipientVatCode"
          formLabel={t('form.invoice.recipient-vat-code')}
          placeholder={t('form.invoice.input-recipient-vat-code')}
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
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
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

      <Divider sx={{ '&.MuiDivider-root': { my: 3 } }} />

      <Typography component="p" variant="h4" fontWeight={700} color={colors.black950} pb={3}>
        {t('form.invoice.invoice-information')}
      </Typography>
      <Stack spacing={3} mb={3}>
        {/* Optional booking link — leave empty for a standalone invoice. */}
        <FormInput name="reservationId" renderInput={renderBookingInput} />
        {/* Mario's paper contract number — his filing key; shows in the
            listing's Booking column and is searchable. */}
        <FormInput
          name="contractNumber"
          formLabel={t('form.invoice.contract-number')}
          placeholder={t('form.invoice.input-contract-number')}
        />
        <Controller
          name="charterDateFrom"
          control={control}
          render={({ field }) => (
            <TextField
              fullWidth
              type="date"
              label={t('form.invoice.charter-date-from')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
        <Controller
          name="charterDateTo"
          control={control}
          render={({ field }) => (
            <TextField
              fullWidth
              type="date"
              label={t('form.invoice.charter-date-to')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
        <FormInput
          name="charterCountry"
          formLabel={t('form.invoice.charter-country')}
          placeholder={t('form.invoice.input-charter-country')}
        />
        <Controller
          name="bookingDate"
          control={control}
          render={({ field }) => (
            <TextField
              fullWidth
              type="date"
              label={t('form.invoice.booking-date')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
        <FormInput
          name="invoiceItem"
          formLabel={t('form.invoice.invoice-item')}
          placeholder={t('form.invoice.input-invoice-item')}
          validate={FormValidator.isNotEmpty}
          multiline
        />
      </Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
        <Controller
          name="invoiceDate"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              size="small"
              fullWidth
              type="date"
              label={t('form.invoice.invoice-date')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
        <FormInput
          name="invoiceNumber"
          formLabel={t('form.invoice.invoice-number')}
          placeholder={t('form.invoice.auto-number')}
        />
        <FormInput name="invoiceLanguage" renderInput={renderInvoiceLanguageInput} validate={FormValidator.isNotEmpty} />
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

export default CreateInvoiceForm;
