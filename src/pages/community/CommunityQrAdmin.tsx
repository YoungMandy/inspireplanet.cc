import React, { ChangeEvent, useEffect, useState } from 'react';
import communityQrApi from '../../netlify/services/communityQr';
import styles from './communityQr.module.css';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const CommunityQrAdmin: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    communityQrApi.current().then((response) => {
      if (response.success) setCurrentUrl(response.data?.imageUrl || null);
    });
  }, []);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setMessage('');
    setError('');
    setBase64Image('');
    setPreviewUrl(null);

    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('请选择 PNG、JPG 或 WebP 图片。');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('图片大小不能超过 3MB。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setBase64Image(result);
      setPreviewUrl(result);
    };
    reader.onerror = () => setError('图片读取失败，请重新选择。');
    reader.readAsDataURL(file);
  };

  const handleUpdate = async () => {
    if (!base64Image || saving) return;
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await communityQrApi.update(base64Image);
      if (!response.success || !response.data?.imageUrl) {
        throw new Error(response.error || '更新失败');
      }
      setCurrentUrl(response.data.imageUrl);
      setPreviewUrl(null);
      setBase64Image('');
      setMessage('二维码已更新，公开页面现在会显示这张新图片。');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={`${styles.card} ${styles.adminCard}`}>
        <span className={styles.eyebrow}>启发星球 · 管理后台</span>
        <h1>更新入群二维码</h1>
        <p className={styles.intro}>
          新图片生效后，系统会自动删除上一张过期二维码。
        </p>

        <div className={styles.adminGrid}>
          <section>
            <h2>当前二维码</h2>
            <div className={styles.previewBox}>
              {currentUrl ? (
                <img src={currentUrl} alt="当前入群二维码" />
              ) : (
                <p className={styles.status}>尚未上传二维码</p>
              )}
            </div>
          </section>
          <section>
            <h2>新二维码预览</h2>
            <div className={styles.previewBox}>
              {previewUrl ? (
                <img src={previewUrl} alt="新二维码预览" />
              ) : (
                <p className={styles.status}>选择图片后在这里预览</p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.controls}>
          <label className={styles.fileButton}>
            选择二维码图片
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
            />
          </label>
          <button
            className={styles.updateButton}
            type="button"
            disabled={!base64Image || saving}
            onClick={handleUpdate}
          >
            {saving ? '正在更新…' : '确认更新'}
          </button>
        </div>
        <small className={styles.help}>支持 PNG、JPG、WebP，文件不超过 3MB。</small>
        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}
      </main>
    </div>
  );
};

export default CommunityQrAdmin;
