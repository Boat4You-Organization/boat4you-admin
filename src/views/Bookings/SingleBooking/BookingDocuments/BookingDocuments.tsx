/* eslint-disable no-nested-ternary, no-await-in-loop, no-restricted-syntax, no-void */
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import ReservationsService, { ReservationDocumentDto } from '@/services/reservations.service';
import { bbColors } from '@/styles/bb';

interface BookingDocumentsProps {
  reservationId: number;
  /** When true, this drop zone uploads as `internal=true` and only lists docs
   *  whose `isInternal === true`. Heading renders in red. Customer never sees
   *  these files in /my-bookings. Default false = customer-visible drawer. */
  internal?: boolean;
}

/**
 * Admin-only document attachments per reservation. Lets Mario upload PDFs /
 * Word docs (signed contracts, deposit receipts, customer correspondence)
 * and re-open or delete them later. Sits in the booking detail right column
 * under the Charter agreement / Cancel booking actions.
 *
 * Files are PDF, DOC, or DOCX, ≤20MB. Storage is DB BYTEA on the backend
 * with cascade delete tied to the reservation.
 */
const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  
return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);

    if (isNaN(d.getTime())) return '';

    
return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const BookingDocuments = ({ reservationId, internal = false }: BookingDocumentsProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<ReservationDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const reload = async () => {
    setLoading(true);

    const list = await ReservationsService.listReservationDocuments(reservationId);

    // Backend returns ALL docs to admin; we split client-side so the customer
    // and internal drawers each render their own slice.
    setDocuments(list.filter(d => d.isInternal === internal));
    setLoading(false);
  };

  useEffect(() => {
    void reload();
    // reservationId is stable per route — re-render only when route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const handlePick = () => {
    fileInputRef.current?.click();
  };

  /** Upload one or more files in series. Used by both the file picker and
   *  the drag-and-drop drop zone. The toast / reload logic is the same in
   *  both paths so callers don't have to duplicate it. */
  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);

    if (list.length === 0) return;

    setUploading(true);

    let anyOk = false;

    for (const file of list) {
      const created = await ReservationsService.uploadReservationDocument(reservationId, file, internal);

      if (created) anyOk = true;
    }

    setUploading(false);

    if (anyOk) {
      await reload();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const {files} = e.target;

    // Reset the input so the SAME file can be re-uploaded later (otherwise
    // `change` doesn't fire on identical filenames).
    e.target.value = '';

    if (!files || files.length === 0) return;

    await uploadFiles(files);
  };

  /** Drag/drop handlers. We track a counter rather than relying on
   *  `dragenter`/`dragleave` directly because those events fire for every
   *  child node — without the counter the drop zone flickers as the
   *  cursor moves over inner elements. */
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (uploading) return;

    if (!Array.from(e.dataTransfer.types).includes('Files')) return;

    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    // Required: without preventDefault the drop event never fires.
    e.preventDefault();
    e.stopPropagation();

    if (!uploading) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (uploading) return;

    const {files} = e.dataTransfer;

    if (!files || files.length === 0) return;

    await uploadFiles(files);
  };

  const handleOpen = async (doc: ReservationDocumentDto) => {
    await ReservationsService.openReservationDocument(reservationId, doc.id, doc.filename, doc.contentType);
  };

  const handleDelete = async (doc: ReservationDocumentDto) => {
    const ok = window.confirm(
      t('booking.documents.confirm-delete', `Delete "${doc.filename}"? This cannot be undone.`) as string,
    );

    if (!ok) return;

    const deleted = await ReservationsService.deleteReservationDocument(reservationId, doc.id);

    if (deleted) {
      await reload();
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Section header — internal docs use red label so Mario can never
          confuse the two drawers and accidentally upload a private note to
          the customer-visible one. */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.6,
            color: internal ? '#c62828' : bbColors.gray600,
            textTransform: 'uppercase',
          }}
        >
          {internal
            ? t('booking.documents.internal-title', 'Internal documentation')
            : t('booking.documents.title', 'Documents')}
        </Typography>
        <Typography sx={{ fontSize: 11, color: internal ? '#c62828' : bbColors.gray500 }}>
          {documents.length > 0 ? `${documents.length}` : ''}
        </Typography>
      </Stack>

      {/* List */}
      {loading ? (
        <Typography sx={{ fontSize: 12, color: bbColors.gray500, fontStyle: 'italic' }}>
          {t('booking.documents.loading', 'Loading…')}
        </Typography>
      ) : documents.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: bbColors.gray500, fontStyle: 'italic' }}>
          {t('booking.documents.empty', 'No documents attached yet.')}
        </Typography>
      ) : (
        <Stack spacing={0.75} sx={{ mb: 1.5 }}>
          {documents.map((doc) => (
            <Box
              key={doc.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.75,
                borderRadius: '6px',
                backgroundColor: bbColors.gray100,
                border: `1px solid ${bbColors.gray200}`,
              }}
            >
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: bbColors.gray600, flexShrink: 0 }} />
              <Box
                sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => handleOpen(doc)}
                title={t('booking.documents.open', 'Open document') as string}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: bbColors.gray600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {doc.filename}
                </Typography>
                <Typography sx={{ fontSize: 10, color: bbColors.gray500 }}>
                  {formatSize(doc.sizeBytes)}
                  {doc.uploadedAt ? ` · ${formatDate(doc.uploadedAt)}` : ''}
                </Typography>
              </Box>
              <Tooltip title={t('booking.documents.download', 'Download') as string}>
                <IconButton size="small" onClick={() => handleOpen(doc)} sx={{ color: bbColors.gray600 }}>
                  <DownloadIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('booking.documents.delete', 'Delete') as string}>
                <IconButton size="small" onClick={() => handleDelete(doc)} sx={{ color: bbColors.red600 }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}

      {/* Upload drop zone — click anywhere or drag a file in.
          Wrapper handles drag/drop events; the inner button is a fallback
          for keyboard / accessibility. Visual state flips when a file is
          being dragged over. */}
      <Box
        onClick={uploading ? undefined : handlePick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={uploading ? -1 : 0}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          padding: '14px 12px',
          borderRadius: '6px',
          border: `1.5px dashed ${isDragging ? bbColors.navy700 : bbColors.gray300}`,
          background: isDragging ? bbColors.gray100 : 'transparent',
          color: isDragging ? bbColors.navy700 : bbColors.gray600,
          cursor: uploading ? 'progress' : 'pointer',
          textAlign: 'center',
          transition: 'background-color 120ms, border-color 120ms, color 120ms',
          '&:hover': uploading
            ? undefined
            : { backgroundColor: bbColors.gray100, borderColor: bbColors.gray500 },
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <UploadFileIcon sx={{ fontSize: 22 }} />
        <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
          {uploading
            ? t('booking.documents.uploading', 'Uploading…')
            : isDragging
              ? t('booking.documents.drop-now', 'Drop to upload')
              : t('booking.documents.drop-or-click', 'Drop files here or click to upload')}
        </Typography>
        {!uploading && !isDragging && (
          <Typography sx={{ fontSize: 10, color: bbColors.gray500, fontWeight: 500 }}>
            {t('booking.documents.types-hint', 'PDF, DOC, DOCX up to 20 MB')}
          </Typography>
        )}
      </Box>

      {/* Hidden native input — clicking the button above proxies into here */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default BookingDocuments;
