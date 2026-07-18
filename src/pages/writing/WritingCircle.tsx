import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
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
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import WritingCard from '../../components/writing/WritingCard';
import TopicChip from '../../components/writing/TopicChip';
import Loading from '../../components/Loading';
import Empty from '../../components/Empty';
import { WritingPost, WritingTopic } from '../../netlify/types';
import { writingsApi, writingTopicsApi } from '../../netlify/config';
import { isOrganizer, isUserLoggedIn } from '../../utils/user';

const PAGE_SIZE = 9;

function matchesTopic(topic: WritingTopic, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;

  const value = `${topic.name} ${topic.slug || ''}`.toLocaleLowerCase();
  if (value.includes(normalizedQuery)) return true;

  let queryIndex = 0;
  for (const character of value) {
    if (character === normalizedQuery[queryIndex]) queryIndex += 1;
    if (queryIndex === normalizedQuery.length) return true;
  }
  return false;
}

function formatTimelineDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

const WritingCircle: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [topics, setTopics] = useState<WritingTopic[]>([]);
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [topicQuery, setTopicQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const scope = searchParams.get('scope') === 'mine' ? 'mine' : 'all';
  const topicId = searchParams.get('topic') || '';
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'latest';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.get('date') || '')
    ? searchParams.get('date') || ''
    : '';
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
        date: date || undefined,
        timezone_offset: new Date().getTimezoneOffset(),
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
  }, [date, page, retryCount, scope, sort, topicId]);

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
  const orderedTopics = topicId
    ? [
        ...topics.filter((topic) => topic.id === topicId),
        ...topics.filter((topic) => topic.id !== topicId),
      ]
    : topics;
  const canCollapseTopics = topics.length > 4;
  const matchingTopics = orderedTopics.filter((topic) =>
    matchesTopic(topic, topicQuery)
  );
  const isSearchingTopics = Boolean(topicQuery.trim());

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f7f5f2',
        pt: { xs: 3, md: 6 },
        pb: { xs: 14, sm: 12 },
      }}
    >
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
          <Stack spacing={1}>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                fontWeight={750}
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}
              >
                书写圈子
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 680 }}
              >
                用话题和书写模板记录自我观察，让零散的感受慢慢成为可以回看的成长轨迹。
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
            >
              <Tabs
                value={scope}
                onChange={handleScopeChange}
                variant="fullWidth"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                <Tab value="all" label="全部书写" />
                <Tab value="mine" label="我的书写" />
              </Tabs>
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                <TextField
                  type="date"
                  size="small"
                  value={date}
                  onChange={(event) =>
                    updateParams({
                      date: event.target.value || null,
                      page: null,
                    })
                  }
                  aria-label="按发布日期筛选"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <CalendarMonthOutlinedIcon
                          color="action"
                          sx={{ mr: 0.75, fontSize: 19 }}
                        />
                      ),
                    },
                  }}
                  sx={{ flex: 1, minWidth: 0, width: { sm: 175 } }}
                />
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: 115, sm: 130 } }}
                >
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
            </Stack>

            <Box>
              <TextField
                fullWidth
                size="small"
                value={topicQuery}
                onChange={(event) => setTopicQuery(event.target.value)}
                placeholder="按书写话题名称搜索"
                aria-label="搜索话题"
                slotProps={{
                  input: {
                    startAdornment: (
                      <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                    ),
                  },
                }}
                sx={{
                  display: { xs: 'flex', sm: 'flex' },
                  mb: 2,
                  maxWidth: 420,
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 1.25 }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <LocalOfferOutlinedIcon
                    color="action"
                    sx={{ fontSize: 19 }}
                  />
                  <Typography variant="subtitle2" fontWeight={700}>
                    按话题筛选
                  </Typography>
                  {topicId && (
                    <Typography variant="caption" color="text.secondary">
                      已选 1 个
                    </Typography>
                  )}
                </Stack>
                {canCollapseTopics && !isSearchingTopics && (
                  <Button
                    size="small"
                    color="inherit"
                    endIcon={
                      topicsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                    }
                    onClick={() => setTopicsExpanded((expanded) => !expanded)}
                    aria-expanded={topicsExpanded}
                    aria-controls="writing-topic-filters"
                    sx={{ color: 'text.secondary', flexShrink: 0 }}
                  >
                    {topicsExpanded ? '收起' : `展开全部（${topics.length}）`}
                  </Button>
                )}
              </Stack>

              <Collapse
                in={topicsExpanded || !canCollapseTopics || isSearchingTopics}
                collapsedSize={40}
                timeout={240}
              >
                <Box
                  id="writing-topic-filters"
                  sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
                >
                  {!isSearchingTopics && (
                    <Chip
                      label="全部话题"
                      variant="outlined"
                      onClick={() => updateParams({ topic: null, page: null })}
                      sx={{
                        borderColor: !topicId ? '#496a61' : '#d9d1c7',
                        bgcolor: !topicId ? '#496a61' : '#fcfaf7',
                        color: !topicId ? '#fff' : '#625a52',
                        fontWeight: !topicId ? 700 : 500,
                        '&:hover': {
                          bgcolor: !topicId ? '#3f5d55' : '#f3eee8',
                        },
                      }}
                    />
                  )}
                  {matchingTopics.map((topic) => (
                    <TopicChip
                      key={topic.id}
                      topic={topic}
                      selected={topic.id === topicId}
                      onClick={() =>
                        updateParams({
                          topic: topic.id === topicId ? null : topic.id,
                          page: null,
                        })
                      }
                    />
                  ))}
                  {isSearchingTopics && matchingTopics.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 0.75 }}
                    >
                      没有找到“{topicQuery.trim()}”相关话题
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </Paper>

        {loading ? (
          <Loading message="正在加载书写..." />
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                重试
              </Button>
            }
          >
            {error}
          </Alert>
        ) : posts.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3 }}>
            <Empty
              message={scope === 'mine' ? '还没有书写记录' : '还没有公开书写'}
              description="从一次真实的自我观察开始吧"
            />
          </Paper>
        ) : (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
              aria-live="polite"
            >
              共 {total} 篇书写{topicId ? '符合当前话题' : ''}
            </Typography>
            {scope === 'mine' ? (
              <Box sx={{ maxWidth: 860, mx: 'auto', py: { xs: 2, sm: 3 } }}>
                {posts.map((post, index) => (
                  <Box
                    key={post.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '28px minmax(0, 1fr)',
                        sm: '190px 28px minmax(0, 1fr)',
                      },
                      columnGap: { xs: 1.5, sm: 2.5 },
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                        textAlign: 'right',
                        pt: 1.25,
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatTimelineDate(post.created_at)}
                    </Typography>
                    <Box
                      sx={{
                        gridColumn: { xs: 1, sm: 2 },
                        gridRow: 1,
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 16,
                          bottom:
                            index === posts.length - 1
                              ? 'calc(100% - 17px)'
                              : -16,
                          width: 2,
                          bgcolor: '#d8cec2',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          mt: 1.25,
                          borderRadius: '50%',
                          bgcolor: '#e87545',
                          border: '3px solid #fff',
                          outline: '1px solid #e87545',
                          zIndex: 1,
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        gridColumn: { xs: 2, sm: 3 },
                        pb: index === posts.length - 1 ? 0 : { xs: 5, sm: 6 },
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: { xs: 'block', sm: 'none' },
                          mb: 0.75,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatTimelineDate(post.created_at)}
                      </Typography>
                      <WritingCard
                        post={post}
                        onClick={(id) => navigate(`/writing-circle/${id}`)}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
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
            )}

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

        <Paper
          square
          elevation={0}
          sx={{
            position: 'fixed',
            zIndex: (theme) => theme.zIndex.appBar,
            left: 0,
            right: 0,
            bottom: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(12px)',
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <Stack
            direction="row"
            justifyContent="center"
            spacing={1.5}
            sx={{
              maxWidth: 480,
              mx: 'auto',
              px: { xs: 2, sm: 3 },
              py: 1.25,
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              size="large"
              sx={{ flex: 1, minWidth: 0 }}
            >
              开始书写
            </Button>
            {isOrganizer() && (
              <Button
                variant="outlined"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate('/admin/writing-circle')}
                size="large"
                sx={{ flex: 1, minWidth: 0 }}
              >
                圈子后台
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default WritingCircle;
