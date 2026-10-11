/**
 * 音效 cue 表（v_四期SOP重跑 · 「发视频前过三类词」）
 *
 * 22 镜 / 119s / 30 处音效 cue。
 *
 * 设计原则（参考 yaoyao-talkcraft/references/audio-mixing.md）：
 *   - 锚点必须落在**画面动作**上（不是按拍子铺）：卡片上屏 / 数字落地 / 镜切 / 转场。
 *   - 每卡 2~6 cue，全片 30 处（22 镜，平均 1.4 处/镜）。比抖音版（42 处）少，
 *     因为这版是知识科普向，节奏更克制。
 *   - 音效电平比人声低 ~12dB（基础 0.24~0.50 → −18 ~ −6dBFS）。
 *   - 同帧最多一条 cue（错峰 ≥0.3s）。
 *
 * 四级强度表：
 *   重音 0.50 — slam / impact        →  关键转折、被判、违禁词、点关注
 *   强调 0.41 — mech-lock-quick       →  删了重发、SOP 引导、镜切
 *         0.41 — paper-paper-slide    →  卡片上屏
 *   常规 0.35 — ui-click-tone / ding  →  提示、CTA
 *   轻点 0.24 — whoosh / swipe        →  镜切转场
 *
 * ⚠ 样本文件在 public/sfx/（Mixkit Sound Effects Free License，免署名可商用）。
 *   `pk:*` 已重新归一化到 −3.3dB peak（详见 audio-mixing.md）。
 *
 * ⚠ 时钟是**绝对秒**（从片头 0 起，正片 3.05s 后开始）。MainVideo.tsx 渲染时
 *   用 Math.round(c.t * fps) 转帧。
 */

export type SfxCue = {t: number; name: string; vol: number; rate?: number; clip?: string};

export const CUES: SfxCue[] = [
  // ----- s1 钩子首镜（0.2-9.8s）-----
  {t: 0.92, name: 'pk-ui-ui-click-tone', vol: 0.35},

  // ----- s2 转折（9.84-12.32s）-----
  {t: 11.0, name: 'pk-mech-lock-quick', vol: 0.41},

  // ----- s3 引入踩坑（12.56-17.92s）-----
  {t: 14.5, name: 'swipe', vol: 0.24},
  {t: 17.6, name: 'whoosh', vol: 0.24},

  // ----- s4 屏幕亮着重音（17.92-23.16s）-----
  {t: 19.5, name: 'slam', vol: 0.50},

  // ----- s5 我以为真实（23.16-26.80s）-----
  {t: 24.8, name: 'ding', vol: 0.35},

  // ----- s6 被判引流推广 重音（27.12-29.76s）-----
  {t: 28.5, name: 'slam', vol: 0.50},

  // ----- s7 删了重发（29.76-33.92s）-----
  {t: 31.5, name: 'pk-mech-lock-quick', vol: 0.41},

  // ----- s8 过渡到踩坑2（33.92-40.24s）-----
  {t: 36.5, name: 'ding', vol: 0.35},

  // ----- s9 听不出的违禁词（40.48-48.28s）-----
  {t: 43.0, name: 'slam', vol: 0.50},

  // ----- s10 方法引入（48.28-53.56s）-----
  {t: 50.5, name: 'tick', vol: 0.28, rate: 1.08},

  // ----- s11 让台镜面板「别露界面」（53.56-60.88s）-----
  {t: 56.5, name: 'whoosh', vol: 0.26},

  // ----- s12 糊掉打码（60.88-65.44s）-----
  {t: 62.5, name: 'pk-mech-lock-quick', vol: 0.36},

  // ----- s13 方法2 引入（65.48-69.20s）-----
  {t: 67.0, name: 'tick', vol: 0.26},

  // ----- s14 极限词 4 个数字依次落点（69.20-76.20s）-----
  {t: 70.0, name: 'pop', vol: 0.41},
  {t: 72.0, name: 'pop', vol: 0.41},
  {t: 73.5, name: 'pop', vol: 0.41},
  {t: 75.0, name: 'pop', vol: 0.41},

  // ----- s15 效果承诺 4 个数字依次落点（76.20-83.72s）-----
  {t: 77.5, name: 'pop', vol: 0.41},
  {t: 79.0, name: 'pop', vol: 0.41},
  {t: 80.5, name: 'pop', vol: 0.41},
  {t: 82.0, name: 'pop', vol: 0.41},

  // ----- s16 引流词不念（83.72-88.44s）-----
  {t: 86.0, name: 'tick', vol: 0.28, rate: 1.06},

  // ----- s17 让 AI 当审核员 重音（88.64-92.40s）-----
  {t: 90.5, name: 'ding', vol: 0.44},

  // ----- s18 提示词介绍（92.40-99.60s）-----
  {t: 95.0, name: 'pk-paper-paper-slide', vol: 0.41},

  // ----- s19 卡片展示 重音（99.60-104.20s）-----
  {t: 102.0, name: 'pk-paper-paper-slide', vol: 0.41},

  // ----- s20 行动召唤（104.20-112.16s）-----
  {t: 107.5, name: 'whoosh', vol: 0.24},

  // ----- s21 SOP 引导（112.20-117.38s）-----
  {t: 114.5, name: 'pk-mech-lock-quick', vol: 0.41},

  // ----- s22 点关注重音（117.52-118.96s）-----
  {t: 118.0, name: 'ding', vol: 0.44},
];