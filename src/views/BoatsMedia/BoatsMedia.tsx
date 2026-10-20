/* Boats · Media (Mario 17.10.2026, "ubaci i crew profile na allure tako da ga imamo na svim stranicama"): our own
 * photos, a video and the crew-profile PDF for ANY boat, partner-synced ones included, shown on all 7 sites through
 * GET /public/yachts/{slug}. SYSTEM_ADMIN only, like the backend /admin/yachts/** endpoints. Plus the catalogue-wide
 * image-hygiene repairs (V9_91). All boat- and backend-derived values render as React text nodes. */
import { Fragment, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

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
  YachtMediaDto,
  errorMessage,
  mediaImagesOf,
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
  /** GET /admin/yachts/{id}/media failed. */
  error: string | null;
  /** GET /public/yachts/{slug} failed (an inactive boat has no public page): the twin check could not run. */
  publicError: string | null;
  /** The boat the public page really serves (a cross-source twin resolves to its canonical copy). */
  servedYachtId: number | null;
  /** yacht.video_url. */
  videoUrl: string | null;
  /** A custom boat's own video (Custom boats page): the sites show it while videoUrl is empty. */
  customVideoUrl: string | null;
  crewProfileUrl: string | null;
}

const EMPTY_MEDIA: MediaState = {
  loading: false,
  error: null,
  publicError: null,
  servedYachtId: null,
  videoUrl: null,
  customVideoUrl: null,
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
  const lookupSeq = useRef(0);
  // The selected boat, set by select() only: an answer (load, upload, order, delete, video, crew profile) that arrives
  // after the admin picked another boat is dropped, so one boat's media never shows under another boat's card.
  const selectedId = useRef<number | null>(null);
  const loadSeq = useRef(0);

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

  const loadMedia = useCallback(async (target: YachtLookupItem) => {
    // e.g. the reload at the end of an upload that finished after another boat was picked
    if (selectedId.current !== target.id) return;

    loadSeq.current += 1;

    const seq = loadSeq.current;

    setMedia(prev => ({ ...prev, loading: true, error: null }));

    const [admin, site] = await Promise.allSettled([
      YachtMediaService.getMedia(target.id),
      YachtMediaService.getPublicDetail(target.slug),
    ]);

    if (seq !== loadSeq.current || selectedId.current !== target.id) return;

    if (admin.status === 'fulfilled') setImages(mediaImagesOf(admin.value));

    setMedia(prev => ({
      ...prev,
      loading: false,
      error: admin.status === 'rejected' ? errorMessage(admin.reason, 'The boat media could not be read.') : null,
      publicError:
        site.status === 'rejected' ? errorMessage(site.reason, 'The public boat page could not be read.') : null,
      servedYachtId: site.status === 'fulfilled' ? site.value.id : null,
      customVideoUrl: site.status === 'fulfilled' ? (site.value.customDetails?.videoUrl ?? null) : null,
      ...(admin.status === 'fulfilled'
        ? { videoUrl: admin.value.videoUrl, crewProfileUrl: admin.value.crewProfileUrl }
        : {}),
    }));
  }, []);

  /** A media answer (upload, order, delete, video, crew profile): applied only while its boat is still selected. */
  const applyMedia = useCallback((dto: YachtMediaDto) => {
    if (selectedId.current !== dto.yachtId) return;

    setImages(mediaImagesOf(dto));
    setMedia(prev => ({ ...prev, videoUrl: dto.videoUrl, crewProfileUrl: dto.crewProfileUrl }));
  }, []);

  /** Grid changes made for one boat: dropped once another boat is selected. */
  const setImagesOf = useCallback(
    (yachtId: number) => (action: SetStateAction<MediaImage[]>) => {
      if (selectedId.current === yachtId) setImages(action);
    },
    []
  );

  const select = (item: YachtLookupItem) => {
    selectedId.current = item.id;
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
                The boat media could not be read ({media.error}), so the grid is empty. Reload to try again.
              </Alert>
            )}
            {media.publicError && (
              <Alert severity="info" sx={{ mb: 2, fontSize: 12.5 }}>
                The public boat page could not be read ({media.publicError}) - an inactive boat has none - so the twin
                check was skipped. Media added here shows on the sites once the boat page is public.
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
          // one key for the three sections: a new boat mounts them afresh (no upload list, draft or dialog carried over)
          <Fragment key={yacht.id}>
            <OwnPhotos
              yacht={yacht}
              label={label}
              images={images}
              setImages={setImagesOf(yacht.id)}
              onMedia={applyMedia}
              reload={() => loadMedia(yacht)}
              loading={media.loading}
            />
            <VideoSection
              yacht={yacht}
              label={label}
              videoUrl={media.videoUrl}
              customVideoUrl={media.customVideoUrl}
              onMedia={applyMedia}
            />
            <CrewProfileSection yacht={yacht} label={label} url={media.crewProfileUrl} onMedia={applyMedia} />
          </Fragment>
        )}

        <ImageHygiene />
      </Box>
    </Layout>
  );
};

export default BoatsMedia;
