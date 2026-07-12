import React, { useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel, TextField } from '@mui/material';
import { contactApi } from '../../netlify/config';
import styles from './participantSignup.module.css';

type FormState = {
  name: string;
  email: string;
  question: string;
  context: string;
  hopes: string[];
  hopeOther: string;
  boundaries: string;
  publicity: string[];
  availableDates: string[];
  otherAvailability: string;
};

const hopeOptions = [
  '更清楚地描述自己现在的问题',
  '看见自己可能忽略的假设或矛盾',
  '梳理已经做过的尝试',
  '听见别人相似的经历',
  '找到一个可以继续尝试的小行动',
  '我还不知道，想先把事情讲出来',
];

const publicityOptions = [
  '可以在启发星球线上活动中公开交流',
  '可以录音，但只供内部整理',
  '可以整理成匿名文字',
  '可以使用昵称署名整理',
  '可以公开部分音频或文字',
  '暂时不希望录音或整理公开',
];

const initialState: FormState = {
  name: '',
  email: '',
  question: '',
  context: '',
  hopes: [],
  hopeOther: '',
  boundaries: '',
  publicity: [],
  availableDates: [],
  otherAvailability: '',
};

const getUpcomingSaturdayOptions = () => {
  const now = new Date();
  const beijingParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const part = (type: string) =>
    Number(beijingParts.find((item) => item.type === type)?.value);
  const start = Date.UTC(part('year'), part('month') - 1, part('day'));
  const limit = now.getTime() + 31 * 24 * 60 * 60 * 1000;

  return Array.from({ length: 32 }, (_, index) => {
    const calendarDate = new Date(start + index * 24 * 60 * 60 * 1000);
    const occurrence = new Date(calendarDate.getTime());
    const isFutureSaturday =
      calendarDate.getUTCDay() === 6 &&
      occurrence.getTime() > now.getTime() &&
      occurrence.getTime() <= limit;
    if (!isFutureSaturday) return null;

    const year = calendarDate.getUTCFullYear();
    const month = calendarDate.getUTCMonth() + 1;
    const day = calendarDate.getUTCDate();
    return {
      value: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      label: `${year}年${month}月${day}日（周六）早上 8:00（北京时间）`,
    };
  }).filter((option): option is { value: string; label: string } => Boolean(option));
};

const ParticipantSignup: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const saturdayOptions = getUpcomingSaturdayOptions();

  const update = (field: keyof FormState, value: string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggle = (field: 'hopes' | 'publicity', value: string) => {
    const values = form[field];
    update(
      field,
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value]
    );
  };

  const toggleDate = (value: string) => {
    const dates = form.availableDates;
    update(
      'availableDates',
      dates.includes(value)
        ? dates.filter((date) => date !== value)
        : [...dates, value]
    );
  };

  const buildMessage = () =>
    [
      '【一起把问题说清楚｜对话主角报名】',
      `1. 称呼：${form.name}`,
      `联系邮箱：${form.email}`,
      `2. 想聊的问题：\n${form.question}`,
      `3. 相关背景、尝试和卡点：\n${form.context}`,
      `4. 希望从对话中得到：\n${[...form.hopes, form.hopeOther].filter(Boolean).join('；')}`,
      `5. 不希望被询问或公开的内容：\n${form.boundaries || '未填写'}`,
      `6. 可以接受的公开程度：\n${form.publicity.join('；')}`,
      `7. 可以参加的场次：\n${[
        ...form.availableDates.map(
          (date) =>
            saturdayOptions.find((option) => option.value === date)?.label || date
        ),
        form.otherAvailability
          ? `其他方便时间：${form.otherAvailability}`
          : '',
      ]
        .filter(Boolean)
        .join('；')}`,
    ].join('\n\n');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.hopes.length) {
      setError('请至少选择一项你希望从对话中得到的帮助。');
      return;
    }
    if (!form.publicity.length) {
      setError('请至少选择一项你可以接受的公开程度。');
      return;
    }
    if (!form.availableDates.length && !form.otherAvailability.trim()) {
      setError('请选择一个周六场次，或填写其他方便时间。');
      return;
    }

    setSubmitting(true);
    try {
      const response = await contactApi.sendEmail({
        name: form.name,
        email: form.email,
        message: buildMessage(),
      });
      if (!response.success) throw new Error(response.error || '提交失败');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '提交失败，请稍后再试。'
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
          <h1>报名已经收到</h1>
          <p>谢谢你愿意带着一个真实的问题来到这里。我会阅读你的回答，再联系你确认交流方向和活动时间。</p>
          <Button href="/clarify-together" variant="outlined">返回对话实验介绍</Button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span>一起把问题说清楚</span>
        <h1>报名成为对话主角</h1>
        <p>不需要先把问题想明白。花大约 5 分钟，写下你此刻知道的部分就好。</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <FormSection eyebrow="第一部分" title="关于你">
          <Question number="1" title="希望我们怎样称呼你？" hint="简短回答。">
            <TextField required fullWidth label="你的称呼" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </Question>
          <Question title="联系邮箱" hint="仅用于确认交流方向和活动时间，不会公开。">
            <TextField required fullWidth type="email" label="你的邮箱" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </Question>
        </FormSection>

        <FormSection eyebrow="第二部分" title="你想聊什么？">
          <Question number="2" title="最近有什么问题在你的生活里反复出现？" hint="请尽量从一个具体问题开始，不需要把它讲得很完整。">
            <div className={styles.examples}>
              <strong>例如：</strong>
              <ul>
                <li>我想开始创作，但一直没有真正开始。</li>
                <li>我正在考虑换工作，却不知道自己是在逃避，还是确实需要改变。</li>
                <li>我学了很多东西，却不知道怎样把它们带回生活。</li>
                <li>我想和家人建立更好的关系，但每次沟通都会回到原来的模式。</li>
              </ul>
            </div>
            <LongAnswer value={form.question} onChange={(value) => update('question', value)} />
          </Question>
          <Question number="3" title="可以再简单说说它的背景吗？" hint="为什么它在此刻重要？你试过什么？最卡住的地方是什么？写下你愿意分享的部分即可。">
            <LongAnswer value={form.context} onChange={(value) => update('context', value)} />
          </Question>
          <Question number="4" title="你希望这次对话主要帮助你做什么？" hint="可多选。">
            <ChoiceGroup options={hopeOptions} selected={form.hopes} onToggle={(value) => toggle('hopes', value)} />
            <TextField fullWidth label="其他" value={form.hopeOther} onChange={(e) => update('hopeOther', e.target.value)} />
          </Question>
        </FormSection>

        <FormSection eyebrow="第三部分" title="边界和时间">
          <Question number="5" title="有没有哪些内容是你不希望被询问或公开的？" hint="选填。例如具体人名、公司、家庭信息或其他私人经历。">
            <LongAnswer required={false} value={form.boundaries} onChange={(value) => update('boundaries', value)} />
          </Question>
          <Question number="6" title="关于这次对话，你目前可以接受怎样的公开程度？" hint="可多选。这只是初步了解，活动前还会再次确认。">
            <ChoiceGroup options={publicityOptions} selected={form.publicity} onToggle={(value) => toggle('publicity', value)} />
          </Question>
          <Question number="7" title="未来一个月，哪些场次你可以参加？" hint="启发星球固定在北京时间每周六早上 8 点进行。可以多选，我们之后会和你确认最终场次。">
            <ChoiceGroup
              options={saturdayOptions.map((option) => option.label)}
              selected={form.availableDates.map(
                (date) =>
                  saturdayOptions.find((option) => option.value === date)?.label || date
              )}
              onToggle={(label) => {
                const option = saturdayOptions.find((item) => item.label === label);
                if (option) toggleDate(option.value);
              }}
            />
            <TextField
              fullWidth
              label="其他方便时间（选填）"
              placeholder="例如：北京时间周日早上，或工作日晚上"
              value={form.otherAvailability}
              onChange={(event) => update('otherAvailability', event.target.value)}
            />
          </Question>
        </FormSection>

        <div className={styles.consent}>
          <p>提交这份报名不代表你同意公开个人故事。录音、文字整理和署名方式会在活动前分别确认。</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={submitting} className={styles.submit}>
          {submitting ? '提交中…' : '提交报名'}
        </Button>
      </form>
    </main>
  );
};

const FormSection: React.FC<{ eyebrow: string; title: string; children: React.ReactNode }> = ({ eyebrow, title, children }) => (
  <section className={styles.formSection}>
    <div className={styles.sectionTitle}><span>{eyebrow}</span><h2>{title}</h2></div>
    <div className={styles.questions}>{children}</div>
  </section>
);

const Question: React.FC<{ number?: string; title: string; hint?: string; children: React.ReactNode }> = ({ number, title, hint, children }) => (
  <div className={styles.question}>
    <div className={styles.questionHeading}>{number && <span>{number.padStart(2, '0')}</span>}<div><h3>{title}</h3>{hint && <p>{hint}</p>}</div></div>
    <div className={styles.answer}>{children}</div>
  </div>
);

const LongAnswer: React.FC<{ value: string; onChange: (value: string) => void; required?: boolean; rows?: number }> = ({ value, onChange, required = true, rows = 5 }) => (
  <TextField required={required} fullWidth multiline rows={rows} placeholder="请在这里填写" value={value} onChange={(e) => onChange(e.target.value)} />
);

const ChoiceGroup: React.FC<{ options: string[]; selected: string[]; onToggle: (value: string) => void }> = ({ options, selected, onToggle }) => (
  <div className={styles.choices}>{options.map((option) => <FormControlLabel key={option} control={<Checkbox checked={selected.includes(option)} onChange={() => onToggle(option)} />} label={option} />)}</div>
);

export default ParticipantSignup;
