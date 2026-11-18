// Offers workspace: a partner yacht's obligatory extras and deposit come from the partner's offer, never from the
// yacht catalogue (Hanna, offer 10472103, 16.11.2026). Run with `yarn test`.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  buildCartExtras,
  cartFigureChanges,
  cartSecurityDeposit,
  catalogueHasObligatory,
  isNauSys,
  offerMayLackSyncedExtras,
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
    const extras = buildCartExtras([catalogueTransitLog, catalogueSup], {
      extras: [offerTransitLog],
      obligatoryExtrasKeys: ['off-transit'],
    });
    const obligatory = extras.filter(x => x.obligatory);

    assert.equal(obligatory.length, 1);
    assert.equal(obligatory[0].priceEur, 480);
    assert.equal(obligatory[0].paymentType, 'WITH_BOOKING');
    assert.ok(extras.some(x => x.name === 'SUP' && !x.obligatory));
  });

  test('a catalogue obligatory row the offer does not carry stays, as in the checkout', () => {
    const other = { key: 'cat-clean', name: 'Final cleaning', priceEur: 200, obligatory: true, unit: 'PER_BOOKING' };
    const extras = buildCartExtras([catalogueTransitLog, other], { extras: [offerTransitLog] });

    assert.deepEqual(
      extras
        .filter(x => x.obligatory)
        .map(x => `${x.name} ${x.priceEur}`)
        .sort(),
      ['Final cleaning 200', 'Transit log 480']
    );
  });
});

describe('waiting for the partner sync', () => {
  test('an empty offer is asked for again on NauSys and on an unknown system, never on MMK or an own yacht', () => {
    assert.equal(offerMayLackSyncedExtras('NAUSYS', false, { extras: [] }), true);
    assert.equal(offerMayLackSyncedExtras(null, undefined, {}), true);
    assert.equal(offerMayLackSyncedExtras('MMK', false, { extras: [] }), false);
    assert.equal(offerMayLackSyncedExtras(null, true, { extras: [] }), false);
    assert.equal(offerMayLackSyncedExtras('NAUSYS', false, { extras: [offerTransitLog] }), false);
  });

  test('only a yacht known to be NauSys is refused', () => {
    assert.equal(isNauSys('NAUSYS'), true);
    assert.equal(isNauSys('NauSys'), true);
    assert.equal(isNauSys('MMK'), false);
    assert.equal(isNauSys(null), false);
  });

  test('the guard applies only when the catalogue would have to supply obligatory rows', () => {
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
