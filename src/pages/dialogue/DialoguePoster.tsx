import React, { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import styles from './dialoguePoster.module.css';

const siteOrigin = 'https://inspireplanet.cc';

const presets = {
  dialogue: {
    title: '一起把问题说清楚',
    description: '带着一个最近真实面对、还没有想清楚的问题来。',
    label: '对话实验报名',
    url: `${siteOrigin}/clarify-together/participant`,
  },
  cards: {
    title: '创建一张启发卡片',
    description: '把此刻触动你的想法、句子和经历，做成一张可以分享的卡片。',
    label: '启发星球 · 创建卡片',
    url: `${siteOrigin}/create-card`,
  },
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return siteOrigin;
  if (trimmed.startsWith('/')) return `${siteOrigin}${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${siteOrigin}/${trimmed.replace(/^\/+/, '')}`;
};

const DialoguePoster: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initial = {
    title: searchParams.get('title') || presets.dialogue.title,
    description: searchParams.get('description') || presets.dialogue.description,
    label: searchParams.get('label') || presets.dialogue.label,
    url: searchParams.get('url') || presets.dialogue.url,
  };
  const posterRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [label, setLabel] = useState(initial.label);
  const [url, setUrl] = useState(initial.url);
  const [downloading, setDownloading] = useState(false);
  const qrUrl = useMemo(() => normalizeUrl(url), [url]);

  const applyPreset = (preset: (typeof presets)[keyof typeof presets]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setLabel(preset.label);
    setUrl(preset.url);
  };

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: '#f7f1e8',
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      const safeTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-');
      link.download = `${safeTitle || '页面'}-分享海报.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span>启发星球 · 通用工具</span>
        <h1>页面分享海报</h1>
        <p>为站内任意页面生成一张说明用途、带访问二维码的简单海报。</p>
      </header>

      <div className={styles.presetBar}>
        <span>快捷预设</span>
        <button type="button" onClick={() => applyPreset(presets.dialogue)}>对话实验报名</button>
        <button type="button" onClick={() => applyPreset(presets.cards)}>创建卡片</button>
      </div>

      <div className={styles.workspace}>
        <div className={styles.poster} ref={posterRef}>
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.posterTop}>
            <span>启发星球 · {label || '页面分享'}</span>
            <strong>{title || '页面标题'}</strong>
            <p>{description || '用一句话告诉大家这个页面是做什么的。'}</p>
          </div>

          <div className={styles.posterBottom}>
            <div className={styles.qrBox}>
              <QRCodeSVG value={qrUrl} size={172} level="H" bgColor="#fffdf9" fgColor="#273a36" marginSize={2} />
              <span>扫码进入：{label || '启发星球页面'}</span>
            </div>
          </div>
        </div>

        <aside className={styles.editor}>
          <label>海报标题<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>这个页面是做什么的<textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>页面类型<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="例如：活动详情" /></label>
          <label>页面地址<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="可填写 /create-card 或完整网址" /></label>

          <div className={styles.actions}>
            <button type="button" onClick={downloadPoster} disabled={downloading}>{downloading ? '正在生成…' : '下载海报 PNG'}</button>
            <a href={qrUrl} target="_blank" rel="noreferrer">打开目标页面</a>
            <Link to="/create-card">创建启发卡片</Link>
          </div>
          <small>二维码统一使用正式域名，即使在本地制作也可以直接分享。</small>
        </aside>
      </div>
    </main>
  );
};

export default DialoguePoster;
