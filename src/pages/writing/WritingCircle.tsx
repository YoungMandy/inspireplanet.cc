import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WritingCard from '../../components/writing/WritingCard';
import Loading from '../../components/Loading';
import Empty from '../../components/Empty';
import { WritingPost, WritingTopic } from '../../netlify/types';
import { writingsApi, writingTopicsApi } from '../../netlify/config';
import { isUserLoggedIn } from '../../utils/user';

const PAGE_SIZE = 9;

const WritingCircle: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [topics, setTopics] = useState<WritingTopic[]>([]);
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const scope = searchParams.get('scope') === 'mine' ? 'mine' : 'all';
  const topicId = searchParams.get('topic') || '';
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'latest';
  const parsedPage = Number(searchParams.get('page'));
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  useEffect(() => {
    let active = true;
    writingTopicsApi.getAll().then((response) => {
      if (active && response.success) {
        setTopics(response.data?.topics || []);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    writingsApi
      .list({
        scope,
        topic_ids: topicId ? [topicId] : undefined,
        sort,
        page,
        page_size: PAGE_SIZE,
      })
      .then((response) => {
        if (!active) return;
        if (!response.success) {
          setError(response.error || '加载书写失败');
          return;
        }
        setPosts(response.data?.records || []);
        setTotal(response.data?.total || 0);
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
  }, [page, scope, sort, topicId]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const handleScopeChange = (_event: React.SyntheticEvent, value: string) => {
    if (value === 'mine' && !isUserLoggedIn()) {
      navigate(
        `/login?redirect=${encodeURIComponent('/writing-circle?scope=mine')}`
      );
      return;
    }
    updateParams({ scope: value === 'mine' ? 'mine' : null, page: null });
  };

  const handleCreate = () => {
    if (!isUserLoggedIn()) {
      navigate(`/login?redirect=${encodeURIComponent('/writing-circle/new')}`);
      return;
    }
    navigate('/writing-circle/new');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f5f2', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 3,
            borderRadius: 4,
            bgcolor: '#fffaf4',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={3}
          >
            <Box>
              <Typography
                variant="h3"
                component="h1"
                fontWeight={800}
                gutterBottom
              >
                书写圈子
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 680 }}>
                用话题和书写模板记录自我观察，让零散的感受慢慢成为可以回看的成长轨迹。
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              size="large"
              sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
            >
              开始书写
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
            >
              <Tabs value={scope} onChange={handleScopeChange}>
                <Tab value="all" label="全部书写" />
                <Tab value="mine" label="我的书写" />
              </Tabs>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel id="writing-sort-label">时间排序</InputLabel>
                <Select
                  labelId="writing-sort-label"
                  label="时间排序"
                  value={sort}
                  onChange={(event) =>
                    updateParams({
                      sort: event.target.value === 'oldest' ? 'oldest' : null,
                      page: null,
                    })
                  }
                >
                  <MenuItem value="latest">最新发布</MenuItem>
                  <MenuItem value="oldest">最早发布</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="全部话题"
                color={!topicId ? 'primary' : 'default'}
                onClick={() => updateParams({ topic: null, page: null })}
              />
              {topics.map((topic) => (
                <Chip
                  key={topic.id}
                  label={topic.name}
                  color={topic.id === topicId ? 'primary' : 'default'}
                  variant={topic.id === topicId ? 'filled' : 'outlined'}
                  onClick={() =>
                    updateParams({
                      topic: topic.id === topicId ? null : topic.id,
                      page: null,
                    })
                  }
                />
              ))}
            </Box>
          </Stack>
        </Paper>

        {loading ? (
          <Loading message="正在加载书写..." />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : posts.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3 }}>
            <Empty
              message={scope === 'mine' ? '还没有书写记录' : '还没有公开书写'}
              description="从一次真实的自我观察开始吧"
            />
          </Paper>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 3,
              }}
            >
              {posts.map((post) => (
                <WritingCard
                  key={post.id}
                  post={post}
                  onClick={(id) => navigate(`/writing-circle/${id}`)}
                />
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Pagination
                  page={page}
                  count={totalPages}
                  color="primary"
                  onChange={(_event, value) => {
                    updateParams({ page: value === 1 ? null : String(value) });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default WritingCircle;
