import React from 'react';
import { Link } from 'react-router-dom';
import styles from './clarifyTogether.module.css';

const steps = [
  '提交报名，写下你最近反复面对的问题、已经做过的尝试和不希望被触碰的边界。',
  '我会提前和你简单沟通，了解你的情况，并一起确定这次最想探索的方向。',
  '在启发星球进行约 30—40 分钟的对话。我会通过倾听和追问，陪你慢慢把问题讲清楚。',
  '我们从对话中提炼一个最值得继续理解的问题，邀请在场伙伴分享相关经历和观察。',
  '活动结束后，再由你决定哪些内容可以整理、公开，哪些继续留在这次对话里。',
];

const ClarifyTogether: React.FC = () => (
  <div className={styles.page}>
    <div className={styles.glow} aria-hidden="true" />
    <main className={styles.main}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>启发星球 · 对话实验</span>
        <h1>一起把问题说清楚</h1>
        <p className={styles.lead}>这是启发星球正在尝试的一种新的对话形式。</p>
        <p>
          我会邀请一个人带着最近真实面对的问题来到启发星球，由我作为对话伙伴，陪着他慢慢讲清楚：
        </p>

        <ul className={styles.questionList}>
          <li>我现在处在什么样的生活阶段？</li>
          <li>这个问题为什么在此刻出现？</li>
          <li>我已经尝试过什么？</li>
          <li>真正让我卡住的地方是什么？</li>
          <li>我目前正在考虑哪些可能性？</li>
        </ul>
      </header>

      <section className={styles.statement}>
        <p className={styles.bigStatement}>
          这不是一次成功经验分享，<br />也不是一场专家咨询。
        </p>
        <p>
          你不需要已经找到答案，也不需要拥有一段特别传奇的故事。只要有一个你正在经历、愿意认真看一看的真实问题，就可以报名参加。
        </p>
        <p>
          对话结束后，我们会从中找出一个最值得继续理解的问题，邀请在场伙伴分享自己的经历、观察和疑问。
        </p>
        <p>
          我们不会急着给出统一答案。我们更想练习的是：怎样认真理解一个人，也怎样一起把一个问题说清楚。
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span>参与方式</span>
          <h2>带着一个真实的问题来</h2>
        </div>
        <article className={styles.participantCard}>
          <div>
            <h3>你不需要准备一个完整的故事</h3>
            <p>
              你最近有一个反复出现、还没有想清楚的问题。它可以来自工作、学习、创作、关系、生活选择，或者正在进行的一次改变。
            </p>
            <p>
              只要你愿意提供一些真实背景，我会通过倾听和提问，陪你梳理现在的处境、已经做过的尝试，以及真正卡住你的地方。
            </p>
          </div>
          <Link to="/clarify-together/participant" className={styles.inlineLink}>
            填写报名
            <span aria-hidden="true">→</span>
          </Link>
        </article>
      </section>

      <section className={`${styles.section} ${styles.processSection}`}>
        <div className={styles.sectionHeading}>
          <span>对话流程</span>
          <h2>一次对话大概怎样进行？</h2>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className={styles.boundary}>
        <span className={styles.boundaryIcon} aria-hidden="true">✦</span>
        <div>
          <h2>你的边界，由你决定</h2>
          <p>
            参与活动不代表必须公开个人故事。是否录音、是否整理成文字、是否署名公开，会分别征得你的同意。
          </p>
        </div>
      </aside>

      <section className={styles.cta}>
        <p>如果你脑海里已经浮现出一个问题，欢迎带着它来。</p>
        <Link to="/clarify-together/participant" className={styles.ctaButton}>
          报名成为对话主角
          <span aria-hidden="true">→</span>
        </Link>
        <small>填写大约需要 5 分钟</small>
      </section>
    </main>
  </div>
);

export default ClarifyTogether;
