import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { WritingPost } from '../../netlify/types';
import { formatDate } from '../../utils/date';
import HighlightedText from './HighlightedText';

interface WritingCardProps {
  post: WritingPost;
  onClick: (id: string) => void;
}

function getPreview(post: WritingPost): string {
  if (post.body.trim()) return post.body.trim();
  return (
    post.template_snapshot?.items.find((item) => item.answer.trim())?.answer ||
    ''
  );
}

const WritingCard: React.FC<WritingCardProps> = ({ post, onClick }) => {
  const preview = getPreview(post);
  const title =
    post.title || post.template_snapshot?.template_name || '一则自我观察';

  return (
    <Card
      elevation={1}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
      }}
    >
      <CardActionArea onClick={() => onClick(post.id)} sx={{ height: '100%' }}>
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 3,
          }}
        >
          {post.image_urls[0] && (
            <Box
              component="img"
              src={post.image_urls[0]}
              alt={title}
              loading="lazy"
              sx={{
                width: 'calc(100% + 48px)',
                height: 190,
                objectFit: 'cover',
                mx: -3,
                mt: -3,
                mb: 2.5,
              }}
            />
          )}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            {post.visibility === 'private' && (
              <Chip label="仅自己可见" size="small" variant="outlined" />
            )}
            {post.template_snapshot && (
              <Chip
                label={post.template_snapshot.template_name}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>

          <Typography variant="h6" component="h2" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: 'pre-wrap',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 5,
              overflow: 'hidden',
              minHeight: 100,
              mb: 2,
            }}
          >
            <HighlightedText text={preview || '还没有正文内容'} />
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
            {post.topics.map((topic) => (
              <Chip
                key={topic.id}
                label={topic.name}
                size="small"
                color={topic.is_user_created ? 'secondary' : 'default'}
                variant={topic.is_user_created ? 'filled' : 'outlined'}
              />
            ))}
          </Box>

          <Box sx={{ mt: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              {post.author.name} · {formatDate(post.created_at)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default WritingCard;
