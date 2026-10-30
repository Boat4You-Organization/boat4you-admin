/* One message with its author and time; text as a React text node with line breaks kept (ADMIN-12). */
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import { bbColors } from '@/styles/bb';
import { MessageView } from '@/types/contactCenter.type';

import YachtCards from './YachtCards';

const SIDE: Record<string, { bg: string; align: 'flex-start' | 'flex-end' }> = {
  USER: { bg: bbColors.gray75, align: 'flex-start' },
  ASSISTANT: { bg: '#eef4ff', align: 'flex-end' },
  ADMIN: { bg: bbColors.green100, align: 'flex-end' },
  SYSTEM: { bg: bbColors.amber100, align: 'flex-end' },
};

const MessageBubble = ({ message, siteId, visitor }: { message: MessageView; siteId: string; visitor: string }) => {
  const { t } = useTranslation('contactCenter');
  const side = SIDE[message.role] ?? SIDE.SYSTEM;
  const author = message.role === 'USER' ? visitor : t(`role.${message.role}`, { defaultValue: message.role });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: side.align, mb: 1.25 }}>
      <Box sx={{ fontSize: 11, color: bbColors.gray500, mb: 0.25 }}>
        {author} · {dayjs(message.createdAt).format('DD.MM. HH:mm')}
      </Box>
      <Box
        sx={{
          maxWidth: '85%',
          bgcolor: side.bg,
          borderRadius: 2,
          px: 1.5,
          py: 1,
          fontSize: 14,
          color: bbColors.navy900,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
        {message.role === 'ASSISTANT' && <YachtCards payload={message.payload} siteId={siteId} />}
      </Box>
    </Box>
  );
};

export default MessageBubble;
