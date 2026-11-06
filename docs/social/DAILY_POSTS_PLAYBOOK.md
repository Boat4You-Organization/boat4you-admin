# Dnevne objave — playbook (Mario + Jadranka, sve sesije)

Ovo je **zajednička memorija** za sve Claude sesije (na bilo kojem računalu) koje pripremaju ručne dnevne objave za
društvene mreže. Sesije ne dijele razgovor — dijele ovaj repo. Zato:

1. Na početku: `git pull` i pročitaj ovaj file + zadnjih 7 dana u `docs/social/posts/`.
2. Kad Mario ili Jadranka kažu „daj objave“: napravi paket (format niže) u `docs/social/posts/YYYY-MM-DD-<ime>.md`
   (npr. `2026-11-06-mario.md`), upiši temu u **Dnevnik tema** niže, commit + push.
3. Nikad ne ponavljaj temu (brod / lokaciju / itinerar) istog branda iz zadnjih **30 dana**; isti otok smije na dva
   branda isti dan samo ako je kut drugačiji. Ako je danas već netko radio paket (drugi file s istim datumom) —
   biraj druge teme.

Generičke objave (AI dnevne objave u adminu → `/social/ai`) idu automatski; ovo su **dodatne, ručne** objave.

## Brandovi i kanali

| Brand              | Site id               | Web (link u objavi)                           | Fokus                                     |
| ------------------ | --------------------- | --------------------------------------------- | ----------------------------------------- |
| Boat4You           | `boat4you`            | https://www.boat4you.com                      | sve destinacije, svi tipovi brodova       |
| Catamaran Croatia  | `catamaran-croatia`   | https://www.catamaran-croatia-charter.com     | katamarani, Hrvatska                      |
| Catamaran Greece   | `catamaran-greece`    | https://www.catamaran-charter-greece.com      | katamarani, Grčka                         |
| Catamaran Italy    | `catamaran-italy`     | https://www.catamarancharteritaly.com         | katamarani, Italija                       |
| Catamaran Caribbean| `catamaran-caribbean` | https://www.catamaran-charter-caribbean.com   | katamarani, Karibi (sezona pro–tra)       |
| Europe Yachts      | `europe-yachts`       | https://www.europe-yachts.com                 | jedrilice/motorne/katamarani, cijela EU   |
| Croatia Yachting   | `croatia-yachting`    | https://www.croatia-yachting.com              | sve vrste brodova, Hrvatska               |

Mreže: Facebook (svaki brand), Instagram (2 računa — upiši ovdje koja: `TODO`), TikTok uskoro, YouTube jedan za sve.

## Što promoviramo (rotacija)

Svaki dan za svaki brand jedna od tema, mijenjaj tip iz dana u dan:

- **Brod** — konkretan brod iz flote tog weba (model, godina, kabine, marina) — samo podaci s weba/API-ja.
- **Lokacija** — otok, uvala, grad, nacionalni park.
- **Itinerar** — „posjetite X na ovom itineraru“ (7 dana, polazna marina, 3–5 stanica).
- **Savjet** — kako odabrati katamaran vs. jedrilicu, skipper ili bez, što ponijeti, vjetrovi…
- **Sezona / rani booking** — planiranje iduće sezone (bez izmišljenih popusta).

## Pravila

- **Nikad** cijene, popusti, raspoloživost ni podaci o brodu koje nismo provjerili na webu/API-ju.
  Ako sesija ne može otvoriti web (mrežni proxy), promovira lokacije/itinerare/savjete, ne konkretne brodove.
- Jezik: engleski (međunarodna publika); HR samo ako se traži.
- Facebook: 60–150 riječi, kuka u prvoj rečenici, poziv na akciju, link s UTM, 3–5 hashtagova.
- Instagram: kraće, emoji umjereno, „link in bio“ (linkovi nisu klikabilni), 15–25 hashtagova (max 30).
- TikTok (kad krene): hook za video 3 s + caption ≤ 150 znakova + 4–6 hashtagova.
- Slika: predloži koju fotku tražiti (brod iz flote ili lokacija); ne koristimo tuđe fotke bez prava.
- UTM: `?utm_source=facebook|instagram|tiktok&utm_medium=social&utm_campaign=daily-<yyyymmdd>`

## Format paketa (po brandu)

```
### <Brand>
Tema: <tip> — <što>
Slika: <prijedlog>
**Facebook** <tekst> + link + hashtagovi
**Instagram** <caption> + hashtagovi
**TikTok (kad bude)** hook + caption
```

## Dnevnik tema

| Datum      | Tko   | Brand               | Tip      | Tema                                  |
| ---------- | ----- | ------------------- | -------- | ------------------------------------- |
| 2026-11-06 | Mario | Boat4You            | Itinerar | Kornati NP iz Šibenika/Murtera        |
| 2026-11-06 | Mario | Catamaran Croatia   | Lokacija | Pakleni otoci & Hvar                  |
| 2026-11-06 | Mario | Catamaran Greece    | Lokacija | Milos — Kleftiko, Sarakiniko          |
| 2026-11-06 | Mario | Catamaran Italy     | Itinerar | Eolski otoci — Stromboli noću         |
| 2026-11-06 | Mario | Catamaran Caribbean | Sezona   | BVI — The Baths, početak sezone       |
| 2026-11-06 | Mario | Europe Yachts       | Savjet   | Katamaran vs. jedrilica               |
| 2026-11-06 | Mario | Croatia Yachting    | Itinerar | Dubrovnik — Elafiti — Mljet           |
