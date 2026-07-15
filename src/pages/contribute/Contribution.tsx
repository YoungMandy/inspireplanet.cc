import React, { useState } from 'react';
import { Alert, Button, TextField } from '@mui/material';
import { submissionsApi } from '../../netlify/config';
import styles from './contribution.module.css';

type FormState = {
  name: string;
  email: string;
  content: string;
  website: string;
};

const initialState: FormState = {
  name: '',
  email: '',
  content: '',
  website: '',
};

const Contribution: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await submissionsApi.send(form);
      if (!response.success) throw new Error(response.error || '提交失败');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '投稿发送失败，请稍后再试。'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className={styles.page}>
        <section className={styles.success}>
          <span aria-hidden="true">✓</span>
          <h1>投稿已经收到</h1>
          <p>
            谢谢你愿意把这段文字交给启发星球。我会认真读完，并通过邮箱联系你。
          </p>
          <p className={styles.successNote}>
            提交并不代表同意公开，任何修改、署名和发布都会与你确认。
          </p>
          <Button href="/" variant="outlined">
            返回启发星球
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span>写给启发星球</span>
        <h1>分享一段你想说的话</h1>
        <p>
          不需要写成完整文章。可以是一段经历、一个最近反复思考的问题，
          或一件想和大家分享的小事。
        </p>
      </header>

      <section className={styles.invitation}>
        <p>
          提交后，我会通过邮箱联系你，一起讨论和修改。任何公开发布，
          都会再次征得你的确认。
        </p>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <TextField
          required
          fullWidth
          label="怎么称呼你"
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
        />
        <TextField
          required
          fullWidth
          type="email"
          label="联系邮箱"
          helperText="只用于与你沟通这次投稿，不会公开。"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <TextField
          required
          fullWidth
          multiline
          minRows={10}
          label="你想分享的内容"
          placeholder="从你最想说的地方开始就好……"
          inputProps={{ maxLength: 20000 }}
          helperText={`${form.content.length} / 20000`}
          value={form.content}
          onChange={(event) => update('content', event.target.value)}
        />

        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="contribution-website">Website</label>
          <input
            id="contribution-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => update('website', event.target.value)}
          />
        </div>

        <div className={styles.notes}>
          <p>提交投稿不等于同意发布。</p>
          <p>署名可以之后再决定，也可以使用昵称或匿名。</p>
          <p>涉及他人的姓名、公司或私人信息，可以在整理时一起修改。</p>
        </div>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          className={styles.submit}
        >
          {submitting ? '发送中…' : '提交投稿'}
        </Button>
      </form>
    </main>
  );
};

export default Contribution;
