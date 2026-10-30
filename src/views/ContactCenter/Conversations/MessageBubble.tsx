/* One message: author and time above the bubble, the text as a React text node with line breaks kept (ADMIN-12), the
 * AI's boat cards under it. */
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import { MessageView } from '@/types/contactCenter.type';
import { cc } from '@/views/ContactCenter/ui';

import YachtCards from './YachtCards';

const LOOK: Record<string, { bg: string; border: string; align: 'flex-start' | 'flex-end' }> = {
  USER: { bg: '#F1F4F7', border: '#E5EAF0', align: 'flex-start' },
  ASSISTANT: { bg: '#E8F0FB', border: '#CFDDF4', align: 'flex-end' },
  ADMIN: { bg: '#E3F6EC', border: '#BFE8D2', align: 'flex-end' },
  SYSTEM: { bg: '#FEF3C7', border: '#F4E1A0', align: 'flex-end' },
};

const MessageBubble = ({ message, siteId, visitor }: { message: MessageView; siteId: string; visitor: string }) => {
  const { t } = useTranslation('contactCenter');
  const look = LOOK[message.role] ?? LOOK.SYSTEM;
  const author = message.role === 'USER' ? visitor : t(`role.${message.role}`, { defaultValue: message.role });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxWidth: '85%',
        alignSelf: look.align,
        alignItems: look.align,
      }}
    >
      <Box component="span" sx={{ fontSize: 11.5, color: cc.muted }}>
        <Box component="strong" sx={{ fontWeight: 600, color: cc.text }}>
          {author}
        </Box>
        {` · ${dayjs(message.createdAt).format('DD.MM. HH:mm')}`}
      </Box>
      <Box
        sx={{
          p: '10px 13px',
          borderRadius: '12px',
          bgcolor: look.bg,
          border: `1px solid ${look.border}`,
          fontSize: 14,
          lineHeight: 1.5,
          color: cc.ink,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </Box>
      {message.role === 'ASSISTANT' && <YachtCards payload={message.payload} siteId={siteId} />}
    </Box>
  );
};

export default MessageBubble;
