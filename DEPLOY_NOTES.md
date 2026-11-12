# boat4you-admin — deploy notes

## 2026-11-12 — 🎬 Objave: gumb „Napravi Reel od ovih fotki“, dnevni Reel bez Higgsfielda, Pinterest — ⏳ NIJE DEPLOYANO (čeka backend s iste grane)

- Nova objava: uz 2+ fotki gumb koji na serveru napravi okomiti video (Reel) i zamijeni fotke u objavi (`POST /admin/social/media/reel`).
- AI dnevne objave: prekidač „Dnevni Reel (video)“ radi i bez Higgsfielda (video od fotki broda na našem serveru); poruka kaže radi li server video (`reelUnavailable`).
- Pinterest: pravilo 1 fotka, bez videa; spajanje radi čim backend ima ključeve.
- tsc, eslint (0 grešaka), `tests/social.test.ts` 31/31.

## 2026-11-11 — 📞 Call centar: stranice punim nazivom i u svojoj boji, filtar po stranici radi — ✅ LIVE 11.11.2026 17:08 UTC (`5b4074c`, `assets/index-PeDCUpFG.js`, na `origin/main`); tag `live/2026-11-11-call-site-names`; cusma1 `html.prev` = `index-Cui88siF.js`

- **Što (Mario 11.11.: „di piše CC, stavi Catamaran Croatia i svaki web u svoju boju“):** backend sprema stranicu upita pod `CallSite` ključem (`cc`, `greece`, `italy`, `caribbean`, `ey`, `cy`, `boat4you`), a `SiteChip` i `siteLabel` rade s admin oznakama (`catamaran-croatia` …). Pozivi, Upiti i detalj poziva sada mapiraju ključ (`src/utils/callCenter/callSite.ts`) pa pišu puni naziv u boji stranice. Filtar po stranici je slao admin oznake koje backend ne sprema i nije vraćao ništa; sada šalje ključ.
- **Provjereno:** `yarn test` 148/148 (novi `tests/call-site.test.ts`), tsc 0, eslint 0 grešaka; živi ulazni bundle = novi, root/deep/asset 200. **Nije provjereno u pregledniku** (prijava).

## 2026-11-11 — 💳 Stripe uklonjen iz admina (oznaka „Kartica · Stripe“ uz plaćenu ratu) — ✅ LIVE 11.11.2026 17:03 UTC (`c919af5`, `assets/index-Cui88siF.js`, na `origin/main`; backend bez Stripea `c82b89d6` LIVE na cusma2 17:02 UTC); tag `live/2026-11-11-no-stripe`; cusma1 `html.prev` = `index-C6vrdQsA.js`

- Mario 11.11.: „samo ostavi mollie“ → „Da, ukloni“. `PhasePaidBy` prikazuje samo „Kartica · Mollie“ s linkom; polje `stripePaymentIntentId` i ključ `paidByStripe` (en + hr) uklonjeni, `resources.d.ts` regeneriran. U produkcijskoj bazi nije bilo nijedne rate plaćene preko Stripea, pa se oznaka nije ni prikazivala.
- **Provjereno:** tsc 0, eslint 0 grešaka; uživo entry `index-Cui88siF.js`, u njemu nema riječi „stripe“, blok „PDF za knjigovodstvo“ je i dalje tu; root/deep/asset 200.

## 2026-11-11 — 📞 Call centar → Postavke: naslovi sekcija kažu čije vrijeme vrijedi — ✅ LIVE 11.11.2026 16:46 UTC (`6340876`, `assets/index-C6vrdQsA.js`)

- „Kada Nika zove (lokalno vrijeme klijenta, svih 7 dana)“ i „Prebacivanje na Marija (hrvatsko vrijeme)“; en + hr, `resources.d.ts` regeneriran. Samo tekst, logika je u backendu (`CallClock`).
- **Provjereno:** tsc 0, eslint 0 grešaka; novi naslov je u živom bundleu.

## 2026-11-11 — 🧾 Plaćanja: „PDF za knjigovodstvo“ (uplate, povrati i isplate na banku za razdoblje) — ✅ LIVE 11.11.2026 16:12 UTC (`43a906a`, `assets/index-CSoScuJd.js`, na `origin/main`; backend jar `2742e66e` LIVE na cusma2 16:11 UTC); tag `live/2026-11-11-payments-report`; cusma1 `html.prev` = `index-DPXpoEgC.js`

- Stranica „Payments“ (`/custom-payments`), iznad kartica: blok `AccountingReport` — „Ovaj mjesec“ / „Prošli mjesec“ ili raspon Od–Do (zadano: ovaj mjesec do danas), gumb „Preuzmi PDF“ → `GET /admin/payments-report?from&to` (blob) → `boat4you-uplate-<od>-<do>.pdf`.
- Raspon najviše 366 dana razlike (backend prima do 367 dana); kod neispravnog raspona gumb je onemogućen i ispod piše zašto („Do“ prije „Od“ / najviše godinu dana). Greška poziva → toast.
- Napomena u modalu „Details“: isplate na bankovni račun su u PDF-u za knjigovodstvo. en + hr, `resources.d.ts` regeneriran.
- **Provjereno:** tsc 0, eslint 0 grešaka; lokalno s lažnim API-jem (poziv s točnim datumima, ime datoteke, poruke za neispravan raspon, 375 px bez vodoravnog pomaka); uživo: entry `index-CSoScuJd.js`, blok se prikazuje prijavljenom adminu, a poziv s pravom prijavom vraća 200 `application/pdf` (studeni, listopad, 12 mjeseci) i 400 za neispravan raspon. **Nije provjereno:** sam klik na „Preuzmi PDF“ u produkciji (spremanje datoteke je ostavljeno Mariju).

## 2026-11-11 — 📰 PR stranica vraćena u admin (PR #8 spojen u main) — ✅ LIVE 11.11.2026 14:25 UTC (`20b7795`, `assets/index-DPXpoEgC.js`; cusma1 staging → test → swap, VERIFIED live == new, root/deep/asset 200, `/pr` `/pr/pitches` `/call-center/calls` `/custom-payments` 200); tag `live/2026-11-11-admin-pr`; cusma1 `html.prev` = `index-DGd41m3N.js`

- Od 10.11. 16:22 UTC (deploy Plaćanja s `origin/main`) do 11.11. 14:25 UTC PR stranice nije bilo u produkcijskom adminu: admin dio PR modula (PR #8) nije bio u mainu, a admin se od 10.11. gradi s maina. Backend nije pogođen (PR #21 u mainu od 11.11., V9_121 u živom jaru); slanje novinarima i dalje isključeno (`PR_MAIL_ENABLED=false`).
- Marketing izbornik: … Objave, Call centar, PR (kod spajanja sukob s Call centrom na istim mjestima, zadržano oboje).
- Main sada nosi PR modul: svaki sljedeći admin build s maina ga ima, release worktree za PR više ne treba.
- Provjere na `20b7795` (čisti worktree): `yarn lint:base` 0 grešaka, `yarn build` OK, `yarn test` 143/143. Klik-provjera prijavljenog admina nije rađena (prijava je Marijeva).

## 2026-11-11 — 📞 Call centar (AI call centar „Nika“): pozivi s transkriptom i snimkom, upiti, postavke — ✅ LIVE 11.11.2026 14:04 UTC (`b5e02bd`, `assets/index-DGd41m3N.js`, na `origin/main`; backend `/admin/calls/**` uživo od 11.11.)

- Nova stavka izbornika „Call centar“ u Marketing prostoru (SYSTEM_ADMIN), rute `/call-center/calls`, `/call-center/calls/:id`, `/call-center/inquiries`, `/call-center/settings`; `/call-center` preusmjerava na Pozive. `utils/workspace.ts` + test.
- **Pozivi:** filtri status / ishod / vrsta / stranica / datum, pretraga, straničenje (Spring `PagedModel`). **Detalj:** sažetak, cijeli transkript s vremenima (samo tekstualni čvorovi), snimka (blob kroz axios zbog JWT-a, učitava se na klik), prikupljeni podaci, kriteriji kvalitete, tehnički podaci, upit, svi pozivi istog upita, „Označi riješeno“ za zadatak.
- **Upiti:** privola, zadnji i sljedeći poziv; radnje „Nazovi sad“ (409 → razlog odbijanja), „Nazvat ću sam“, „Ponuda poslana“ (rečenica o ponudi), „Ne zvati“.
- **Postavke:** `calls.*`; šalju se samo promijenjene vrijednosti, broj za prebacivanje stiže maskiran i piše se samo kad se upiše novi; uključivanje poziva traži potvrdu.
- Gotcha: `nsSeparator` je `.`, pa je grupa prijevoda nazvana `inq` (ključ `inquiries.x` čitao bi namespace `inquiries`).
- **Provjereno:** tsc 0, eslint 0 grešaka, 117 testova, build; lokalno s lažnim API-jem sve tri kartice i detalj; uživo entry `index-DGd41m3N.js`, chunk sadrži `/admin/calls`, duboka ruta 200. **Nije provjereno:** s pravom prijavom u produkcijski admin na živim pozivima (Mario).

## 2026-11-11 — 💳 Plaćanja: stupac „Mollie naknada“ (naknada + neto) u obje liste — ✅ LIVE 11.11.2026 12:27 UTC (`003269f`, `assets/index-5mJOC7J8.js`, na `origin/main`; backend `928cfa03` LIVE 12:15 UTC)

- Obje kartice stranice „Payments“ (`BookingPaymentsTab`, `LinkPaymentsTab`): novi stupac iza iznosa, `FeeNetCell` u `paymentsShared.tsx` — naknada, ispod „Net / Neto“; „—“ kad backend ne pošalje `feeMinor`/`netMinor` (nema Mollie organizacijskog tokena, uplata još nije proknjižena, ili stariji backend).
- Modeli `feeMinor?`, `netMinor?` (centi; neto = iznos − naknada, povrati se ne oduzimaju). Napomena u modalu „Details“ sada kaže da su naknada i neto na popisu, a isplate u Mollie nadzornoj ploči. en + hr, `resources.d.ts` regeneriran (+ prettier).
- **Provjereno:** tsc 0, eslint 0 grešaka; lokalno s lažnim API-jem obje kartice (red s naknadom „€94.50 / Net €5,155.50“, ostali „—“); uživo bundle sadrži „Mollie fee“ / „Mollie naknada“. **Nije provjereno:** s pravom prijavom u produkcijski admin (Mario) i s pravom naknadom (čeka token `MOLLIE_ORG_TOKEN`).

## 2026-11-10 — 💳 Plaćanja (Mollie): kartične uplate rezervacija + link za plaćanje na jednoj stranici, Mollie detalji, način plaćanja rate na bookingu — ✅ LIVE 10.11.2026 16:22 UTC (`d7068a2`, `assets/index-ChDPTs1s.js`, na `origin/main`; backend jar bbfa0e13 na cusma2 16:21 UTC). Oznaka „Klarna“ na popisima i na rezervaciji: ✅ LIVE 20:12 UTC (`cf8b9f2`, `assets/index-D2kqL0qF.js`, backend jar e20302a4).

- `/custom-payments` (ruta i mjesto u izborniku Chartera ista) → naslov i izbornik „Payments / Plaćanja“, dvije kartice u `?tab=bookings|link` (zadano `bookings`; stari link iz ured-maila `?q=<ref>` bez `tab` otvara karticu link).
- „Booking payments / Uplate rezervacija“: `GET /admin/card-payments` — filtri Sve / Plaćeno / Otvoreno (PENDING+SUPERSEDED) / Nije plaćeno (FAILED+CANCELLED) / Treba provjeru, pretraga, straničenje, „Total received“; stupci datum (+ plaćeno), booking (link na detalj), klijent (mailto/tel), iznos (rata + naknada za karticu), status + oznake (povrat, chargeback, „Booking not confirmed“ kad promoteState=FAILED, reviewReason), Mollie link, Details, Refresh (`POST /admin/card-payments/{id}/refresh`).
- „Payment link / Link za plaćanje“: postojeća lista nepromijenjena + „Details“.
- Modal „Details“ (obje kartice + booking): `GET /admin/mollie-payments/{id}` uživo — status, kartica, regija naknade, iznosi, vremena, greška, povrati, chargebackovi, napomena da su naknada i neto isplata u Mollie dashboardu, „Open in Mollie“.
- Booking detalj: plaćena rata pokazuje „Card · Mollie“ + tr_ link ili „Card · Stripe“ + pi_ id; ispod rata kartica „Card payments“ (`?reservationId=&size=50`), skrivena kad nema redaka ili zahtjev padne. Model rate: `paymentProvider`, `providerPaymentId`.
- Tekstovi samo za Stripe → neutralno (CancelBookingModal, CreateReservationModal). en + hr, `resources.d.ts` regeneriran.
- ⛔ Ovisnost: backend `feat/mollie-payments` s `/admin/card-payments`, `/admin/card-payments/{id}/refresh`, `/admin/mollie-payments/{id}` mora biti LIVE PRIJE ovog admina (inače kartica Booking payments i Details pokazuju grešku učitavanja).
- Provjere: `yarn lint` 0 grešaka, `tsc --noEmit` 0, `yarn build` OK, `yarn test` 0 fail. Nije otvoreno u pregledniku protiv backenda.

## 2026-11-10 — 💳 Custom payments: lista kartičnih uplata s tajnog `/pay` linka (Mollie) — ⏳ NIJE DEPLOYANO (grana `feat/mollie-payments`, čeka Mariovo „da“; backend PRVI)

Stranica `/custom-payments` (iza Invoices, isti pristup): datum, sajt, broj ugovora (+ link na booking kad odgovara web rezervaciji), iznos umanjen za povrate, status, e-mail platitelja, „Mollie payment“ (link na my.mollie.com), bilješka. Filtri po statusu i sajtu, pretraga, „Refresh from Mollie“ po retku, zbroj primljenog. Backend `GET /admin/custom-payments`, `PATCH …/note`, `POST …/refresh` (boat4you-backend `feat/mollie-payments`). en + hr. `yarn lint` 0 grešaka, `tsc` čist. Nije otvoreno u pregledniku protiv backenda.

## 2026-11-05 — 📰 PR modul: nova stavka izbornika **PR** u radnom prostoru Marketing, iza Objava (`/pr`, samo SYSTEM_ADMIN) — mediji i novinari, istraživanja, pitchevi 1:1 s press@boat4you.com, objave i provjera linkova, spominjanja — ✅ LIVE 5.11.2026 13:08 UTC `index-D1xktjrT.js` (`28c7bfe` = `feat/pr-module` + main `2a330a0`, build iz `wt-pr-release`, VERIFIED live == new, root/deep/asset 200, `/pr` 200); backend V9_121 LIVE oba čvora 13:08/13:09 UTC (backend DEPLOY_NOTES); **slanje ISKLJUČENO** (`PR_MAIL_ENABLED=false`, press@ lozinka još nije upisana). PR admin #8 otvoren, nije mergean. Rollback: cusma1 `html.prev` swap.

Mario 4.11.2026 (program digitalnog PR-a, `DIGITAL-PR-PROGRAM-2026-11.md`; plan `infra/docs/superpowers/plans/2026-11-04-pr-module.md`). Backend: boat4you-backend DEPLOY_NOTES, unos 2026-11-05 PR modul (redoslijed deploya i rollback su tamo).

- Kartice (`src/views/Pr/`): **Pregled** (po istraživanju poslano / odgovori / objavljeno / objave; živi linkovi follow i nofollow, upozorenja, nova i nepovezana spominjanja, follow-upovi na redu), **Mediji i kontakti** (popis s filterima, kontakt s izvorom adrese, uvoz CSV-a, odjava i povrat), **Istraživanja**, **Pitchevi** (nacrt iz predloška, uređivanje, odluka „smije li se poslati“ po pitchu s razlogom blokade, gumb **Pošalji** samo kad backend kaže da smije, follow-up, ručni status odgovora), **Objave i linkovi** (provjera linka, upozorenja, „očisti upozorenje“), **Spominjanja** (RSS feedovi Google Alerts / Talkwalker; status novo / zamoliti za link / zamoljeno / povezano / ignorirano).
- Završni pregled (5.11., backend R42/R44/R46): nova oznaka blokade `FOLLOWUP_PARENT_ANSWERED` (follow-up se ne šalje kad je glavni pitch već odgovoren); kod ručnog statusa **DECLINED** kvačica „Odjavi ovu adresu — ne šalji joj više“ (zadano uključena), kod **REPLIED** ista kvačica isključena, ostali statusi je nemaju (`optOutDefaultFor`); u novom nacrtu predložak **Molba za pristanak** nema polje istraživanja (`templateTakesStudy`); poruka kad slanje ne vrati odgovor (prekid veze, 504) sad kaže „ishod nije poznat — provjeri popis i kopiju u press@ prije ičega drugog“, a popis se ponovno učita.
- Podnožje maila prikazuje se iz `dto.footer` (jedan izvor istine u backendu, R10); korisnik ga ne piše.
- `src/services/pr.api.ts` + `pr.service.ts`, tipovi `src/types/pr.type.ts`, pomoćne funkcije `src/utils/pr/format.ts`, ruta i izbornik (`AppRouter.tsx`, `navigation.config.ts`, `accessLevel` SYSTEM_ADMIN; `/pr` dodan u Marketing u `utils/workspace.ts`), prijevodi `locales/{en,hr}/pr.json` + `navigation.json`, `@types/resources.d.ts` regeneriran.
- Provjere (5.11.): `yarn lint:base` 0 grešaka (19 starih upozorenja, nijedno u PR datotekama), `yarn build` OK (tsc + vite), `yarn test` **119/119** (novo `tests/pr.test.ts`, 24); nakon završnog pregleda **121/121** (tests/pr.test.ts 26). Lokalni pregled u pregledniku nije rađen (R12): zamjenjuje ga klik-provjera u prod adminu s `PR_MAIL_ENABLED=false` (korak 6 backend popisa).

Deploy (**svaki korak tek uz Marijevo izričito „da“**; puni popis u backend DEPLOY_NOTES):

**Prije prvog maila bilo kojem novinaru** (ne vezano uz ovaj admin deploy, ali isti modul): /press/privacy live, **pravnik je potvrdio tablicu zemalja** (`DIGITAL-PR-PROGRAM-2026-11.md` §9; odluka §14 „Još otvoreno“ 1 je još otvorena), **LIA (procjena legitimnog interesa) dokumentirana**, i Marijevo izričito „da“. Detalji u backend DEPLOY_NOTES (preduvjeti iznad koraka 0).

- [ ] Izvor builda (backend korak 0): lokalni `boat4you-admin-main` je zastario (nema Objave ni CC AI filtar), `admin_deploy.sh` bez `ADMIN_REPO` gradi njega. Čisti release worktree iz `feat/pr-module` spojene sa svježim `origin/main`: `git -C /Users/mariokuzmanic/Downloads/boat4you-delivery/boat4you-admin/wt-pr fetch origin && git -C /Users/mariokuzmanic/Downloads/boat4you-delivery/boat4you-admin/wt-pr worktree add -b deploy/pr-module /Users/mariokuzmanic/Downloads/boat4you-delivery/boat4you-admin/wt-pr-release feat/pr-module && git -C /Users/mariokuzmanic/Downloads/boat4you-delivery/boat4you-admin/wt-pr-release merge --no-edit origin/main && (cd /Users/mariokuzmanic/Downloads/boat4you-delivery/boat4you-admin/wt-pr-release && yarn install --frozen-lockfile && yarn lint:base && yarn build && yarn test)`; sukob = stop.
- [ ] Backend s V9_121 live na cusma2 (koraci 1–4 backend popisa).
- [ ] Admin: `ADMIN_REPO=/Users/mariokuzmanic/Downloads/boat4you-delivery/boat4you-admin/wt-pr-release bash /Users/mariokuzmanic/Downloads/boat4you-delivery/infra/deploy-scripts/admin_deploy.sh` (cusma1 staging → test → swap), root/deep (`/pr`, `/pr/pitches`)/asset 200.
- [ ] Klik-provjera u prod adminu s `PR_MAIL_ENABLED=false`: uvoz kontakata s 2 testna retka = Marijeve vlastite adrese, Gmail i Outlook (jedan s tržištem `DE`), istraživanje, nacrt; DE nacrt pokazuje blokadu i **Pošalji** je onemogućen; slanje odbijeno s `MAIL_DISABLED`.
- [ ] SPA drži stari JS do reloada: hard reload ako stavka PR nije u izborniku.

Rollback: cusma1 `html.prev` swap (backend `/admin/pr/**` može ostati; bez admina se jednostavno ne koristi).

## 2026-11-05 — 🧭 Marketing izbornik: Live posjetitelji kao vlastita stavka iza Statistike — ✅ LIVE 5.11.2026 09:32:14 UTC (main `f692175`, `assets/index-CYR0i_FP.js`; cusma1 staging → test → swap, root/deep/asset 200); tag `live/2026-11-05-admin-live-visitors`; cusma1 `html.prev` = `index-DU51y147.js`

Mario 5.11.2026: „izbaci vanka nakon statistics i live visitors“. Redoslijed Marketinga: Statistika, Live posjetitelji, Kontakt centar, Heatmape, Objave.

- `navigation.config.ts`: stavka `live` (`/contact-center/live`, SYSTEM_ADMIN) između `stats` i `contactCenter`; ruta nepromijenjena.
- `ContactCenter.tsx`: kartice Kontakt centra = Razgovori, Kontakti; `live` u `STANDALONE` → vlastiti naslov „Live visitors / Live posjetitelji“ bez trake kartica (isti obrazac kao Statistika i Heatmape).
- Prijevodi `navigation.live` en/hr; `resources.d.ts`; test `activeNavId`: `/contact-center/live` pali Live posjetitelje, `/contact-center/contacts/12` Kontakt centar.
- Provjere: eslint 0 grešaka, tsc 0, `yarn test` 117/117; dev preview + mock (1100 px): redoslijed i aktivna stavka, naslov, skrivena traka, 0 grešaka u konzoli. Neovisni pregled (Opus 5.5 high): 0 blokera, 0 should-fix, komentar dopunjen (`f692175`). Deploy 20 min nakon prethodnog (09:11 → 09:32).
- Rollback: cusma1 `html.prev` swap.

## 2026-11-05 — 🧭 Marketing izbornik: Statistika, Kontakt centar, Heatmape, Objave; preklopnik Charter | Marketing fiksno lijevo uz logo — ✅ LIVE 5.11.2026 09:11:40 UTC (main `e60ea46`, `assets/index-DU51y147.js` + `vendor-react-fBTcQOt-.js` + `vendor-mui-Bo47_LVX.js`; cusma1 staging → test → swap, root/deep/asset 200); tag `live/2026-11-05-admin-marketing-menu`; cusma1 `html.prev` = `index-D761iugy.js`

Mario 5.11.2026: „u marketingu stavi statistics vanka contact centra i heatmaps isto da bude redoslijed Statistics, contact center, heatmaps, social posts i onda ce tu jos ici call center i backlinks“ + „charter marketing selection … na desktopu fixan lijevo do broker desk“.

- `navigation.config.ts`: Marketing stavke `stats` (`/contact-center/stats`), `contactCenter`, `heatmaps` (`/contact-center/recording`), `social`, tim redom; Charter stavke nepromijenjene. Rute, player (`/contact-center/recording/:id`), lista i postavke ostaju na starim URL-ovima.
- `ContactCenter.tsx`: kartice Kontakt centra su sada Razgovori, Live posjetitelji, Kontakti; na `/stats` i `/recording/*` stranica nosi vlastiti naslov (Statistika / Heatmape) bez trake kartica Kontakt centra. `TabKey`/`tabOf` nepromijenjeni.
- `Header.tsx`: aktivna je stavka čija je putanja najdulji prefiks rute (`utils/workspace.ts` `activeNavId`, 3 nova testa → 117/117), `aria-current` po istom pravilu; preklopnik Charter | Marketing u lijevoj ćeliji uz logo (desktop), ladica na mobitelu zadržava svoj; desktop nav `justify-content: safe center` (7 stavki Chartera na ≤ 1280 px bilo odrezano slijeva, stari nalaz iz pregleda). Nav je sada ~65–90 px desno od sredine ekrana (prihvaćeno, Mario tražio preklopnik lijevo).
- Prijevodi `navigation.stats` / `navigation.heatmaps` en/hr; `resources.d.ts` regeneriran + prettier.
- Provjere: eslint 0 grešaka, tsc 0, `yarn test` 117/117; dev preview + mock API (mock dopunjen `/admin/cc/search-engines`, inače Statistika pada na `clicks` — mock, ne kod): redoslijed i aktivna stavka na `/contact-center`, `/stats`, `/recording`; naslovi i skrivena traka; mobilna ladica 375 px (preklopnik + 4 stavke). Neovisni pregled (Opus 5.5 high): 0 blokera, 1 should-fix (odrezan nav, ugrađen), 1 prihvaćena sitnica (nav nije centriran na ekran). ⚠️ Deploy 12 min nakon prethodnog admin deploya (pravilo ≥ 20 min nije ispoštovano; statični swap, bez posljedica). Hash vendor chunkova se ipak promijenio jer se skup korištenih exporta (NavLink → Link) promijenio — ostaje stabilan samo dok se taj skup ne mijenja.
- Rollback: cusma1 `html.prev` swap.

## 2026-11-05 — 🧭 Dva radna prostora u adminu: Charter | Marketing preklopnik u zaglavlju, izbornik po ruti, pamćenje zadnjeg prostora — ✅ LIVE 5.11.2026 08:59:14 UTC (main `338300d`, `assets/index-D761iugy.js` + `vendor-react-BuOHRuzn.js` + `vendor-mui-DfU2p158.js`; cusma1 staging → test → swap, root/deep/asset 200, `localhost:8443` u dist 0); tag `live/2026-11-05-admin-workspaces`; cusma1 `html.prev` = `index-DgMcCIDC.js`

Mario 5.11.2026 („Marketing i charter neka se zovu, kreni“), nakon mjerenja opterećenja (admin + Kontakt centar + Objave = 1,6 % zahtjeva API-ja, 0,5 % baze → lokalna aplikacija nema smisla, podjela admina ima).

- Charter = Rezervacije, Ponude, Korisnici, Računi, Prilagođeni brodovi, Brodovi · Mediji, Agencije; Marketing = Kontakt centar, Objave (kasnije backlinkovi, call centar: novu rutu dodati u `src/utils/workspace.ts` `PREFIXES`; `tests/workspace.test.ts` pada ako stavka izbornika nije ni u jednom prostoru).
- Ruta odlučuje prostor (`workspaceForPath`), svi postojeći URL-ovi nepromijenjeni; neutralne rute (`/my-profile`, prijava, nepoznate) zadržavaju zadnji prostor. Zadnji prostor u `localStorage` `b4y-admin:workspace`; `/` (`routers/WorkspaceLanding.tsx`, čeka `authenticating`) i zadana ruta SYSTEM_ADMIN-a nakon prijave (`role-default-routes.config.ts` → `/`) vode na njegov dom (Charter → `/bookings`, Marketing → `/contact-center`). MANAGER ima samo Charter → bez preklopnika, uvijek `/bookings`; zapamćeni Marketing se za njega ignorira (nema 403).
- `Header.tsx`: stakleni segmentirani preklopnik (desktop nav + mobilna ladica, `renderWorkspaceSwitch`, obična funkcija da je pollovi ne remountaju), neaktivni prostor nosi svoj broj nepročitanih (chatovi), logo vodi na dom aktivnog prostora; pamti se samo kad je korisnik prijavljen i ruta pripada prostoru (stranica prijave ne pregazi). Prijevodi `navigation.workspace.*` en/hr; `resources.d.ts` regeneriran + prettier.
- `vite.config.ts` manualChunks: `vendor-react` (react, react-dom, react-router, scheduler + Rollupov commonjsHelpers) i `vendor-mui` (samo `@mui/material|system|styled-engine|utils|private-theming` + `@emotion`) → hash vendor chunkova preživljava deploy (povratni korisnik ne skida vendor ponovno). Trošak: JS prije prve stranice 283 KB gzip umjesto 240 (jednokratno po pregledniku); `vendor-react` ne uvozi ništa, `vendor-mui` uvozi samo `vendor-react` (bez kruga).
- Provjere: eslint 0 grešaka, tsc 0, `yarn test` 114/114 (19 novih: prefiksi, neutralne rute, pamćenje, blokirani storage, drift izbornika); produkcijski build + mock API (React bez StrictMode dupliranja): prijava → `/bookings`, hladno `/offers?x=1` ostaje, hladno `/social` → Marketing, `/my-profile` zadržava Marketing, `/` → `/contact-center`, odjava → prijava → `/contact-center`, mobilna ladica 375 px s preklopnikom (prebacivanje → `/contact-center`). Neovisni pregled (Opus 5.5 high): 0 blokera; 2 should-fix (pamćenje pregaženo na `/login`; preširok `@mui` regex + kružni uvoz) i 2 sitnice ugrađeni prije commita. ⚠️ Dev mod (StrictMode) dvaput pokrene `useAuth` efekt pa hladno učitavanje skoči na zadanu rutu; produkcijski build to nema (nije dirano).
- Rollback: cusma1 `html.prev` swap.

## 2026-11-05 — 🎬 Kontakt centar → Snimke: gumb Watch uvijek vidljiv, cijeli red otvara snimku, mobilni prikaz — ✅ LIVE 5.11.2026 08:01:07 UTC (main `fc2ea13`, `assets/index-DgMcCIDC.js`; cusma1 staging → test → swap, root/deep/asset 200, `localhost:8443`/`localhost:3000` u dist 0); tag `live/2026-11-05-cc-rec-list`

Mario 4.11.: „/contact-center/recording/list ne radi baš najbolje, blokaje, ne vidi se sve“; 5.11. 07:40 UTC „da“. Tablica (11 stupaca, URL do 320 px) bila je 1147 px u 976 px sadržaja na 1024 px → Chat i Watch izvan vidika iza neočitog vodoravnog scrolla; na 375 px samo Started/Site/Page.

- `Recordings/RecordingList.tsx`: zadnji stupac (Watch) `position: sticky; right: 0`, neprozirna pozadina, lijevi rub + sjena (i zaglavlje, `zIndex 2` iznad ljepljivog zaglavlja); donji rub ćelije kao box-shadow (collapsed border ne prati sticky ćeliju).
- Cijeli red otvara snimku (`className="click"` iz `tableSx` = hover + pointer, `tabIndex 0` + Enter, fokus obrub); gumb ostaje i ne okida dvaput (`stopPropagation`, Enter na gumbu red ignorira); označavanje teksta putanje mišem ne otvara red.
- < 600 px: stupci Site…Chat skriveni (`.wide`), u prvoj ćeliji složeno datum / sajt / putanja (`.narrow`), Watch desno → bez vodoravnog scrolla. Filtri, paginacija, `PAGE_SIZE`, servis i prijevodi nepromijenjeni.
- Provjere: eslint 0 grešaka, tsc 0, build OK; lokalni harness s mock redovima (1024: Watch desni rub 973 < 985 i nakon scrolla; 375: tablica = kontejner 327 px; klik reda / gumba / Enter = po jedan `onOpen`); LIVE s pravim podacima 1024 px: Watch u vidiku bez scrolla, 50 redova; 375 px: dokument 375, tablica 351 = kontejner; klik na red otvorio snimku 8532. Repo nema RTL/vitest uzorak (testovi su `node --test` čistih funkcija) → bez komponentnog testa. Neovisni pregled (Opus 5.5 high): 0 FIX FIRST; napomene o označavanju teksta i donjem rubu ugrađene (`fc2ea13`).
- Rollback: cusma1 `html.prev` swap (prethodno `index-D5pb23L-.js`).

## 2026-11-04 — 🤖 Kontakt centar → Statistika → lijevak: filtar kanala „AI asistenti (ChatGPT, Perplexity…)“ + oznaka kanala `AI` u Statistici, Posjetiteljima uživo i kartici klijenta — ✅ LIVE 4.11.2026 20:37:4x UTC (`2419032` = `feat/cc-ai-channel` `9e3455a` + main `9039e1b`, `assets/index-D5pb23L-.js`; cusma1 staging → test → swap, root/deep/asset 200); backend `VisitChannel.AI` na cusma2 od 19:55:46 i cusma3 od 20:16:39 UTC (jar 5a20132c, bez migracije); cusma1 `html.prev` = `index-BChUh6VF.js`

Mario 4.11.2026 („Da, kanal“): posjete iz AI odgovora do sada su padale u Referral. PR boat4you-admin#7; tsc 0, `npm test` 95/95, eslint 0 grešaka (19 starih upozorenja izvan ovih datoteka).

- `Stats/Funnel.tsx`: `CHANNELS` + `'AI'` (prije OTHER); bez backenda filtar vraća „unknown channel“ → jar prije admina.
- `locales/{en,hr}/contactCenter.json` `channel.AI` = „AI assistants (ChatGPT, Perplexity…)“ / „AI asistenti (ChatGPT, Perplexity…)“; `@types/resources.d.ts` regeneriran (`npm run i18next-resources-for-ts` + prettier).
- SPA drži stari JS do reloada — hard reload ako filtar nema novu stavku.
- Rollback: cusma1 `html.prev` swap.

## 2026-11-03 — 📣 Objave (Social publisher S0): jedna objava na više kanala, zakazivanje, ključevi za automatizaciju — ✅ LIVE 4.11.2026 18:52:57 UTC (`f588f28` = grana + main `31b50c8`, `assets/index-BChUh6VF.js`; cusma1 staging → test → swap, root/deep/asset 200), backend S1 na cusma2 od 18:30:23 UTC (jar d2efcc9a, V9_118); cusma1 `html.prev` = `index-D9rAwK_S.js`

Mario 3.11.2026: „alat s kojim ćemo moći objavljivati jednu objavu na više kanala, a s vremenom da Claude dnevno objavljuje preko Scheduled … sve inhouse i da ne plaćamo nikome“. Plan i API ugovor: `docs/superpowers/specs/2026-11-03-social-publisher-design.md`.

- Nova stavka izbornika **Objave** (`/social`, samo SYSTEM_ADMIN), odmah iza Kontakt centra. Kartice: **Objave** (mjesečni kalendar i popis po danima, filteri status/kanal, detalj objave sa stanjem po kanalu, link na objavu, greška mreže, ponovi neuspjele / otkaži zakazano / uredi / dupliciraj / obriši), **Nova objava** (tekst s brojačem po mreži, link, interna bilješka, fotke/video s napretkom i redoslijedom, odabir kanala, vlastiti tekst i naslov po kanalu, provjere pravila svake mreže dok pišeš, pregled po kanalu, Spremi skicu / Zakaži / Objavi odmah uz potvrdu), **Kanali** (10 mreža: Facebook, Instagram, Threads, LinkedIn, X, TikTok, YouTube, Pinterest, Bluesky, Google Business; spoji preko OAuth-a ili Bluesky app lozinke, odspoji, istek pristupa, „privatno do revizije“), **Automatizacija** (API ključevi, „samo skice“ zadano; primjer curl poziva i id-jevi kanala; opis dnevnog Claude zadatka).
- Pravila po mreži (`src/utils/social/rules.ts`): duljina teksta (X ponderirano, link = 23; Bluesky grafemi), obavezni mediji/video/naslov, broj fotki, miješanje fotki i videa, hashtagovi, omjer fotke za Instagram, `<` `>` na YouTubeu, neklikabilni linkovi (IG/TikTok).
- Backend: boat4you-backend grana `claude/blissful-wright-sn6a9f` (V9_118, `/admin/social/**`, `/api/social/v1/**`, objavljivač, AI dnevne objave, Higgsfield) — mora biti live prije admina.
- Dopuna 3.11. (Mario: „svaki web svoj Facebook, Instagram, TikTok; YouTube jedan; AI dnevne objave uz Higgsfield i naše slike“): kanal ima sajt (pregled sajt × mreža na Kanalima, promjena sajta po kanalu, „za koji sajt“ pri spajanju), Nova objava grupira kanale po sajtu, Objave filtriraju po sajtu i otvaraju `?post=ID`, novi tab **AI dnevne objave** (po sajtu: uključeno, vrijeme, jezik, kanali, odobrenje, Higgsfield video, napomene, „Napravi sada“, zadnje izvedbe). Upload medija je sirovi fajl (ne multipart, video do 500 MB).
- Provjere: `tsc` 0, eslint `src/` 0 grešaka, `yarn test` 85/85 (novo `tests/social.test.ts`, 31), `yarn build` OK (0× localhost:3000); lokalni pregled s lažnim API-jem (HR, 1440 i 390 px, bez horizontalnog skrola): kalendar, popis, detalj, objava s greškama po kanalu, zakazivanje, kanali, automatizacija. Nije viđeno protiv pravog backenda.

Deploy:

- [x] 4.11. 18:52:57 UTC, 22 min nakon backenda S1 na cusma2 (18:30:23 UTC): provjera u pregledniku s Mariovom prijavom — `/social` prazan kalendar studenog, Kanali: svaka mreža s razlogom iz backenda („Not set up on the server: Meta app not configured …“), Bluesky samo „Not connected“, X/Pinterest/Google Business „Not available yet“; konzola bez novih grešaka. ⚠️ Napomena: engleski UI, a opisi kanala (`Facebook stranica (Page) …`) hrvatski — provjeriti i18n ključeve opisa.
- [x] 4.11. 10:34 UTC nginx cusma2: `/admin/social/media` + `/api/social/v1/media` 512m, `proxy_request_buffering off` (infra `social_env_set.sh`).
- [ ] Developer aplikacije mreža (Meta, LinkedIn, Google, TikTok, Pinterest, X) — popis u specu, § „What Mario has to do“.

## 2026-11-04 — 🔥 Heatmape: karta se napokon VIDI — platno iznad iframea, ne u njemu — ✅ LIVE 4.11.2026 09:58:19 UTC (`cb35b60`, `assets/index-D9rAwK_S.js`; cusma1, `fix/heatmap-overlay` → main), tag `live/2026-11-04-cc-heatmap-overlay`

Mario 4.11.: „Uopće ne radi heatmap, znači pokazuje mi stranicu i to je to“; „Da, deployaj“.
- **Uzrok (od 3.11. 14:33):** karta se crtala na `canvas` unutar replay iframea (`sandbox="allow-same-origin"`, bez skripti). U dokumentu bez skripti `<canvas>` predstavlja fallback sadržaj: nema box (computed `width/height 0px`, rect 0×0) i bitmapa se nikad ne iscrta, ni uz CSS veličinu (crveni `fillRect` nevidljiv). Crtanje i `getImageData` rade, pa su sve provjere „obojenih px“ (3.11. 14:55, 4.11. 07:49) bile lažno zelene.
- **Popravak:** `replayEngine.heatCanvas()` stvara platno u admin dokumentu, u Box-u iframea (`position:relative`), apsolutno iznad njega s istim `transform: scale()`; `heatOverlayCss()` u `utils/contactCenter/heatmap.ts` (test); `HeatmapView` uklanja staro platno pri promjeni pozadine (`Replay.heatCanvasOf`). Vrijedi za Clicks, Scroll i Miš.
- **Provjere:** heatmap 10/10, suita 64/64, tsc 0, eslint 0 grešaka, build OK; simulacija sloja uživo u pregledniku prije deploya (mrlje na fotografiji i gumbu „Alle Fotos anzeigen“); provjera nakon deploya u ledgeru.
- **Rollback:** cusma1 `html.prev` = `assets/index-DWIzU6w7.js` (`3b8169c`).

## 2026-11-04 — 🖱️ Heatmape: treći prikaz „Miš“ (hover mapa, P6 R4) + P7a Top clicks (stranica, element, kamo vodi) — ✅ LIVE 4.11.2026 07:47:45 UTC (`5423883`, `assets/index-DWIzU6w7.js`), tag `live/2026-11-04-cc-rec-hover`

Mario 3.11.: „nama klijenti dolaze preko desktop, mobile i tablet tako da bi volio da imamo i mouse tracker“; „Da, kreni s R4“; „Da, sutra“ (deploy).
- **„Miš“** uz Clicks/Scroll: gdje miš najdulje stoji, po elementu (crveno = najdulje, plavo = najkraće); samo desktop, svaki boravak najviše 2 s (parkirani miš ne iskrivljuje kartu). Stupac „Mouse (s)“ u tablici elemenata, „Page views with a mouse“ u brojkama. Podnosi stariji backend (bez `hover` = prazna karta, bez greške; pregled #4/#5).
- Nosi i ADMIN-ov P7a Top clicks (`9bf7b30`, `a99898a`: stranica, element s vrstom, kamo vodi, broj stranica; galerija/slider/izbornik sklopljeni) — radi i sa starim backendom.
- **Backend R4** (hover redovi, `GET /admin/cc/rec/heatmap` s `hover`, V9_120): ✅ cusma2 LIVE 08:32:29 UTC (backend `a186f8c`, jar md5 da6c40dd540a53c534a88b3422bd7bb1); prvi pokušaj 07:45 stao na prijavi cusma3 → cusma2 (nestale `/tmp/.aud_pw*`, Mario upisao datoteku). Podaci za „Miš“ kreću tek nakon cusma3 (worker) u večernjem gate prozoru (18:07 UTC); prva čitljiva karta ~2 tjedna.
- **Provjera live 07:49 UTC (Claudeov preglednik, Mariova prijava):** entry `index-DWIzU6w7.js`; Boat4You Boat/mobile 30 d: Clicks i dalje crta (81.604 obojena px, platno 402×7680), „Miš“ bez novih grešaka u konzoli (samo stari `NotSupportedError` videa iz snimljene stranice), „Page views with a mouse: 0“ kako se i očekuje.
- Provjere prije deploya: yarn test 62/62, tsc 0 nakon merge-a origin/main `a99898a`; admin redoslijed ispred backenda = svjesna odluka (build podnosi stari backend, backend korak čeka lozinku).
- **Rollback:** cusma1 `html.prev` = `assets/index-Dp-6hNfq.js` (`28c34f2`).

## 2026-11-03 — 📊 Tražilice: tablica „Najčešći traženi pojmovi na Googleu“ — filtar ulazne stranice + sortiranje stupaca — ✅ LIVE 3.11.2026 22:50:32 UTC (`28c34f2`, `assets/index-Dp-6hNfq.js`)

Mario 3.11. (preko sesije ADMIN), „Da, pregled + deploy“. Backend `GET /admin/cc/search-engines/queries` LIVE na cusma2 22:50:05 UTC (backend main `e3e8eda`).
- Birač „Ulazna stranica“ (opcije = tablica Ulazne stranice, najviše ~60; putanje dulje od 1000 znakova izostavljene): samo Googleovi pojmovi te stranice.
- Klikovi / Pojavljivanja / CTR / Pozicija: `TableSortLabel` + `aria-sort`, drugi klik okreće smjer; pozicija počinje od najbolje. Sortira cijeli skup na backendu (top 50), CTR i pozicija samo pojmovi s ≥ 10 pojavljivanja (napomena ispod tablice).
- Zadano (klikovi, cijeli sajt) i dalje iz glavnog `/search-engines` odgovora; inače vlastiti zahtjev, odgovor označen ključem zahtjeva; neuspjeh = greška u kartici tablice, bez starih redova. Bing tablica nepromijenjena.
- Provjera uživo (prijavljeni preglednik): po pojavljivanjima prvi „saronic islands“ 21.206 / 1 klik; stranica „Boat4You /“ → 50 pojmova. Neovisni pregled (Opus): 0 blokera, should-fix popravljen u `28d51e2`.

## 2026-11-03 — 🔥 Heatmape: karta više ne nestaje (crtamo je sami) + točke se čitaju kao `ex`/`ey` — ✅ LIVE 3.11.2026 14:33 UTC (`a61c434`, `assets/index-DQa7fVTS.js`) i 14:53 UTC (`34ef98b`, `assets/index-D51SXnvk.js`; cusma1, `fix/heatmap-draw` → main), tag `live/2026-11-03-cc-heatmap-draw`

Mario 3.11.2026: „gledam heatmap preko računala, pojavi se pa nestane odmah“; „vidi home mobile, stvori se di su klikovi bili pa nestane“; „Da, deployaj“.

- **Uzrok:** clarity-visualize nakon prvog crtanja sam ponovno crta kartu klikova pri svakoj promjeni veličine stranice u podlozi (ResizeObserver, u petlji: „ResizeObserver loop completed…“ u konzoli) i pri tome zadrži samo elemente koje njegov `visible()` (elementsFromPoint) prihvati — na stvarnim stranicama gotovo nijedan, pa karta ostane prazna (reproducirano u Claudeovom pregledniku s Mariovom prijavom: canvas klikova 0 obojenih px, scroll mapa 5,7 M).
- **Popravak:** `Replay.clickmap` i `Replay.scrollmap` crtaju sami, jednom, na jedan canvas preko cijele stranice (`b4y-heat-canvas`, bez promatrača): točke svakog elementa koji je u layoutu (i ako ga nešto prekriva), meki diskovi obojeni plavo→crveno po gustoći; scroll gradijent s foldom i 75/50/25 %. Čisti dio `heatPoints()` ima node test.
- Provjera: testovi 60/60, tsc 0, eslint 0 grešaka; harness 13.808 px i isto nakon rasta stranice; live u pregledniku nakon deploya (vidi ledger).
- **Pravi uzrok (drugi deploy 14:53):** backend šalje `HeatPoint.eX/eY` kao `ex`/`ey` (Jackson tako imenuje Kotlin `eX`), a admin je čitao `eX`/`eY` → svaka stvarna točka bila je NaN: stara biblioteka ju je tiho ispustila (R3 karta je prikazivala samo sredine elemenata, pa ih brisala), naše crtanje je bacilo grešku u `createRadialGradient`. `toActivity` čita oba zapisa, `heatPoints` preskače ne-konačne vrijednosti; backend od R4 šalje `eX`/`eY` (`@JsonProperty`).
- Provjera live 14:55 UTC (Claudeov preglednik, Mariova prijava): Home/mobile 9.918 obojenih px, isto nakon 18 s; bez grešaka u konzoli.
- Grana je od živog maina `722a9be` (ADMIN: trajna prijava, PWA), pa ništa njihovo nije vraćeno.

## 3.11.2026 — admin installable on the phone (PWA) (a5f6d73)

- `public/manifest.json` (Boat4You Admin / B4Y Admin, start `/bookings`, standalone, navy theme), maskable 192/512 icons, full-bleed yellow `apple-touch-icon` (`?v=4`), iOS/Android web-app meta in `index.html`. Old placeholder `favicons/site.webmanifest` removed. No service worker (nothing cached, deploys show at once).
- Live on cusma1; manifest served as application/json, icons 200.

## 3.11.2026 — admin stays signed in across reloads; Live visitors source chip (730eec2)

- `src/config/tokenStore.ts`: access + refresh token JSON now persisted in localStorage (`b4y-admin-auth`), so a reload / new tab / browser restart keeps the session. Ends when the backend refresh token expires (3 days from login, `security.jwt.refresh-token.expiration`) or on Log out. Reverses the in-memory choice of S-002 (Mario's call).
- Live visitors: the "from site" under Source is a coloured SiteChip.
- Deployed to cusma1, entry `assets/index-BkXAuIsR.js`, root/deep/asset 200.

## 2026-11-03 — 📊 Kontakt centar → Statistika: „Tražilice: Google i Bing“ (F1) — ✅ LIVE 3.11.2026 13:24:50 UTC (cusma1, main `7664113` = grana `feat/cc-search-engines` `e55a2bf`, entry `assets/index-DWw8CtqE.js`, root/deep/asset 200)

Mario 3.11.: „Da, kreni s F1“, „Da, deployaj“. Backend `GET /admin/cc/search-engines` live na cusma2 13:24:22 UTC (V9_119); podatke puni SearchImportJob na cusma3 (od cusma3 deploya 18:07 UTC; prvi uvoz povijesti ~16 h).
- Nova sekcija ispod lijevka, isti raspon i sajt kao ostatak Statistike, vlastiti filter zemlje i uređaja (uz njih Bing nestaje: nema zemlju ni uređaj). KPI Google/Bing uz naše organske posjete i upite iz njih, posjeti po tražilici, tablica po sajtu, top traženi pojmovi (Google, Bing), ulazne stranice s 3 glavna pojma.
- Napomena: samo zbirne brojke, kašnjenje 2–3 dana (zadnji uvezeni dan), udio klikova kojima Google skriva pojam; prije prvog uvoza „—“ i rečenica o 16 h.
- Kanal ORGANIC sada „Tražilice (organski)“ (bio „Google (organski)“, a uvijek je uključivao i Bing i ostale).
- Provjere: tsc 0, eslint 0 grešaka (15 starih upozorenja drugdje), `yarn test` 59/59, `vite build` OK; lokalno s mock API-jem i pravim GSC podacima (hr/en, filter zemlje šalje `country=US`, prazno stanje, 390 px bez horizontalnog skrola). Pravi backend s podacima još nije viđen (čeka cusma3 import).

## 2026-11-03 — 🔥 Kontakt centar → Heatmape i „Što popraviti“ (P6 R3) — ✅ LIVE 3.11.2026 11:57 UTC (cusma1, grana `feat/cc-rec-r3` `9a559ab` → main, entry `assets/index-0HTRSdhK.js`, `HeatmapView-CZ3NybY3.js`, `Player-v7GejlKY.js`, `decode.worker-D1BoRNkW.js`), tag `live/2026-11-03-cc-rec-heatmaps`

Mario 3.11.2026 („kreni sa izgradnjim“, „Da, deployaj R3“): cilj su heatmape (gdje se najviše i najmanje klika, greške u dizajnu, što dodati za više upita i rezervacija), ne gledanje pojedinih snimki.

- Kartica „Heatmape“ (`/contact-center/recording`): sajt, uređaj (zadano mobitel), vrsta stranice (s brojem pregleda), 7/30/90 dana, klikovi ili scroll. Podloga = najnovija snimka te skupine nacrtana na 3 s, cijela visina; sekcije visine ekrana (vh/svh) ostaju kakve su bile na snimljenom ekranu. Iznad: pregledi, klikovi, upiti, fold, doseg 50/75/100 %. Ispod: koliki je udio klikova na slici (ostali su na izbornicima i prozorima koji se pojave kasnije) i tablica elemenata (najviše/najmanje klikani, % pregleda, mrtvi i bijesni klikovi, udio upita, link). „Snimke ove stranice“ vodi na popis.
- „Što popraviti“ (`/contact-center/recording/insights`): kartice DEAD, RAGE, INQUIRY_ELEMENT, CTA_REACH (imenuje gumb), LOW_REACH, najgore prvo, s „Otvori heatmapu“. Treba barem 20 pregleda po vrsti stranice.
- Popis snimki i player su sada `/contact-center/recording/list` i `/list/:id`; postavke ostaju `/settings`.
- Provjera: testovi 59/59, tsc 0, eslint 0 grešaka; harness (spike fikstura, sandbox + inert): clickmap 13,8k px na vidljivim elementima, scrollmap cijela stranica, sekcija 78vh ostaje 0,78 ekrana. Završni pregled (Opus): 0 kritičnih; I7 (vh) i podignuti M1 (stara podloga u novom okviru) popravljeni.
- Backend: API R3 na cusma2 od 11:36 UTC (vidi backend DEPLOY_NOTES); worker za mrtve klikove kreće s cusma3 deployem 18:07 UTC (BOAT4YOU 3, jar 5c32cbd).

## 2026-11-03 — 🎬 Kontakt centar → Snimke: popis snimki i player (P6 R2) — ✅ LIVE 3.11.2026 09:13 UTC (cusma1, main `3f64802`, entry `assets/index-PS7NtQJP.js`, player `Player-BbQHCEHy.js` 802 kB lijeno, `decode.worker-D1BoRNkW.js`), tag `live/2026-11-03-cc-rec-player`

Mario 3.11.2026 („Da, kreni s R2“, „da“).

- Kartica „Snimke“ (`/contact-center/recording`): popis zatvorenih snimki s filtrima (danas/7/30 dana, sajt, uređaj, vrsta stranice, samo s bijesnim klikovima, samo bez upita), trajanje, klikovi, bijesni klikovi, greške, upit, chat; „Pogledaj“ → player (`/contact-center/recording/:id`). Postavke snimanja (R1) su sada `/contact-center/recording/settings`.
- Player: iframe `sandbox="allow-same-origin"` + `inert` (snimka ne izvršava ništa i ne prima klikove), dekodiranje u Web Workeru (clarity-decode/visualize/js 0.8.73 kroz `resolutions`), pokreni/pauza, 1–8×, preskakanje neaktivnosti, premotavanje (red sa zadnjim ciljem), oznake klikova, bijesnih klikova i grešaka, stranice istog posjeta. Stilovi iz arhive `/replay-assets/` (cusma1 proxy), `srcset` i `url()` slika prepisani na sajt.
- U razgovoru: „Snimke ovog posjeta“ kad posjet ima snimku.
- Poruke: snimka obrisana (60 dana) / spremište ne odgovara; nakon deploya admina zastarjeli paket playera jednom osvježi stranicu.
- Provjera: test-stranica s CSP-om admina na fiksturama spikea — ubačeni inline handler izvrši se samo bez CSP-a i bez sandboxa; premotavanje 615 s snimke ≤ 400 ms. Testovi 54/54; završni pregled (Opus): 0 kritičnih, 2 važna (+3 podignuta) popravljena testom.

## 2026-11-03 — 🎨 Kontakt centar: boja po sajtu na oznaci sajta — ✅ DEPLOYANO 3.11.2026 (cusma1, main `bd17634`, entry `assets/index-v4APSc8V.js`)

Mario 3.11.2026. `SiteChip` (common.tsx): Boat4You plava, Catamaran Croatia crvena, Greece nebesko plava, Italy zelena, Caribbean narančasta, Europe Yachts ljubičasta, Croatia Yachting ružičasta; nepoznati sajt ostaje sivi obrub. Vrijedi u popisu, razgovoru, povijesti navigacije i Live posjetiteljima.

## 2026-11-03 — 🅱️ Admin logo vraćen na žuto (žuti favikon) — ✅ DEPLOYANO 3.11.2026 (cusma1, main `440909b`, entry `assets/index-EGLXedaN.js`)

Mario 3.11.2026: „ostavi admin, da bude žuta pozadina i stavi žuti favicon“. Revert `922a79d`: BrandMark žuti krug + navy slovo, favikoni žuti. Plava verzija ostaje samo u paketu logotipa (`_design/Boat4You logo B/`).

## 2026-11-03 — 🅱️ Logo B u plavoj boji boat4you.com, bijelo slovo — ✅ DEPLOYANO 3.11.2026 (cusma1, main `922a79d`, entry `assets/index-DSonKHtR.js`)

Mario 3.11.2026: pozadina kao hero na boat4you.com (gradijent #1F35D0 → #1722B6 → #19238F), bijelo B. `BrandMark` (gradijent s id-em po instanci) + favikoni. Svi formati: `_design/Boat4You logo B/` (+ `~/Downloads/Boat4You logo B.zip`).

## 2026-11-03 — 🅱️ Novi logo „B“ umjesto „B4“ — ✅ DEPLOYANO 3.11.2026 (cusma1, main `8aa877d`, entry `assets/index-EGLXedaN.js`)

Mario 3.11.2026: okrugli logo B (jedro + trup u brojaču), žuta pozadina, navy slovo. Komponenta `src/components/BrandMark` (inline SVG) u headeru i AuthShell (3 mjesta); favikoni admina (`public/favicons/*`) iz istog znaka. Izvorni SVG/PNG/ICO u `_design/logo-b` (delivery repo, nije u gitu). Verifikacija: root/deep/asset 200, live == new.

## 2026-11-01 — 🎥 Kontakt centar → Snimanje: prekidač i udio snimanja po sajtu, linkovi za oznaku tima (P6 R1) — ✅ LIVE 1.11.2026 11:15 UTC (cusma1, main `0466541`, entry `assets/index-fD2q2GFs.js`), tag `live/2026-11-01-cc-rec`

Mario 1.11.2026 („Da, nastavi R1“, „Da, deployaj R1“).

- Kartica „Snimanje“ (`/contact-center` → recording): po sajtu uključeno/isključeno, postotak posjeta (računalo) i mobitel (0–100), `GET/PUT /admin/cc/rec/settings` (SYSTEM_ADMIN). Bez spremljenog reda sajt je isključen.
- Linkovi „Označi ovaj preglednik kao tim“ (`https://<sajt>/?cc-staff=1` za svih 7): widget taj preglednik ne prati ni ne snima.
- Provjera: živi paket poziva `admin/cc/rec/settings`; endpoint bez prijave 403.

## 2026-10-31 — 📉 Kontakt centar → Statistika: kartica „Lijevak upita“ (P6 R0) — ✅ LIVE 31.10.2026 09:51 UTC (cusma1, main `1e4151d`, entry `assets/index-VHei0SSJ.js`), tag `live/2026-10-31-cc-funnel`

Mario 30.10.2026 („Da, kreni s R0“) i 31.10. („Da, deployaj R0“): gdje posjetitelji s pristankom odustaju prije upita.

- Koraci posjet → stranica broda → obrazac upita ili rezervacije → poslan upit, svaki kao % posjeta i pad od prethodnog koraka; posjeti s otvorenim chatom.
- Gdje odlaze bez upita (po vrsti stranice) i tablica izlaznih stranica (sajt kad su odabrani svi sajtovi, stranica, vrsta, posjeti, izlazi, stopa izlaza); najčešći klikovi.
- Isti raspon i sajt kao ostatak Statistike; filteri uređaj i izvor samo za ovaj dio. Backend `GET /admin/cc/funnel` (backend `55abb80`, cusma2 09:11 UTC).
- `Stats/parts.tsx`: KPI kartice i trake izdvojene da ih dijele Statistika i lijevak; `utils/contactCenter/funnel.ts` (postoci, testovi u `yarn test`).
- Provjere: tsc 0, eslint src 0, `yarn test` 40/40, lokalni pregled s mock API-jem (filter uređaja, 390 px bez prelijevanja). Uživo: entry sadrži „Lijevak upita“ i `/admin/cc/funnel`, root/deep/asset 200.
- Korak „Poslan upit“ broji se od widgeta `b4y-cc.81a862b0.js` (31.10. 09:31 UTC); prvih dana bit će nizak.
- Rollback: prethodni build na cusma1 (admin_deploy.sh), `git revert` commitova `8352bd7`, `1e4151d`.

## 2026-10-30 — 🩹 Offers: „Copy as rich text“ opet vidljiv — ✅ DEPLOYANO 30.10.2026 (cusma1, main `3bf24d0`, entry `assets/index-DxHuPu4k.js`)

Mario 30.10.2026 (screenshot): u modalu „Client offer“ gumb „Copy as rich text“ bio je tamni tekst na navy pozadini od teme v2.2 (contained = žuti gumb s tamnim tekstom; `sx` mijenjao samo pozadinu). Tekst gumba sada bijel. Skeniran cijeli admin: nema drugih tamnih contained gumba bez boje teksta.

## 2026-10-30 — 🎨 Broker Desk redizajn v2.2 na cijelom adminu (samo vizualni sloj) — ✅ LIVE 30.10.2026 (cusma1, main `7bf1bf1`, entry `assets/index-BsjmJMkY.js`), tag `live/2026-10-30-redesign-v22`

Mario 30.10.2026: „sredi samo dizajn, funkcije se ne smiju dirat, sve mora biti pod istim funkcijama“. Dizajn: `_design/redesign-v2.2/index.html` (Claude Design, 31 ploča). Grana `feat/redesign-v2.2` (iz `main` `e157889`), commiti `e5a8a5f` … `502d807`, po fazama:

1. **Sustav** (`e5a8a5f`): jedan set tokena u `src/styles/bb.ts` (boje v2.2, semantički tonovi, radijusi 14/10/16, meka sjena kartice, tekstura nautičke karte, ilustracije); stari SCSS/TS nazivi boja (`_variables.scss`, `themes/colors.ts`) preusmjereni na te vrijednosti. **Inter je sada stvarno učitan** (`public/fonts/Inter/*.var.woff2`, latin + latin-ext). MUI theme: žuti contained primary, navy secondary, outlined tertiary, destruktivni, polja 36 px s fokus aurom, navy kartice na sivoj traci, izbornici, dijalozi, tooltipi. Header na teksturi + mobilna ladica; modal (podnožje desno, Odustani pa Potvrdi), bottom sheet iste obitelji, tamni toast s ikonom i X. Zajedničke komponente `src/components/Desk` (PageHead, DeskTabs, FilterBar, TableCard, Th, Pager, skeleton/prazna stanja, kartice, ErrorCard).
2. **Rezervacije** (`948fcd6`): početna (KPI + graf tjedna jedan do drugog, tablica u kartici, neviđeni redovi jantar + žuta traka + NEW, kartice umjesto tablice na mobitelu), detalj (kartice: brod/podaci, faze plaćanja, cijena, bilješke, novosti za klijenta; bočno radnje / putna aplikacija / dokumenti / interni dokumenti), čarobnjak s indikatorom koraka.
3. **Kontakt centar** (`1d61da0`): `cc` tokeni uzimaju vrijednosti iz `bb.ts`; statusi po v2.2 tablici s točkom; Pošalji/Spremi žuti, Preuzmi navy; ilustracije praznih stanja. Raspored i ponašanje isti.
4. **Ponude** (`c0924f5`): sekcije filtera, kartice rezultata, pillovi Bareboat/Skipper/Crewed u v2.2 tonovima, MMK/NauSys tagovi, košarica kao kartice, mobitel: paneli jedan ispod drugog, ponuda u ljepljivom donjem panelu. **E-mail HTML za klijenta (`offerHtml.ts`) nije diran.**
5. **Ostale stranice** (`b802ce5`): Korisnici, Računi (statusna traka umjesto obojenih redova), Agencije (3 stupca kartica), Vlastiti brodovi (okomite kartice 4:3), Brodovi · Mediji, modali (GridDisplay, PillTab).
6. **Račun i pristup** (`502d807`): Moj profil (teksturirani pojas, kartica s redovima), prijava (fotografija otoka, mobitel s teksturom), 403/404 (ErrorCard s ilustracijom).

Funkcije: diff `origin/main..feat/redesign-v2.2` ne dira `src/services`, `src/valtio`, `src/routers`, `src/models`, `src/config`, `src/utils`, `src/locales`, `offerHtml.ts` ni PDF računa; svi handleri/API pozivi isti (provjereno skriptom koja uspoređuje `onX=`, `*Service.*`, `navigate(`, `toggle*`, `set*` po datoteci). Novo je samo: X na toastu i u mobilnoj ladici (zatvaranje), broj nepročitanih na mobilnom gumbu izbornika, ime i uloga u korisničkom izborniku, kartice rezervacija na mobitelu (isti klik).

Nije napravljeno (namjerno, mijenja ponašanje): zamjena `window.confirm` (brisanje rezervacije „spam“) dijalogom iz dizajna; dodatne radnje s ploča kojih u adminu nema (npr. „Izvoz CSV“, „Na rezervacije“ na 403/404, broj po kartici statusa).

Provjere: `tsc` 0, `yarn lint` 0 grešaka (pre-commit hook), `yarn test` 37/37, `yarn build` OK; lokalni pregled (Vite + lažni API iz scratchpada) na 1440 i 375 px za sve ekrane, usporedba s pločama dizajna.

Pregled prije deploya (jedan agent, Opus): „safe to deploy: yes“, 0 blokera; popravljeno u `7bf1bf1`: redoslijed tabova u podnožju modala (Odustani pa potvrda u DOM-u), mali Switch, okvir fokusa na modalima/izbornicima, žuti bljesak korisničkog gumba. Ostalo iz pregleda svjesno ostavljeno: oznake bez CSS verzala sada pišu kako su u kodu (npr. „Under option“), potvrde brisanja/otkazivanja su crvene (destruktivni gumb), čipovi fiksne visine 22 px.

Deploy: Mario „da“ (30.10.), fast-forward u `main`, build iz čistog worktreeja na `origin/main` `7bf1bf1` (`ADMIN_REPO=…/wt-deploy-v22`), `localhost:8443` 0 / `api.boat4you.com` 19, swap preko staging dira; live entry == novi, root/deep/asset 200; Inter woff2 i slike (tekstura, otoci, ilustracije) 200 s ispravnim content-typeom. Prethodni live: `index-j1FPEKNm.js` (backup na cusma1 `admin-dist.bak-<ts>.tar.gz`, `html.prev`).

## 2026-10-30 — 🎨 Kontakt centar: redizajn po „Contact Center redizajn.html“ (funkcije iste) — ✅ LIVE 30.10.2026 (merge `59b015c`; live kroz deploy `72fb63a`/`4ed4ea8`, entry `assets/index-j1FPEKNm.js`), tag `live/2026-10-30-cc-redesign`

Mario 30.10.2026: „Mijenjamo dizajn malo admin contact centra, funkcije moraju ostat, samo dizajn napravi po ovome“.

- `src/views/ContactCenter/ui.tsx`: boje i elementi s ploča (gumbi, čipovi, polja, segmentirani prekidač, tablice, kosturi, obavijest o grešci); svi ekrani Kontakt centra prestilizirani.
- Raspored: tri stupca od 1280 px; ispod toga popis + razgovor, a kartica klijenta u ladici; mobitel s „← Popis“, „Kartica klijenta“ i „Više radnji“. Polja na mobitelu 16 px (iOS ne zumira).
- Novo u izgledu: sklopivo „Kretanje“, brojač znakova, greška slanja ostaje u polju (crveni rub + obavijest), čipovi „Treba čovjeka“ / „Samo sumnjivi“ i sklopivi filteri, „Očisti filtere“, kartica kontakta s inicijalima, KPI kartice i trake u statistici. Status ili tag više ne brišu nespremljeno ime i bilješku.
- Provjere: `tsc` 0, lint 0 grešaka, `yarn test` 37/37, build; lokalni pregled s lažnim API-jem na 1440/1024/390 px; jedan završni pregled (Opus): 0 kritičnih, 2 važna, 7 manjih, svi popravljeni u `c25c36b`.
- ⚠️ 30.10. 14:39–14:40 UTC: build iz `59b015c` (bez `4d13399` i `72fb63a` druge sesije) bio je ~90 s live; vraćeno deployem iz `4ed4ea8` (isti entry kao `72fb63a`). Pouka: admin deploy uvijek iz trenutnog `origin/main`.

## 2026-10-30 — 🧭 Kontakt centar odmah iza Offers u izborniku — ✅ DEPLOYANO 30.10.2026 (cusma1, main `72fb63a`, entry `assets/index-j1FPEKNm.js`)

Mario 30.10.2026. Redoslijed: Bookings, Offers, Contact Center, Users, Invoices, Custom boats, Boats · Media, Agencies.

## 2026-10-30 — 📊 Dashboard spojen u Bookings — ✅ DEPLOYANO 30.10.2026 (cusma1, main `4d13399`, entry `assets/index-BIJTy3lu.js`)

Mario 30.10.2026: „dashboard prikazuje isto što i bookings, samo uz statistiku“. KPI kartice (ovaj tjedan, ovaj mjesec, potvrđene, prihod YTD) i graf tjedna premješteni na vrh Bookings (`partials/BookingsOverview.tsx`, isti endpoint `/admin/reservations/dashboard-metrics`); Dashboard view obrisan; Bookings je prvi u izborniku i default ruta nakon prijave; `/` i `/dashboard` → `/bookings`; logo u headeru vodi na Bookings. Verifikacija: root/deep/asset 200, live == new.

## 2026-10-30 — 🧹 Extras maknut iz izbornika — ✅ DEPLOYANO 30.10.2026 (cusma1, main `9343bd9`, entry `assets/index-BekaYAyN.js`)

Mario 30.10.2026: „extras ne koristim, makni je da je ne vidim“. Uklonjena samo stavka izbornika (`src/config/navigation.config.ts`); ruta `/extras` i dalje radi preko URL-a. Verifikacija: root/deep/asset 200, live == new.

## 2026-10-30 — 🗂️ Kontakt centar (P2) umjesto `/chat` — ✅ DEPLOYANO 30.10.2026 11:36 UTC (cusma1, main `1fd8e13`, entry `assets/index-DvDzqq_G.js`; backend P2 na cusma2 od 11:07 UTC)

Plan `infra/docs/superpowers/plans/2026-10-30-p2-contact-center-admin.md`, zadaci 9–15. Grana `feat/contact-center-p2` iz `main` `0a35a6a`.

- Nova stavka izbornika **Kontakt centar** (samo SYSTEM_ADMIN) s brojem nepročitanih razgovora (`GET /admin/cc/conversations/unread-count`, svakih 30 s dok je tab vidljiv). `/chat` sada vodi na `/contact-center`.
- Kartice: **Razgovori** (tri stupca: popis Svi / Live sada s filterima i pretragom, otvoreni razgovor s kretanjem po sajtovima, karticama brodova i gumbima Preuzmi / Vrati AI-ju / Zatvori / Obriši, kartica klijenta), **Live posjetitelji** (proaktivna poruka), **Kontakti** (popis + stranica kontakta), **Statistika**.
- Odgovor, zatvaranje i brisanje i dalje idu kroz `/admin/chat/**`; sumnjivi razgovor nema Obriši ni checkbox i nema Vrati AI-ju (ADMIN-5, ADMIN-9). Sve od posjetitelja, AI-ja i trackera je čisti tekst; link samo na putanju sajta tog razgovora (ADMIN-11, ADMIN-12).
- Kratki poll: prva stranica popisa 5 s, otvoreni razgovor 4 s, live 15 s; samo dok je tab vidljiv, nikad dva ista zahtjeva u letu.
- Oznaka nepročitano kao na starom `/chat` (ADMIN-10): samo otvaranje razgovora je NE briše, brišu je odgovor ili zatvaranje. Inače bi svaka poruka posjetitelja dok je razgovor otvoren slala novi mail brokeru (završni pregled P2, I-1).
- Header sada prikazuje samo stavke koje uloga korisnika smije otvoriti (MANAGER više ne vidi SYSTEM_ADMIN stavke).

Provjere: `tsc` 0, `yarn lint:base` 0 grešaka, `yarn build` OK, `yarn test` 37/37 (novo `tests/contact-center.test.ts`). **Ručna provjera prema starom `/chat` (ADMIN-1…14) NIJE napravljena lokalno** (backend P2 API nije na produkciji, a lokalni backend s podacima nije podignut): radi se odmah nakon deploya, samo čitanjem.

Deploy:

- [ ] TEK NAKON backend jara s P2 (`/admin/cc/**`); sa starim backendom Kontakt centar javlja grešku, a `/chat` više ne postoji.
- [ ] Uobičajeni admin ručni deploy (test prije swapa).
- [ ] Provjera kao SYSTEM_ADMIN: popis (zadano Svi), Treba čovjeka uključuje Zaključan, Samo sumnjivi s praznim stanjem, točka nepročitano, otvoren razgovor (povijest, poruke, kartica klijenta), Kontakti, Statistika (posjetitelji 0 do P3), HR/EN.

## 2026-10-17 — Boats · Media: vlastite fotke, video i crew profile za BILO KOJI brod + image hygiene alati — ✅ DEPLOYANO 20.10.2026 13:08 UTC (cusma1, `bb80aef`, entry `assets/index-CwtynOMl.js`, root/deep/asset 200; backend V9_92 na oba čvora 13:06 UTC), tag `live/2026-10-20` (grana `feat/yacht-media`)

Mario 17.10. (gulet Allure 11769, `gulet-allure-11769`): naše 54 fotke, Vimeo https://vimeo.com/982130882 i crew-profile PDF na svih 7 sajtova. Nova stranica **Boats · Media** (`/boats/media`, izbornik odmah iza „Custom boats“, samo SYSTEM_ADMIN kao backend):

- Traži brod (`GET /admin/yachts/lookup?q=&limit=20`, ime ili id) → kartica broda (main slika `?width=400`, „Manufacturer Model Name“, entry type).
- **Own photos:** drag-and-drop / odabir (JPEG/PNG/WebP, ≤ 10 MB po datoteci = FileSystemService limit), slanje u serijama ≤ 20 datoteka i ≤ 20 MB (`POST /admin/yachts/{id}/images`, polje `files`; nginx na api.boat4you.com ima `client_max_body_size 25m` → 413, pa serija od 40 MB ne prolazi — Allure set 54 fotke / 69,2 MB ide u 4 zahtjeva 18/15/11/10, najveći 19,7 MB), napredak po datoteci; mreža slika broda iz `GET /admin/yachts/{id}/media` (sve slike broda redom, i skrivene, s izvorom OWN/PARTNER; svaki upload/redoslijed/brisanje/video/PDF vraća isti DTO pa se mreža ne čita ponovno), chipovi MAIN/OWN/PARTNER/LAYOUT/HIDDEN, „Set as main“ (`PATCH /admin/yacht-images/{id} {main:true}`), Layout/Hidden toggle, redoslijed povlačenjem ili strelicama (`PUT …/images/order`, sprema odmah), brisanje (`DELETE`, partner → 409 poruka).
- **Video:** YouTube (watch / youtu.be / embed) ili Vimeo (vimeo.com/<id>, unlisted vimeo.com/<id>/<hash>, player.vimeo.com/video/<id>) → `PATCH /admin/yachts/{id}/media`, embed pregled; provjera u pregledniku = ista pravila kao backend `VideoUrlRules` (bez m.youtube.com, korisnika ni porta).
- **Crew profile (PDF):** ≤ 15 MB, provjera `%PDF` u pregledniku → `POST /admin/yachts/{id}/crew-profile` (polje `file`), zamjena uz potvrdu, brisanje, link na javni PDF.
- **Image hygiene:** detect-blocked, fix-layout, detect-layout (stranice s `onlyMain`, sličice + kvačice) — uvijek dry run → potvrda → rezultat. Detect-layout apply šalje pregledane `imageIds` u tijelu kao form polje (`imageIds=1,2,3`, x-www-form-urlencoded) jer ih endpoint čita kao `@RequestParam`.
- Twin: ako javni detalj servira kanonski twin, stranica to kaže i nudi „Open #twin“ (uređivanje sakriveno — mediji ne bi bili vidljivi). Javni detalj služi SAMO za twin i za video custom broda; neaktivan brod (bez javne stranice) dobije info poruku, a mreža i dalje radi iz admin DTO-a.
- Odgovor koji stigne nakon što je admin odabrao drugi brod (učitavanje, upload, PATCH, redoslijed, video, PDF) se odbacuje; tri sekcije broda imaju jedan ključ (`Fragment key={yacht.id}`) pa se kod promjene broda montiraju iznova.

Provjere: `tsc` 0, eslint 0 na promijenjenim datotekama, `yarn build` OK, `yarn test` 24/24 (novo: `node --test`, Node ≥ 22.18 zbog type strippinga; `tests/yacht-media.test.ts`). Lokalno renderirano s mock API-jem (login, 25 fotki + 1 HEIC odbijen → 2 zahtjeva 20+5, main/hidden/layout/order/delete-409, Vimeo pregled, PDF magic, twin upozorenje, hygiene dry run → apply), mobilno 546 px bez horizontalnog skrola. Nije viđeno protiv pravog backenda.

Deploy:

- [ ] TEK NAKON backend jara s V9_92 + novim endpointima (backend `feat/own-media`); sa starim backendom stranica se otvori, ali lookup/upload vraćaju grešku (toast).
- [ ] Uobičajeni admin ručni deploy (test prije swapa).
- [ ] Provjera kao SYSTEM_ADMIN: Boats · Media → „Allure“ → upload 54 fotke → „Set as main“ na našu → video link → PDF → otvori `www.boat4you.com/boat/gulet-allure-11769` + jedan sister.

Review 17.10. (`fix(own-media): review follow-ups`): duplikat `key` na tri sekcije (stare sekcije prethodnog broda ostajale u DOM-u s aktivnim gumbima) → `Fragment key`; serija 40 → 20 MB (413 na nginxu, 20/54 fotke); OWN chip na partner fotkama nakon uploada (odgovor = cijeli DTO) → mreža iz `GET /admin/yachts/{id}/media`; utrka upload ↔ promjena broda → odgovori za drugi brod se odbacuju; video pravila = backend. Nginxova 413 stranica nema CORS zaglavlje pa preglednik vidi mrežnu grešku: toast tada kaže „No answer from the API: a network error, or a request larger than the proxy allows.“; čitljiva 413 HTML stranica → „Request too large (proxy limit)“. Provjere nakon reviewa: `tsc` 0, eslint `src/` 0 grešaka, `yarn build` OK, `yarn test` 27/27; lokalno s mockom ugovora (svaki poziv vraća YachtMediaDto, 413 bez CORS-a iznad 25 MB): 4 promjene broda → po jedna sekcija, upload na Allure pa odmah drugi brod → mreža ostaje od drugog broda, OWN chip samo na uploadima, skrivena slika vidljiva i vraćena, main/redoslijed/brisanje/video (http → https iz odgovora)/PDF, neaktivan brod (1502) → mreža iz admina, twin, 25 × 1,5 MB → 2 zahtjeva 19,5 + 18,0 MB. Nije viđeno protiv pravog backenda.

Poznata ograničenja: javni PDF link je isti nakon zamjene i keširan 24 h. Header izbornik se već prije prelijevao ispod ~1060 px širine; s novom stavkom ispod ~1170 px (pre-existing, nije dirano).

## 2026-10-16 — 🖼️ Offers: hero slika e-maila ponude nikad fotka marine/tlocrt (kind-aware) — ✅ DEPLOYANO 16.10.2026 08:27 UTC (main `7563470`, entry `index-DXDtJIny.js`), tag `live/2026-10-16`

Backend `feat/catalogue-images` (večeras) dodaje u `/public/yachts/{slug}` slike s `kind` MODEL_SAMPLE (fotke istog modela za brodove bez prave fotke) i MARINA (2–3 fotke polazne marine) iza prekidača `GALLERY_EXTENDED`. Offers hero (`Offers.tsx`) sad bira prvu PARTNER/MODEL_SAMPLE fotku, nikad tlocrt ni marinu; bez `kind` (danas) ponašanje isto. Deploy iz worktreea `wt-gallery` (`admin_deploy.sh`, ADMIN_REPO), verify root/deep/asset 200, 0× localhost:8443.

## 2026-10-14 — 🔤 Emoji „tofu“ kvadratići → MUI ikone (Broker Desk: ikona agencije i datumska pilja; Create reservation: pin lokacije) — ✅ DEPLOYANO 14.10.2026 12:38:53 UTC (`007174e`, entry `assets/index-CEJ6TS7P.js`), tag `live/2026-10-14`

Mario 14.10. (screenshot admina): na uređaju bez emoji fonta Chrome je umjesto 🏕 (U+1F3D5) ispred imena agencije i 📅 (U+1F4C5) u datumskoj pilji crtao kvadratić s hex kodom. Zamjena: `BusinessOutlined`, `CalendarMonthOutlined`, `PlaceOutlined` iz `@mui/icons-material` (ista veličina/boja, aria-hidden). BMP simboli (✓ ⚠ ⛵ ☀) ostaju. **Ostaje otvoreno (Mariova odluka):** `offerHtml.ts` (HTML/WhatsApp ponuda kupcu) i dalje nosi emoji (📶 🔥 🧭 🗺 📍 📅 💰 🔗) — e-mail klijenti ih uglavnom iscrtavaju, WhatsApp plain text nema SVG alternativu.
Provjere: eslint 0, tsc 0, hook prošao; build iz worktreea (`ADMIN_REPO`), staging → test → swap, live == new, root/deep/asset 200.

## 2026-10-13 — Chat inbox: IRIS guard (f9ff274) — ✅ DEPLOYED 13.10.2026 ~06:56 UTC (`936c26b`, entry `index-G_75O8qh.js`, tag `live/2026-10-13`)

Why: the 4.10. prompt-injection / XSS probes from 31.22.91.227 (sessions 48, 50–53 — evidence, never delete). Review `infra/docs/ai-chat-security-review-2026-10-11.md` A1–A8 (admin side).

What:

- ⚠️ "Suspicious" chip + red left edge on a row with `flagged: true` or `status: "LOCKED"`; "Suspicious only" switch sends `?flaggedOnly=true` and also filters client-side (an older backend ignores the param).
- Header banner for such a session: status, `lockReason`, `lockedAt` (all plain text).
- A1: the "Viewing" link is built only for a same-site path (`new URL(page, 'https://www.boat4you.com')` + origin check). `.evil.tld/x`, `@evil.tld/x`, `//evil`, `/\evil` → plain text + red "suspicious" tag, no link.
- Flagged sessions: no Delete button, checkbox disabled, never in the bulk-delete ids; a failed delete shows a toast (the new backend may refuse it / soft-deletes).
- A8: `/chat` route + menu are SYSTEM_ADMIN only (backend `AdminAiChatController` `@PreAuthorize` is the authority). A MANAGER no longer sees the menu item and gets 403 on `/chat`.
- Rendering unchanged: everything is a React text node; `.eslintrc` now makes `react/no-danger` an error for `src/views/Chat/**` and `chat.service.ts`.
- `flagged` / `lockReason` / `lockedAt` are optional in `ChatSessionDto`: works against the old backend (no badges) and the new one. Unknown status / role → raw value instead of an i18n key.

Backend contract (boat4you-backend `feat/chat-security-guard` c8af26d, verified end-to-end on a local jar 13.10.): `SessionDto.flagged` / `lockReason` (e.g. `IN:FORMAT:J1`) / `lockedAt` (ISO instant), `?flaggedOnly=true`, `needsHumanOnly` includes LOCKED, `DELETE` of a flagged session → 409 `{"error":"flagged"}`, bulk-delete → `{"deleted":n,"skipped":m}`, delete is a soft delete.

Verified: `tsc` 0; eslint 0 on the changed files (whole `src/`: the 8 pre-existing warnings elsewhere); `vite build` OK (chat chunk: 0 `innerHTML` / `__html`); `react/no-danger` fires in `src/views/Chat`. Rendered with a mocked API (6 sessions, transcript with `<img src=x onerror=alert(1)>`, `[x](javascript:…)`, markdown image): payloads shown literally, 0 `<img>`, 0 alerts; bulk select sends only the unflagged ids; `@evil.tld/login` / `.evil.tld/x` not a link; same-site path → `https://www.boat4you.com/hr/boat/…` with `rel="noopener noreferrer"`; garbage `lockedAt` hidden; `?flaggedOnly=true` sent. Not seen against the real backend yet.

Deploy:

- Deployed with `infra/deploy-scripts/admin_deploy.sh` (`ADMIN_REPO=…/wt-chat-flagged`; the script's swap step was fixed first, infra `ac71019`): live entry == new, `/` 200, `/offers` 200, asset 200; the live bundle contains `flaggedOnly` and the HR chat strings. Backend with the guard was live since 06:49 UTC (V9_76 back-filled sessions 48, 50–53 as flagged/LOCKED; test session 56 locked live). Not yet looked at as SYSTEM_ADMIN in the browser (no login from here) — Mario: Chat → „Samo sumnjivi".
- [ ] Safe before or after the backend guard (old backend: no badges, everything else as before). Best right after the backend jar `feat/chat-security-guard` so the badges show at once (V9_76 back-fills sessions 48, 50–53 as flagged/LOCKED).
- [ ] Usual admin manual deploy (test before the swap).
- [ ] Check as SYSTEM_ADMIN: Chat → "Suspicious only" → sessions 48, 50–53 listed once the backend flags them (if the backend back-fills them), no Delete on them, banner shows reason / time. Unflagged session: Viewing link opens www.boat4you.com.
- [ ] Check as MANAGER (if such a user exists): no "Chat" in the menu, `/chat` → 403 page.

## 2026-10-09 — Offers charter pill: review fixes (6d9e8ac, on f27984b) — ✅ DEPLOYED 9.10.2026 17:55 UTC (entry index-m4yN4j6c.js)

Deploy together with `f27984b` (entry below), and only after the backend `2269c75` + its review `68d3a9e` (backend DEPLOY_NOTES 9.10.: one jar ≥ `68d3a9e`).

What changed (review 9.10.):

- **Stale pill (F4):** "‹ week ›" / the calendar change the dates without a new search, so the pill described another week than the one "Add to offer" adds. Now the last search's dates are kept: a row whose pill belongs to other dates shows it faded and struck through ("search again" on hover), and "Add to offer" stores no charter label in the cart for it.
- **Look and texts (F6):** Skippered is orange (was teal, too close to Crewed's green; orange also stays apart from the yellow "Under option" pill). Bareboat no longer claims "a skipper can still be added". New backend bases: `OBLIGATORY_CREW_MEMBER` (Bareboat — the client skippers, but a hostess / cook / deckhand is an obligatory charge, named on hover) and `BAREBOAT_UNCONFIRMED` (NauSys offer without a charter type on a boat listed both ways — confirm with the partner). An unknown basis reads its kind's own text (was: the Bareboat text, even on a Crewed / Skippered pill). The pill is focusable, so the hover text also opens from the keyboard.
- **Backend side (`68d3a9e`, no admin change needed):** Skippered only when the obligatory skipper is really charged at the boat's base (NauSys `valid_for_bases`), skipper names found anywhere in the charge ("Wintersailing | Skipper | …", "Tour leader 53") but not in conditions / insurances / certificates; a skipper with anyone else (e.g. "Skipper & Chef", or Skipper + Hostess charges) is **Crewed** — default, Mario to confirm; the offer is the boat page's FREE one when a live option holds another; a multi-week card has no pill when its weeks differ.
- Untouched: the client e-mail / WhatsApp (no label there), hero `?width=800`, inquiry templates, prices and extras.

Verified: `tsc` 0; eslint 0 errors (Offers.tsx keeps its 3 pre-existing warnings; prettier deviations of Offers.tsx unchanged at the pre-existing count, `offerCharter.ts` clean); `vite build` OK; `offerCharter.ts` checked with esbuild + node (all bases, unknown basis per kind, `constructor` as basis, malformed → no pill). Not seen in a real browser yet.

Deploy (order: backend cusma2 → cusma3 with the hard sync gate → admin):

- [ ] Backend jar ≥ `68d3a9e` live on cusma2, then cusma3 (gate: `n=$(journalctl --since '10 minutes ago' | grep -ci 'nausys\|mmk'); [ "$n" -gt 0 ] && { echo ABORT; exit 1; }`). With the old backend nothing breaks — rows just have no pill.
- [ ] Usual admin manual deploy of `6d9e8ac` (test before the swap).
- [ ] Check in Offers:
  - Italy, 1.6.–8.6.2027 → **8165 ITALIA IV** reads **Skippered** (orange), hover `Bareboat offer with an obligatory skipper: "Skipper"` (or French Polynesia, same week → 6595 Molokoi). If that week sold meanwhile: any orange row whose hover names an obligatory skipper.
  - Spain, 5.6.–12.6.2027 → **2583** (Palma) is **not** Skippered (its "Skipper" is for Nassau / Road Town only).
  - Gulets **18886 Sylvia R** and **11771 Gallant** (their country, a week they have an offer) → **Crewed**, hover "Gulet - always chartered with its crew, never bareboat."
  - Click "week ›" without searching → every pill faded and struck through, hover says search again; "Add to offer" → the cart row has no charter label. Search again → pills normal.
  - Tab onto a pill → the hover text opens.

## 2026-10-09 — Offers: Bareboat / Skippered / Crewed pill per search row (f27984b) — ✅ DEPLOYED 9.10.2026 17:55 UTC (entry index-m4yN4j6c.js)

Why: Mario (9.10.) — when searching yachts for a client, every row must say whether the OFFER is Bareboat, Skippered (a bareboat offer whose skipper / captain is an obligatory charge) or Crewed (crewed product, crew-only boat, obligatory crew, or any gulet — a gulet is never bareboat).

What:

- Reads the backend's admin-only `offerCharter` from `/public/yachts` (backend `2269c75`): `{ kind, basis, obligatoryExtra }`. The offer is the one "Add to offer" adds for the card's dates.
- `src/views/Offers/offerCharter.ts`: labels, colours (Bareboat blue, Skippered teal, Crewed green), hover text with the reason and the obligatory charge's name (cut at 120 chars), `toOfferCharter` (anything malformed / absent → no pill).
- Card: pill right after the boat name, before "Under option". Cart list: the same label next to MMK / NauSys (`CartYacht.offerCharter`, admin-only, never rendered by `offerHtml` / WhatsApp).
- Not in the client e-mail on purpose: the "+ Skipper" toggle can make a Bareboat row a skippered offer, so a fixed label there could contradict the services below it. Hero `?width=800` and the inquiry templates untouched.

Verified: `tsc` 0; eslint 0 errors (Offers.tsx keeps its 3 pre-existing warnings); `vite build` OK; helper checked with esbuild + node (labels, reasons, malformed input → null). Not seen in a real browser yet — check on the first admin session after the deploy.

Deploy:

- [ ] AFTER the backend `2269c75` (cusma2). With the old backend nothing breaks — the rows just have no pill.
- [ ] Usual admin manual deploy (test before the swap).
- [ ] Check: Offers → Croatia, a Saturday week → pills on every row; a gulet (e.g. 20213 Entre Cielos, 11771 Gallant) reads Crewed; hover shows the reason; add a Skippered boat → the cart shows "Skippered".

## 2026-10-06 — Offers: the partner's own capacity (cabins, berths, WC, people, notes, sails, engine) in the card, client offer, WhatsApp and reservation picker (9d3edc1 + review fix 4c9f299) — ✅ DEPLOYANO 7.10.2026 (live bce0dfb; backend gate prošao)

Why: Mario (6.10.) — cabins / berths / layout exactly as MMK and NauSys send them on every surface, so a client never has to ask (capacity contract v1, 6.10.2026). The admin showed a different subset of the same figures on each surface: the Offers card cabins + "Pax", the client e-mail cabins + berths + WC and "rolling mainsail" for full-batten boats (Jangada 11399: "Pax 12" in admin, "10 berths" in the e-mail), CreateReservationModal no berths.

What:

- `9d3edc1`: the shared formatter `src/utils/yachtCapacity.ts` (byte-identical to the contract copy and b4y; prettier-ignored and 5 eslint style rules off so it stays identical), the EN `capacity` messages, `yachtCapacityEn.ts`.
  - Offers card: pills in the compact form (cabins, NauSys crew cabins, berths with the short note / split, WC, crew WC, max. people, crew only for crewed charters) + L + Year. The admin-only `brokerNotes` (raw partner notes + the partner's internal remark) sit behind an info icon only — never in the cart, the client e-mail or WhatsApp.
  - Cart: capacity, rig, maxPersons, crewNumber, charterType and the custom-yacht engine fields from the public detail (notes already sanitized by the backend); carts saved before are topped up when the offer modal opens (the paymentType pattern).
  - Client e-mail: specs line vessel · year · length, then the full capacity line and the mainsail / headsail / engine / draught line. `humanizeMainsail` is gone (the flat enum is a filter value). Hero `?width=800` untouched. WhatsApp: the compact chips. CreateReservationModal: the compact chips.
  - Until the backend sends `capacity` / `rig`: the flat cabins / berths / wc / maxPersons / crewNumber, numbers only, no sail, no partner engine.
- `4c9f299` (review): an entry stored with `capacity: null` (added or topped up while the backend did not send the block) is now topped up too (`== null`, was `=== undefined`), so such a cart gets the notes and the sail / engine line once the backend is live. The public detail always carries the block from then on, so it is fetched at most once more per entry.
- Untouched: price and extras logic (no admin price code reads `maxPersons`; prices / extras stay snapshotted at add time), the hero width, the inquiry templates.

Verified:

- Formatter byte-identical in contract / b4y / admin (sha256 `502365cc08c9…`); contract `node --test` 22/22; the 7 reference boats' rows and chips equal `reference_boats.json`; live detail payloads 8351 / 11399 / 1161 and a live search page through the formatter: no `null` / `NaN` / `undefined`.
- Independent review (6.10.): `brokerNotes` only in the search-row tooltip; the cart is built from explicit fields (no `...row` spread); `offerHtml` never reads it; old-cart top-up keeps the broker's extras; `maxPersons` in no price code; no `cabins*2+2`, "certified", "with shower" or "bathrooms" in live code.
- `tsc` 0; eslint 0 errors (Offers.tsx keeps its 3 pre-existing warnings); vite build OK at `9d3edc1`; `4c9f299` = one comparison, tsc + eslint re-run.
- Not yet seen in a real browser: the card pills and the info-icon tooltip — check on the first admin session after the deploy.

**REQUIRED DEPLOY ORDER (the whole capacity release):**

1. **Backend cusma2** (`c374579`…`a96efe8` + its review fixes): hand-apply the idempotent `V9_72__yacht_partner_capacity.sql` as `boat4you_owner` first (a second run returns at the column guard without a lock), then the jar + restart — outside ALL sync slots (server time, UTC): MMK availability 08:40 / 12:40 / 16:40 / 20:40 (~17 min each), MMK near-term 10:50 / 16:50, MMK full 06:00–07:30, NauSys availability 10:20 / 16:20 / 22:20, NauSys near-term 10:40 / 16:40, NauSys nightly 23:20 → ~06:00, NauSys search-retry drain every 15 min, matview refresh every 10 min (an ALTER competes with it).
2. **Backend cusma3** (scheduler), hard gate in the same script: `n=$(journalctl --since '10 minutes ago' | grep -ci 'nausys\|mmk'); [ "$n" -gt 0 ] && { echo ABORT; exit 1; }`.
3. **Wait one full sync cycle on the new jar:** NauSys (23:20) and MMK (06:10). Until the first NauSys sync the API serves crew WC from the old, buggy `crew_wc` — no frontend before step 4.
4. **Gate SQL** (read-only, contract §4) must pass:

   ```sql
   WITH s AS (SELECT y.*, em.external_system_id AS sys
                FROM yacht y JOIN external_mapping em ON em.system_id = y.id AND em.type = 'Yacht'
               WHERE y.sys_active)
   SELECT sys,                                                         -- 1 = MMK, 2 = NauSys
          count(*)                                                       AS active,
          count(*) FILTER (WHERE sys = 2 AND salon_berths IS NULL)       AS ns_salon_null,     -- expect ~0
          count(*) FILTER (WHERE sys = 2 AND wc > 0 AND crew_wc = wc)    AS ns_crew_wc_eq_wc,  -- was ~7.6k, expect small
          count(*) FILTER (WHERE sys = 1 AND mainsail_label IS NULL)     AS mmk_mainsail_null, -- expect ~0
          count(*) FILTER (WHERE sys = 1 AND berths_note IS NOT NULL)    AS mmk_berths_note,   -- expect 40-50 %
          count(*) FILTER (WHERE mainsail_type = 'ROLLING_SAIL')         AS rolling,           -- furling only now
          count(*) FILTER (WHERE mainsail_type = 'CLASSIC_SAIL')         AS classic
     FROM s GROUP BY sys;
   ```

   plus the contract's two follow-ups (NauSys agencies with `salon_berths IS NULL`; `mainsail_label` values = EN / no-language labels only).

5. **Admin** (this entry) → 6. **b4y** (`2183ac26f`, `6cc0d6e4e`, `c0071d987`) → 7. **the 6 sisters** → 8. **later, only once b4y and the 6 sisters render the new blocks:** migration B8 (`B8_trigger_later.sql`, today only in the session scratchpad `capacity/contract/` — it must become a backend `V9_<next>` migration first). It stamps `yacht_content_modified` for ~13.6k active boats → sitemap `<lastmod>` recrawl wave; tell Mario / GSC monitoring.

Deploy (admin, as before): `.env.production.local` → `npx vite build` → tar → cusma1 `html.staging` → checks (index.html, 0× `localhost:8443`, entry hash, Offers chunk contains `Crew WC` from the capacity messages) → backup → `mv html html.prev` → `mv html.staging html` → chown www-data. After the deploy: log in again once (a stale token = anonymous = no `brokerNotes`).

Rollback: `git revert 4c9f299 9d3edc1` + redeploy, or the `html.prev` swap. Carts saved by the new build carry extra fields the old build ignores.

## 2026-09-29 — Offers: a renamed partner charge is listed once in the client offer (4d3fa3f, DEPLOYED 10:21 UTC, `index-DpT16WrA.js`)

Why: Mario — the client offer for Fico - Premium line (13311, 11–18.9.2027) listed "Premium Line Pack" twice (old and new partner name, same MMK id; the catalogue has the new name, an older offer the old one).
What: cart key stays `e.key` → labelCode → name-price (NOT `externalId`: NauSys obligatory offer rows carry synthetic per-offer ids and keying on it splits catalogue/offer twins). New: an offer row whose partner id equals a catalogue row's partner id under a different key drops that catalogue row (unless another offer row owns that key), keeping its description when the offer row has none — the same identity `PriceCalculationService.mergeYachtAndOfferExtras` uses for the price. `externalId` reaches the admin only (backend 1d0ac4a serves it to SYSTEM_ADMIN, as a string); this build had to go live BEFORE that backend.
Notes: re-login once after the deploy (a stale token = anonymous = no id = old behaviour); re-add yachts already in a saved cart (localStorage carts are not re-merged).

## 2026-09-26 — Offers: client e-mail + WhatsApp split obligatory services by how they are paid (81865f7, DEPLOYED 18:38 UTC, `index-Be7e2_Ua.js`)

Why: since 26.9. the backend charges obligatory extras the partner bills with the booking (MMK payableInBase=false, NauSys ADVANCE_PAYMENT → `paymentType` WITH_BOOKING) online with the charter, on the same payment schedule; the e-mail still called every obligatory service "payable separately" with a "total on arrival" (Mario: "popravi").
What: `CartExtra.paymentType` from the backend DTO (checkout fallback for unclassified rows); card groups "Paid with your booking" (price box: + services · paid with booking, = total payable with booking) and "Other services" (payable separately, = total charter cost) — or exactly the old wording when a yacht has no such rows; deposit-only → "At the marina". WhatsApp mirrors it, list-price strike moved into the charter part. Offer rows kept one per partner charge (`key#offerExtraId`; supersede removes only catalogue twins) so Skipper + "Skipper's liability insurance" both show, as the checkout charges both (backend f467270). Per-week services paid with booking count whole weeks (checkout rule). Skipper toggle ignores insurance/surcharge rows. Carts saved before today get paymentType topped up when the offer modal opens.
Verified: local render of 5 carts (Elda fixed part + port tax; marina-only unchanged; Skipper + insurance; 10-night per-week; pre-change cart unchanged) and WhatsApp text; lint 0 errors, tsc 0; live chunk carries the new wording.

## 2026-09-24 — Offers: fluid two-column client offer card + closing block (ae51e8c, DEPLOYED)

Why: the offer HTML is copy-pasted into Apple Mail, which strips `<style>`, so the media-query
layout never reached clients — on a phone the price card sat off-screen right. Gmail clips mails
over 102 KB; a 12-yacht offer was 155 KB as sent (36 % of all offers in 90 days were clipped).

`offerHtml.ts` only. Fluid-hybrid columns (`display:inline-block; width:100%; max-width`) sit side
by side at 640 px (photo | text, services | price) and stack on phones, no `<style>` at all.
Compact card (numbered title, one specs line, one amenities line, one-line descriptions, total on
arrival + deposit line, full-width "View & book online" button), ~5.9 KB per yacht (12 yachts =
70 KB raw). Mainsail enum humanised (was `ROLLING_SAIL` / `UNKNOWN` in client mails). One "Route
ideas" line per offer. Closing block appended to the copied HTML: HOLD next-step box
(`HOLD_OPTION_HOURS = 72`) + trust line; no greeting/signature (Apple Mail adds them). Hero photo
stays `?width=800` (cached by the customer web; a new width = fresh resize per photo = 503 risk).
Money logic, WhatsApp variant and exports unchanged. Renders + harness in
`boat4you-delivery/_offer-email-audit-2026-09-23/render/`.

Deploy: `.env.production.local` → `npx vite build` → tar → cusma1 `html.staging` → checks
(index.html, 0× localhost:8443, entry hash) → backup → `mv html html.prev` → `mv html.staging html`
→ chown www-data. Live entry `index-D_gV8az9.js`, Offers chunk `index-CV80kwCq.js` (contains
"non-binding option", no `b4y-price-col`), root + `/offers` 200. Rollback: `html.prev` (= `cd1c807`
build, entry `index-B6VneYFF.js`) or `/home/cusma1/admin-dist.bak-offercard-20260924-062734.tar.gz`.

Gotchas this time: (1) `grep -o … | wc -l` still aborts under `pipefail` when grep finds nothing —
wrap as `(… | grep … || true) | wc -l`; (2) `sudo -S` over ssh needs the password WITH a trailing
newline (`printf '%s\n'`), a bare file redirect hung silently; (3) never pass a remote script as
`ssh host "sudo bash -c \"…$(…)…\""` — the login shell expands `$()` locally in $HOME; upload the
script with scp and run `sudo -S bash /tmp/script.sh` instead.

### 2026-09-24 addendum — fixed px columns (91bbe33, DEPLOYED 07:2x UTC)

Mario's first real send (08:52 local, 1 yacht, 41 KB total of which 24 KB is his signature; the
card itself 6.4 KB = almost no Apple Mail bloat) proved the layout survives the paste, but Apple
Mail **bakes computed widths**: `width:100%; max-width:360px` was sent as `width:360px`, so on a
375 px phone the services column overflowed and clipped the right edge. Percentages die on paste,
`max-width:100%` survives. Columns are now `width:Npx; max-width:100%`, all N ≤ 300 (photo 266 |
text 300, services 300 | price 290). Live entry `index-DSc-DOwS.js`, Offers chunk
`index-CmDSS8rI.js`. Rollback `html.prev` = `ae51e8c` build (`index-D_gV8az9.js`).
Sent-mail evidence: `boat4you-delivery/_offer-email-audit-2026-09-23/mail_new/1002138.html`.

### 2026-09-24 addendum 2 — route-ideas line names every marina (2a25441, DEPLOYED ~07:50 UTC)

Mario: a 4-yacht Ionian offer showed "Route ideas for your week: Preveza Marina | Preveza" only.
All four (Preveza ×2, Lefkas ×2) resolve to `/itineraries/ionian`, and the single link carried the
first yacht's marina as label. Now grouped by area: area label ("Ionian Islands", "Šibenik", else
title-cased slug) + every distinct marina in the offer, max 5 areas × 4 marinas. Live entry
`index-Der3kZrn.js`, Offers chunk `index-DoGIfGnw.js`. Rollback `html.prev` = `91bbe33` build
(`index-DSc-DOwS.js`).

## 2026-09-22 — Offers: Prev/Next scrolls the middle panel back to the top (5b67fb9, DEPLOYED)

`handlePageChange` called `window.scrollTo({ top: 0 })`, but `<main>` in `Layout` is the only
scroll container (`height: 100vh; overflow-y: scroll` in `Layout.module.scss`) and the document
body never scrolls, so the call was a silent no-op — after "Next" the broker stayed at the old
offset and saw row ~45 of the new page instead of row 1. Now
`document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })`; one line in
`Offers.tsx`, no other files, thumbnail component untouched.

Build `.env.production.local` (api.boat4you.com + www.boat4you.com) → `yarn build` → tar →
cusma1 staged swap (`html.staging` → verify entry + Offers chunk + 0× localhost:8443 → `mv`) →
chown www-data. Live entry `index-Dnbuel49.js`, Offers chunk `index-ZzXkXxDu.js` (served copy
contains `querySelector("main")`), root + `/offers` 200. Rollback: `html.prev` (= this morning's
thumbnail build `9009e17`, entry `index-Cy24pJtS.js`), backup
`/home/cusma1/admin-dist.bak-scrollfix-20260922-0843.tar.gz`.

Deploy-script gotcha: under `set -e`, `grep -c` exits 1 when it finds 0 matches — the
"0× localhost" check itself aborted the first run right before the swap (staging was left in
place, live untouched, second run finished it). Count via `grep -o … | wc -l` or add `|| true`.
`html.prev` must be removed before `mv html html.prev`, otherwise `mv` nests it inside.

## 2026-09-13 — Users: resend the sign-up invite (9959473, DEPLOYED)

Mario: a client paid through the booking flow but never registered, and there was no way
to get them back in — the invite is sent once, automatically, and its link dies after 7 days.

Users list, action column: a **Send invite** / **Resend invite** link on every row whose
`inviteStatus` is not `ACCEPTED` (accepted users already have a password and the backend
rejects them). Confirm dialog with the recipient's address first — it puts an e-mail in a
customer's inbox. While one send is in flight the row shows "Sending…" and the other rows dim;
on success the list reloads so the status pill flips to Invited. Toast reuses the existing
`toast-messages.invite-user-*` keys. New `actions.*` labels in en + hr, `resources.d.ts`
regenerated (`yarn i18next-resources-for-ts`).

`UsersService.inviteUser(ids, forceEnglish?)` now appends the query param; the list passes
`false` so a paying guest gets the mail in the language they booked in. Backend side is
`9401056` + `75e1e81` (see backend notes) — the endpoint already regenerated code +
timestamp on every call, which is what revives an expired link.

Build `.env.production.local` (api.boat4you.com + www.boat4you.com) → `yarn build` → tar →
cusma1 staged swap (`html.staging` → verify `index.html` + asset hash → `mv`) → chown www-data.
Live entry `index-BCnXL1SW.js`, 0× localhost:8443, root + `/users` 200. Rollback: `html.prev`,
backup `/home/cusma1/admin-dist.bak-resend-invite-20260913-192124.tar.gz`.

## 2026-07-06 — Agencies: "Inquiry mode" checkbox (cc9b0f7, DEPLOYED)

New Controller checkbox in the agency edit modal GeneralTab, right of "Recommended"
(`name="inquiryOnly"`, label `form.agency.inquiryOnly` = "Inquiry mode" / "Samo upit").
Threaded through `AgencyModel.inquiryOnly`, defaultValues + initialValues in
UpdateAgencyModal, and the existing `updateAgency` PUT (`{ id, ...formValues }` → backend
`AgencyDto.inquiryOnly`). ON = that agency's yachts become inquiry-only (no direct booking,
like custom boats); see backend DEPLOY_NOTES same date. Build: `.env.production.local`
(api.boat4you.com + www.boat4you.com) → `yarn build` → tar → cusma1
`/var/www/admin.boat4you.com/html` (entry `index-DZLf54rx.js`, 0× localhost). Rollback `html.old`.

## ✅ FIXED 2026-07-03 — builds MUST set VITE_CUSTOMER_WEB_URL (localhost links incident)

The 2026-07-02/03 deploys (travel documents, c427f6b) were built with only
`VITE_BOAT_API_URL` — so the `http://localhost:3000` fallback got baked into
every admin → customer-site link (Offers "More info", booking preview,
inquiries). Offers e-mailed to customers during ~01:00–16:30 on 3.7. carry
dead localhost links permanently; Mario re-sends those. Fixed by rebuilding
with BOTH vars (`VITE_CUSTOMER_WEB_URL=https://www.boat4you.com`) and
redeploying — live chunk verified 0×localhost. Rule going forward: after every
build run `grep -r "localhost:3000" dist/assets | wc -l` → must be 0 before
the dist leaves the machine. README_PROD env section updated accordingly.

## ✅ DEPLOYED 2026-06-22 — offer share-link carries charter dates + currency

Commit `dd2f6bd`, live entry `index-BE8VBeEP.js` (verified: entry-hash match +
served Offers chunk contains the `startDate=` link logic, `/offers` 200).
Bug: WhatsApp/email boat link was dateless → client saw the page's default
price (8000 €) not the offered week (4000 €). Fix: `withOfferDates()` in
`offerHtml.ts` appends `?startDate&endDate&currency` to the WhatsApp link +
HTML title/More-info button (idempotent → also repairs carts already saved in
localStorage); `Offers.tsx` stamps the stored `detailUrl` + admin preview.
Deployed with cusma1 pass `Nikairis2019cusma1` (the old `ccCCuuUU1!` is dead).
Rollback: `html.old` on cusma1.

## ✅ DEPLOYED (live, verified 2026-06-22) — security hardening (audit S-002: JWT in localStorage + no CSP/X-Frame)

Both parts confirmed LIVE on admin.boat4you.com: part A (in-memory token) has
been in every build since the 14.6 currency deploy (commit `1f8de9f` is an
ancestor of the deployed `bdae904`); part B nginx headers verified on the live
response (`content-security-policy`, `x-frame-options: DENY`, `x-content-type-
options`, `referrer-policy`, `strict-transport-security` all present). The
"PENDING" status below was stale — kept for the CSP rationale + nginx recipe.

### (reference) security-hardening detail — audit S-002

Two-part fix for the audit HIGH "admin holds JWT in localStorage + admin has no
CSP/X-Frame". No API/routing/logic change, no new deps, no env change.

**A. Frontend (this build) — JWT out of web storage → in-memory.**
New `src/config/tokenStore.ts` holds the token in a module variable; `setToken`
(auth.actions) is the single writer keeping the valtio store + holder in sync.
`axios.config` (getTokenData/save/clear), `constants.authHeaders`, `auth.store`
init, and `useAuth` now read/write the holder instead of `localStorage`. Dead
`AuthKeys` enum removed. Trade-off: a hard reload / new tab / browser restart
clears the token → re-login (acceptable for internal admin; in-app router nav +
refresh-token flow keep the session alive while the tab stays open).
Verified locally: built `dist/` served with the prod CSP below → SPA boots, login
renders, **0 CSP violations**, `api.boat4you.com` baked (18×, 0× localhost).

**B. nginx (cusma1, `admin.boat4you.com` server block) — security headers.**
Add at **server** level (and re-add in any `location` that has its own
`add_header`, since nginx does NOT inherit add_header into such blocks):

```nginx
server_tokens off;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

CSP rationale (verified against the build): only one external module script
(`script-src 'self'`, no inline/eval/wasm), MUI/emotion inline styles
(`style-src 'unsafe-inline'`), @react-pdf worker (`worker-src blob:`) + blob
image-preview (`img-src blob:`), partner yacht photos (`img-src https:`),
api+font/file fetches (`connect-src https:`). Deploy: `nginx -t` → `systemctl reload nginx`.

Deploy recipe (per below): local `yarn build` → tar `dist/` → scp cusma1 →
sudo swap into `/var/www/admin.boat4you.com/html` (strip `._*`). Rollback `html.old`.

## ✅ DEPLOYED 2026-06-10 ~18:30 — /offers Broker Desk re-skin

Commit `b472d41` + clunkiness fixups after Mario's live review (compact filter
pills, branded EmptyState instead of stock Alerts, cart CTA hugs content —
live entry `index-CpZhWYjN.js`). Design-only: bb tokens (navy/yellow CTAs,
soft state-tinted cards, amber commission pills, de-indigo'd chips).
Rollback: `html.old` on cusma1.

## ✅ DEPLOYED 2026-06-10 ~18:00 — visual polish "Polirani Broker Desk"

Live on admin.boat4you.com (entry `index-BMlyh7nZ.js`, verified: AuthShell chunk
200 + new tagline served, `api.boat4you.com` baked, 0× localhost). Rollback copy
on cusma1: `/var/www/admin.boat4you.com/html.old`. Recipe used: local
`yarn build` (picks `.env.production.local`), tar dist → scp cusma1 →
sudo swap into `/var/www/admin.boat4you.com/html` (strip macOS `._*` first).

## Original pending-deploy notes (2026-06-10) — visual polish "Polirani Broker Desk"

Commits `3019f4e..646fe1f` on `main` (pushed). Styling only — no API/routing/logic
changes, no new dependencies, no env changes.

- `src/styles/bb.ts`: warmer page bg (#f4f6f8), card radius 14, soft card shadow,
  `bbCardSx`/`bbAuthTitleSx` helpers.
- Dashboard: KPI icon chips, soft cards, blue rounded chart bars, roomier table.
- New `AuthShell` (navy/yellow split) used by Login, ForgotPassword, ResetPassword,
  SignUp; old sketch + Raleway-italic hero removed; Chrome autofill yellow fix.

Deploy = standard SPA build per `README_PROD.md` (build with prod `.env`, upload
`dist/` to cusma1 `/var/www/admin.boat4you.com/html`).

~~⚠️ `yarn build` (tsc step) fails on 10 pre-existing TS errors~~ — **FIXED same day**:
`PickersDayProps` is non-generic in x-date-pickers v8 (DateRangeField) and
`variant="caption"` is type-disabled repo-wide (typings.d.ts) — those usages now
carry equivalent `captionSx` (MUI default caption metrics, render unchanged).
`yarn build` passes clean again.
