// Offers workspace: a partner yacht's obligatory extras and deposit come from the partner's offer, never from the
// yacht catalogue (Hanna, offer 10472103, 16.11.2026). Run with `yarn test`.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  buildCartExtras,
  cartFigureChanges,
  cartSecurityDeposit,
  catalogueHasObligatory,
  offerLacksPartnerExtras,
} from '../src/views/Offers/offerCart.ts';

// the catalogue row of the night before: old amount, paid to the operator
const catalogueTransitLog = {
  key: 'cat-transit',
  externalId: 75149126,
  name: 'Transit log',
  priceEur: 430,
  obligatory: true,
  paymentType: 'ADVANCE_TO_OPERATOR' as const,
  unit: 'PER_BOOKING',
};
const catalogueSup = { key: 'cat-sup', name: 'SUP', priceEur: 100, obligatory: false, unit: 'PER_WEEK' };
// the partner's offer for the two weeks
const offerTransitLog = {
  id: 9001,
  key: 'off-transit',
  externalId: 75149126,
  name: 'Transit log',
  priceEur: 480,
  obligatory: true,
  paymentType: 'WITH_BOOKING' as const,
  unit: 'PER_BOOKING',
};

describe('buildCartExtras', () => {
  test('the offer row replaces its catalogue twin: amount and way of payment are the offer`s', () => {
    const extras = buildCartExtras(
      [catalogueTransitLog, catalogueSup],
      { extras: [offerTransitLog], obligatoryExtrasKeys: ['off-transit'] },
      true
    );
    const obligatory = extras.filter(x => x.obligatory);

    assert.equal(obligatory.length, 1);
    assert.equal(obligatory[0].priceEur, 480);
    assert.equal(obligatory[0].paymentType, 'WITH_BOOKING');
    assert.ok(extras.some(x => x.name === 'SUP' && !x.obligatory));
  });

  test('a partner yacht never takes an obligatory row from the catalogue', () => {
    const extras = buildCartExtras([catalogueTransitLog, catalogueSup], { extras: [] }, true);

    assert.deepEqual(
      extras.map(x => x.name),
      ['SUP']
    );
  });

  test('an own (non-partner) yacht keeps its catalogue obligatory rows: there is no partner offer to read', () => {
    const extras = buildCartExtras([catalogueTransitLog], { extras: [] }, false);

    assert.equal(extras.length, 1);
    assert.equal(extras[0].obligatory, true);
  });
});

describe('waiting for the partner sync', () => {
  test('only a partner yacht whose offer has no extras is asked for again', () => {
    assert.equal(offerLacksPartnerExtras(true, { extras: [] }), true);
    assert.equal(offerLacksPartnerExtras(true, {}), true);
    assert.equal(offerLacksPartnerExtras(true, { extras: [offerTransitLog] }), false);
    assert.equal(offerLacksPartnerExtras(false, { extras: [] }), false);
  });

  test('the yacht is refused only when the catalogue would have to supply obligatory rows', () => {
    assert.equal(catalogueHasObligatory([catalogueTransitLog, catalogueSup]), true);
    assert.equal(catalogueHasObligatory([catalogueSup]), false);
  });
});

describe('cartSecurityDeposit', () => {
  test('the offer`s deposit wins over the yacht-level one', () => {
    assert.equal(cartSecurityDeposit(3500, 3000, 1), 3500);
  });

  test('a backend that does not send it yet falls back to the yacht-level figure, converted', () => {
    assert.equal(cartSecurityDeposit(undefined, 3000, 0.85), 2550);
    assert.equal(cartSecurityDeposit(null, null, 1), null);
  });
});

describe('cartFigureChanges', () => {
  const row = (priceEur: number, paymentType: 'WITH_BOOKING' | 'ADVANCE_TO_OPERATOR') => ({
    name: 'Transit log',
    priceEur,
    included: false,
    obligatory: true,
    paymentType,
  });

  test('names what moved between the snapshot and the fresh read', () => {
    assert.deepEqual(
      cartFigureChanges(
        { clientPriceEur: 9000, securityDepositEur: 3000, extras: [row(430, 'ADVANCE_TO_OPERATOR')] },
        { clientPriceEur: 9000, securityDepositEur: 3500, extras: [row(480, 'WITH_BOOKING')] }
      ),
      ['obligatory extras', 'security deposit']
    );
  });

  test('nothing to report when the figures are the same', () => {
    const same = { clientPriceEur: 9000, securityDepositEur: 3500, extras: [row(480, 'WITH_BOOKING')] };

    assert.deepEqual(cartFigureChanges(same, { ...same, extras: [...same.extras] }), []);
  });
});
