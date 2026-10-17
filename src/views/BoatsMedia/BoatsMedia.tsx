/* Boats · Media (Mario 17.10.2026, "ubaci i crew profile na allure tako da ga imamo na svim stranicama"): our own
 * photos, a video and the crew-profile PDF for ANY boat, partner-synced ones included, shown on all 7 sites through
 * GET /public/yachts/{slug}. SYSTEM_ADMIN only, like the backend /admin/yachts/** endpoints. Plus the catalogue-wide
 * image-hygiene repairs (V9_91). All boat- and backend-derived values render as React text nodes. */
import { useCallback, useEffect, useRef, useState } from 'react';

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import debounce from 'lodash.debounce';

import Layout from '@/components/Layout';
import {
  MediaImage,
  YachtLookupItem,
  errorMessage,
  mergeMedia,
  publicImagesOf,
  yachtLabel,
} from '@/services/yacht-media.api';
import YachtMediaService, { CUSTOMER_WEB_URL, imageUrl } from '@/services/yacht-media.service';
import { bbCardSx, bbColors, bbFont } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';

import CrewProfileSection from './partials/CrewProfileSection';
import ImageHygiene from './partials/ImageHygiene';
import OwnPhotos from './partials/OwnPhotos';
import VideoSection from './partials/VideoSection';

interface MediaState {
  loading: boolean;
  error: string | null;
  /** The boat the public page really serves (a cross-source twin resolves to its canonical copy). */
  servedYachtId: number | null;
  videoUrl: string | null;
  crewProfileUrl: string | null;
}

const EMPTY_MEDIA: MediaState = {
  loading: false,
  error: null,
  servedYachtId: null,
  videoUrl: null,
  crewProfileUrl: null,
};

const pillSx = { height: 20, fontSize: 10.5, fontWeight: 800, borderRadius: '4px' } as const;

const BoatsMedia = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YachtLookupItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [yacht, setYacht] = useState<YachtLookupItem | null>(null);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [media, setMedia] = useState<MediaState>(EMPTY_MEDIA);
  // What this session learned per boat (uploads = OWN, PATCH answers): the public detail does not say it.
  const known = useRef(new Map<number, Map<number, Partial<MediaImage>>>());
  const lookupSeq = useRef(0);
  // The boat whose public detail is awaited: a slower answer for a boat no longer selected is dropped.
  const mediaFor = useRef<number | null>(null);

  const knownFor = useCallback((yachtId: number) => {
    let map = known.current.get(yachtId);

    if (!map) {
      map = new Map();
      known.current.set(yachtId, map);
    }

    return map;
  }, []);

  const search = useCallback(async (q: string) => {
    lookupSeq.current += 1;

    const seq = lookupSeq.current;

    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);

      return;
    }

    setSearching(true);
    try {
      const found = await YachtMediaService.lookup(q);

      if (seq === lookupSeq.current) {
        setResults(found);
        setSearched(true);
      }
    } catch (error) {
      if (seq === lookupSeq.current) {
        setResults([]);
        showToast({ status: 'error', text: errorMessage(error, 'The boat search failed.') });
      }
    } finally {
      if (seq === lookupSeq.current) setSearching(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- one debounced function for the page's lifetime
  const debouncedSearch = useCallback(debounce(search, 350), [search]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // A photo dropped next to the drop zone would make the browser open the file and leave the admin (the session
  // token lives in memory only): on this page a stray file drop does nothing.
  useEffect(() => {
    const ignoreFileDrop = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault();
    };

    window.addEventListener('dragover', ignoreFileDrop);
    window.addEventListener('drop', ignoreFileDrop);

    return () => {
      window.removeEventListener('dragover', ignoreFileDrop);
      window.removeEventListener('drop', ignoreFileDrop);
    };
  }, []);

  const loadMedia = useCallback(
    async (target: YachtLookupItem) => {
      mediaFor.current = target.id;
      setMedia(prev => ({ ...prev, loading: true, error: null }));
      try {
        const detail = await YachtMediaService.getPublicDetail(target.slug);

        if (mediaFor.current !== target.id) return;

        setImages(mergeMedia(publicImagesOf(detail), knownFor(target.id)));
        setMedia({
          loading: false,
          error: null,
          servedYachtId: detail.id,
          videoUrl: detail.videoUrl ?? detail.customDetails?.videoUrl ?? null,
          crewProfileUrl: detail.crewProfileUrl ?? null,
        });
      } catch (error) {
        if (mediaFor.current !== target.id) return;

        setImages(mergeMedia([], knownFor(target.id)));
        setMedia({
          ...EMPTY_MEDIA,
          error: errorMessage(error, 'The public boat page could not be read.'),
        });
      }
    },
    [knownFor]
  );

  const select = (item: YachtLookupItem) => {
    setYacht(item);
    setImages([]);
    setMedia({ ...EMPTY_MEDIA, loading: true });
    loadMedia(item);
  };

  const openTwin = async (id: number) => {
    try {
      const found = await YachtMediaService.lookup(String(id));
      const twin = found.find(y => y.id === id);

      if (twin) select(twin);
      else showToast({ status: 'warning', text: `Boat #${id} not found by the lookup.` });
    } catch (error) {
      showToast({ status: 'error', text: errorMessage(error, 'The boat search failed.') });
    }
  };

  const label = yacht ? yachtLabel(yacht) : '';
  const twinId = yacht && media.servedYachtId != null && media.servedYachtId !== yacht.id ? media.servedYachtId : null;
  const mainImageId = images.find(img => img.mainImage)?.id ?? yacht?.mainImageId ?? null;

  return (
    <Layout>
      <Box
        sx={{
          backgroundColor: bbColors.gray50,
          minHeight: '100vh',
          fontFamily: bbFont.stack,
          color: bbColors.navy900,
          pt: '74px',
          pb: 4,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}>
            Boats · Media
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
            Own photos, video and crew profile for any boat - partner-synced ones included - on all 7 sites
          </Typography>
        </Box>

        <Box sx={{ ...bbCardSx, p: { xs: 1.5, sm: 2 }, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Boat name or id, e.g. Allure or 11769"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              debouncedSearch(e.target.value);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                debouncedSearch.cancel();
                search(query);
              }
            }}
            slotProps={{
              htmlInput: { 'aria-label': 'Search a boat by name or id' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 18, color: bbColors.gray500 }} />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={16} />
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: 13, borderRadius: '6px' } }}
          />
          {searched && results.length === 0 && !searching && (
            <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 1.25 }}>No boat found.</Typography>
          )}
          {results.length > 0 && (
            <Stack sx={{ mt: 1.25, maxHeight: 320, overflowY: 'auto' }} role="listbox" aria-label="Boats found">
              {results.map(item => {
                const active = yacht?.id === item.id;

                return (
                  <Stack
                    key={item.id}
                    direction="row"
                    alignItems="center"
                    gap={1.25}
                    role="option"
                    aria-label={`${yachtLabel(item)}, #${item.id}`}
                    aria-selected={active}
                    tabIndex={0}
                    onClick={() => select(item)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        select(item);
                      }
                    }}
                    sx={{
                      p: 0.75,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: active ? '#eef4ff' : 'transparent',
                      '&:hover, &:focus-visible': { backgroundColor: bbColors.gray100, outline: 'none' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 44,
                        flexShrink: 0,
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: bbColors.gray200,
                      }}
                    >
                      {item.mainImageId != null && (
                        <Box
                          component="img"
                          src={imageUrl(item.mainImageId, 200)}
                          alt={yachtLabel(item)}
                          loading="lazy"
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }} noWrap>
                        {yachtLabel(item)}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: bbColors.gray500 }} noWrap>
                        #{item.id} · {item.entryType ?? '-'} · {item.vesselType ?? '-'} · {item.imageCount} image
                        {item.imageCount === 1 ? '' : 's'}
                        {item.hasVideo ? ' · video' : ''}
                        {item.hasCrewProfile ? ' · crew profile' : ''}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>

        {yacht && (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={2}
              sx={{ ...bbCardSx, p: { xs: 1.5, sm: 2 }, mb: 2 }}
              aria-label="Selected boat"
            >
              <Box
                sx={{
                  width: { xs: '100%', sm: 240 },
                  aspectRatio: '4 / 3',
                  flexShrink: 0,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: bbColors.gray200,
                }}
              >
                {mainImageId != null && (
                  <Box
                    component="img"
                    src={imageUrl(mainImageId, 400)}
                    alt={label}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>{label}</Typography>
                <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
                  {yacht.entryType && (
                    <Chip
                      label={yacht.entryType}
                      size="small"
                      sx={{ ...pillSx, backgroundColor: bbColors.amber100, color: bbColors.amber700 }}
                    />
                  )}
                  {yacht.vesselType && (
                    <Chip
                      label={yacht.vesselType}
                      size="small"
                      sx={{ ...pillSx, backgroundColor: bbColors.gray100, color: bbColors.navy900 }}
                    />
                  )}
                  <Chip
                    label={`#${yacht.id}`}
                    size="small"
                    sx={{ ...pillSx, backgroundColor: bbColors.gray100, color: bbColors.gray500 }}
                  />
                </Stack>
                <Link
                  href={`${CUSTOMER_WEB_URL}/boat/${encodeURIComponent(yacht.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: 12.5,
                    fontWeight: 700,
                    mt: 1.25,
                  }}
                >
                  Open the boat page <OpenInNewRoundedIcon sx={{ fontSize: 14 }} aria-hidden />
                </Link>
              </Box>
            </Stack>

            {media.error && (
              <Alert severity="warning" sx={{ mb: 2, fontSize: 12.5 }}>
                The public boat page could not be read ({media.error}), so the grid is empty. Uploads, video and crew
                profile still work.
              </Alert>
            )}
            {twinId != null && (
              <Alert
                severity="warning"
                sx={{ mb: 2, fontSize: 12.5 }}
                action={
                  <Button color="inherit" size="small" onClick={() => openTwin(twinId)}>
                    Open #{twinId}
                  </Button>
                }
              >
                The public page of this boat serves its twin #{twinId} (cross-source duplicate), so media added here
                would not show on the sites. Work on #{twinId} instead.
              </Alert>
            )}
          </>
        )}

        {yacht && twinId == null && (
          <>
            <OwnPhotos
              key={yacht.id}
              yacht={yacht}
              label={label}
              images={images}
              setImages={setImages}
              reload={() => loadMedia(yacht)}
              remember={(id, state) => {
                const map = knownFor(yacht.id);

                map.set(id, { ...map.get(id), ...state });
              }}
              forget={id => knownFor(yacht.id).delete(id)}
              loading={media.loading}
            />
            <VideoSection
              key={yacht.id}
              yacht={yacht}
              label={label}
              videoUrl={media.videoUrl}
              onSaved={videoUrl => setMedia(prev => ({ ...prev, videoUrl }))}
            />
            <CrewProfileSection
              key={yacht.id}
              yacht={yacht}
              label={label}
              url={media.crewProfileUrl}
              onChanged={crewProfileUrl => setMedia(prev => ({ ...prev, crewProfileUrl }))}
            />
          </>
        )}

        <ImageHygiene />
      </Box>
    </Layout>
  );
};

export default BoatsMedia;
