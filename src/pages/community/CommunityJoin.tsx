import React, { useEffect, useState } from 'react';
import communityQrApi from '../../netlify/services/communityQr';
import styles from './communityQr.module.css';

const CommunityJoin: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    communityQrApi
      .current()
      .then((response) => {
        if (!response.success) throw new Error(response.error || '读取失败');
        setImageUrl(response.data?.imageUrl || null);
      })
      .catch(() => setError('二维码暂时无法加载，请稍后刷新页面。'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <span className={styles.eyebrow}>启发星球 · 微信社群</span>
        <h1>欢迎加入启发星球</h1>
        <p className={styles.intro}>
          扫描下方二维码加入微信群，和我们一起分享最近的启发、问题和行动。
        </p>

        <div className={styles.qrFrame} aria-live="polite">
          {loading && <p className={styles.status}>正在加载二维码…</p>}
          {!loading && error && <p className={styles.error}>{error}</p>}
          {!loading && !error && imageUrl && (
            <img src={imageUrl} alt="启发星球微信群二维码" />
          )}
          {!loading && !error && !imageUrl && (
            <p className={styles.status}>新的入群二维码正在准备中，请稍后再来。</p>
          )}
        </div>

        <p className={styles.tip}>微信二维码可能会过期，这个页面会始终展示最新版本。</p>
      </main>
    </div>
  );
};

export default CommunityJoin;
