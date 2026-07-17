import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import Loading from '../../components/Loading';
import { WritingComment, WritingPost } from '../../netlify/types';
import { writingInteractionsApi, writingsApi } from '../../netlify/config';
import { formatDate } from '../../utils/date';
import { useGlobalSnackbar } from '../../context/app';
import HighlightedText from '../../components/writing/HighlightedText';
import { isUserLoggedIn } from '../../utils/user';

const WritingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const showSnackbar = useGlobalSnackbar();
  const [post, setPost] = useState<WritingPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<WritingComment[]>([]);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<WritingComment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(true);
  const [resonanceLoading, setResonanceLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let active = true;
    if (!id) {
      setError('书写 ID 无效');
      setLoading(false);
      return;
    }

    writingsApi
      .getById(id)
      .then((response) => {
        if (!active) return;
        if (!response.success || !response.data?.post) {
          setError(response.error || '书写不存在或不可访问');
          return;
        }
        setPost(response.data.post);
        writingInteractionsApi
          .get(id)
          .then((interaction) => {
            if (!active || !interaction.success || !interaction.data) return;
            setComments(interaction.data.comments);
            setPost((current) =>
              current
                ? {
                    ...current,
                    resonance_count: interaction.data!.resonance_count,
                    has_resonated: interaction.data!.has_resonated,
                    comment_count: interaction.data!.comments.length,
                  }
                : current
            );
          })
          .finally(() => {
            if (active) setInteractionLoading(false);
          });
      })
      .catch(() => {
        if (active) setError('加载书写失败，请稍后重试');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('确定删除这篇书写吗？删除后无法恢复。')) return;
    setDeleting(true);
    try {
      const response = await writingsApi.delete(id);
      if (!response.success) {
        showSnackbar.error(response.error || '删除失败');
        return;
      }
      showSnackbar.success('书写已删除');
      navigate('/writing-circle?scope=mine');
    } catch {
      showSnackbar.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const requireLogin = () => {
    if (isUserLoggedIn()) return true;
    navigate(`/login?redirect=${encodeURIComponent(`/writing-circle/${id}`)}`);
    return false;
  };

  const handleResonance = async () => {
    if (!id || resonanceLoading || !requireLogin()) return;
    setResonanceLoading(true);
    try {
      const response = await writingInteractionsApi.toggleResonance(id);
      if (response.success && response.data)
        setPost((current) =>
          current ? { ...current, ...response.data } : current
        );
      else showSnackbar.error(response.error || '操作失败');
    } finally {
      setResonanceLoading(false);
    }
  };

  const handleComment = async () => {
    if (!id || !comment.trim() || !requireLogin()) return;
    setSubmitting(true);
    try {
      const response = await writingInteractionsApi.addComment(id, comment);
      if (!response.success || !response.data)
        return showSnackbar.error(response.error || '评论失败');
      setComments((current) => [...current, response.data!.comment]);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!id || !replyTo || !replyContent.trim() || !requireLogin()) return;
    setSubmitting(true);
    try {
      const response = await writingInteractionsApi.addComment(
        id,
        replyContent,
        replyTo.id
      );
      if (!response.success || !response.data)
        return showSnackbar.error(response.error || '回复失败');
      setComments((current) => [...current, response.data!.comment]);
      setReplyTo(null);
      setReplyContent('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId) return;
    setDeletingCommentId(commentId);
    const response = await writingInteractionsApi.deleteComment(commentId);
    if (response.success) {
      setComments((current) => {
        const removed = new Set([commentId]);
        let changed = true;
        while (changed) {
          changed = false;
          current.forEach((item) => {
            if (
              item.parent_id &&
              removed.has(item.parent_id) &&
              !removed.has(item.id)
            ) {
              removed.add(item.id);
              changed = true;
            }
          });
        }
        return current.filter((item) => !removed.has(item.id));
      });
    } else showSnackbar.error(response.error || '删除失败');
    setDeletingCommentId(null);
  };

  const renderReplyEditor = (item: WritingComment) =>
    replyTo?.id === item.id ? (
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1 }}>
        <TextField
          fullWidth
          autoFocus
          multiline
          minRows={2}
          size="small"
          value={replyContent}
          onChange={(event) =>
            setReplyContent(event.target.value.slice(0, 500))
          }
          placeholder={`回复 ${item.author.name}，分享你的感受……`}
          helperText={`${replyContent.length}/500`}
        />
        <Stack>
          <Button
            variant="contained"
            size="small"
            onClick={handleReply}
            disabled={!replyContent.trim() || submitting}
          >
            {submitting ? '发送中…' : '发送'}
          </Button>
          <Button size="small" onClick={() => setReplyTo(null)}>
            取消
          </Button>
        </Stack>
      </Stack>
    ) : null;

  const getDescendants = (parentId: string): WritingComment[] => {
    const direct = comments.filter((item) => item.parent_id === parentId);
    return direct.flatMap((item) => [item, ...getDescendants(item.id)]);
  };

  const startReply = (item: WritingComment) => {
    if (!requireLogin()) return;
    setReplyTo(item);
    setReplyContent('');
  };

  const renderComment = (item: WritingComment): React.ReactNode => {
    const replies = getDescendants(item.id);
    return (
      <Stack
        key={item.id}
        direction="row"
        spacing={1.5}
        alignItems="flex-start"
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 38,
            height: 38,
            bgcolor: '#e7a977',
            fontSize: 16,
            borderRadius: 1,
          }}
        >
          {item.author.name.slice(0, 1)}
        </Avatar>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography fontWeight={700} color="#576b95" fontSize={14}>
            {item.author.name}
          </Typography>
          <Typography
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mt: 0.25 }}
          >
            {item.content}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ mt: 0.25 }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatDate(item.created_at)}
            </Typography>
            <Button
              size="small"
              sx={{ minWidth: 0, px: 0.75, color: 'text.secondary' }}
              onClick={() => startReply(item)}
            >
              回复
            </Button>
            {item.can_delete && (
              <Button
                size="small"
                color="error"
                sx={{ minWidth: 0, px: 0.75 }}
                onClick={() => handleDeleteComment(item.id)}
                disabled={Boolean(deletingCommentId)}
              >
                {deletingCommentId === item.id ? '删除中…' : '删除'}
              </Button>
            )}
          </Stack>
          {renderReplyEditor(item)}
          {replies.length > 0 && (
            <Box
              sx={{
                mt: 1,
                px: 1.5,
                py: 1,
                bgcolor: '#f5f5f5',
                borderRadius: 1.5,
              }}
            >
              {replies.map((reply) => {
                const parent = comments.find(
                  (candidate) => candidate.id === reply.parent_id
                );
                return (
                  <Box key={reply.id} sx={{ py: 0.5 }}>
                    <Typography
                      component="div"
                      variant="body2"
                      sx={{
                        lineHeight: 1.65,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ color: '#576b95', fontWeight: 700 }}
                      >
                        {reply.author.name}
                      </Box>
                      {parent && parent.id !== item.id && (
                        <>
                          <Box
                            component="span"
                            sx={{ color: 'text.secondary' }}
                          >
                            {' '}
                            回复{' '}
                          </Box>
                          <Box
                            component="span"
                            sx={{ color: '#576b95', fontWeight: 700 }}
                          >
                            {parent.author.name}
                          </Box>
                        </>
                      )}
                      <Box component="span">：{reply.content}</Box>
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(reply.created_at)}
                      </Typography>
                      <Button
                        size="small"
                        sx={{ minWidth: 0, px: 0.75, color: 'text.secondary' }}
                        onClick={() => startReply(reply)}
                      >
                        回复
                      </Button>
                      {reply.can_delete && (
                        <Button
                          size="small"
                          color="error"
                          sx={{ minWidth: 0, px: 0.75 }}
                          onClick={() => handleDeleteComment(reply.id)}
                          disabled={Boolean(deletingCommentId)}
                        >
                          {deletingCommentId === reply.id ? '删除中…' : '删除'}
                        </Button>
                      )}
                    </Stack>
                    {renderReplyEditor(reply)}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Stack>
    );
  };

  if (loading) return <Loading message="正在打开这篇书写..." />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f5f2', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/writing-circle')}
          sx={{ mb: 2 }}
        >
          返回书写圈子
        </Button>

        {error || !post ? (
          <Alert severity="error">{error || '书写不存在'}</Alert>
        ) : (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 6 }, borderRadius: 4 }}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Box
                    sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}
                  >
                    {post.visibility === 'private' && (
                      <Chip
                        label="仅自己可见"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {post.template_snapshot && (
                      <Chip
                        label={post.template_snapshot.template_name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="h3" component="h1" fontWeight={800}>
                    <HighlightedText
                      text={
                        post.title ||
                        post.template_snapshot?.template_name ||
                        '一则自我观察'
                      }
                    />
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {post.author.name} · {formatDate(post.created_at)}
                  </Typography>
                </Box>

                {post.can_edit && (
                  <Stack direction="row" spacing={1} alignSelf="flex-start">
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() =>
                        navigate(`/writing-circle/${post.id}/edit`)
                      }
                    >
                      编辑
                    </Button>
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      删除
                    </Button>
                  </Stack>
                )}
              </Stack>

              {post.image_urls.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm:
                        post.image_urls.length === 1
                          ? '1fr'
                          : 'repeat(2, minmax(0, 1fr))',
                    },
                    gap: 2,
                  }}
                >
                  {post.image_urls.map((imageUrl) => (
                    <Box
                      key={imageUrl}
                      component="a"
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={post.title || '书写配图'}
                        sx={{
                          display: 'block',
                          width: '100%',
                          maxHeight: 520,
                          objectFit: 'cover',
                          borderRadius: 3,
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {post.topics.map((topic) => (
                  <Chip
                    key={topic.id}
                    label={topic.name}
                    color={topic.is_user_created ? 'secondary' : 'default'}
                    variant={topic.is_user_created ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              {post.template_snapshot?.items.some((item) =>
                item.answer.trim()
              ) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                      模板观察
                    </Typography>
                    <Stack spacing={3}>
                      {post.template_snapshot.items
                        .filter((item) => item.answer.trim())
                        .map((item) => (
                          <Box key={item.key}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              gutterBottom
                            >
                              {item.prompt}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}
                            >
                              <HighlightedText text={item.answer} />
                            </Typography>
                          </Box>
                        ))}
                    </Stack>
                  </Box>
                </>
              )}

              {post.body.trim() && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                      正文
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                      <HighlightedText text={post.body} />
                    </Typography>
                  </Box>
                </>
              )}

              {post.visibility === 'public' && (
                <>
                  <Divider />
                  <Box>
                    <Button
                      onClick={handleResonance}
                      color={post.has_resonated ? 'error' : 'primary'}
                      disabled={resonanceLoading || interactionLoading}
                    >
                      {resonanceLoading
                        ? '处理中…'
                        : post.has_resonated
                          ? '已共鸣'
                          : '共鸣'}{' '}
                      · {post.resonance_count}
                    </Button>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      感受回应
                    </Typography>
                    <Alert severity="info" sx={{ my: 2 }}>
                      分享这篇书写带给你的个人感受即可。请不评价作者，也不提供建议或指导。
                    </Alert>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        value={comment}
                        onChange={(event) =>
                          setComment(event.target.value.slice(0, 500))
                        }
                        placeholder="例如：读到这里，我也想起了……"
                        helperText={`${comment.length}/500`}
                      />
                      <Button
                        variant="contained"
                        onClick={handleComment}
                        disabled={!comment.trim() || submitting}
                      >
                        {submitting ? '发送中…' : '发送'}
                      </Button>
                    </Stack>
                    {interactionLoading ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ py: 4 }}
                      >
                        <CircularProgress size={20} />
                        <Typography color="text.secondary">
                          正在加载回应…
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack spacing={2} sx={{ mt: 3 }}>
                        {comments
                          .filter((item) => !item.parent_id)
                          .map((item) => renderComment(item))}
                      </Stack>
                    )}
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default WritingDetail;
