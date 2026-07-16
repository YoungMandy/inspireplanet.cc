import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import Loading from '../../components/Loading';
import { WritingPost } from '../../netlify/types';
import { writingsApi } from '../../netlify/config';
import { formatDate } from '../../utils/date';
import { useGlobalSnackbar } from '../../context/app';
import HighlightedText from '../../components/writing/HighlightedText';

const WritingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const showSnackbar = useGlobalSnackbar();
  const [post, setPost] = useState<WritingPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

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
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default WritingDetail;
