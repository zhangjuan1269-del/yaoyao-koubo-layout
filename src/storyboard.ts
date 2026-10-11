import type {CSSProperties} from 'react';

/**
 * 分镜配置表 —— **每条新视频只改这一个文件**。
 *
 * 版式骨架、组件实现、动效参数都在 `blocks.tsx` / `scene-from-config.tsx` 里，
 * 属于固定不变量；本文件只描述「这条片子每一镜说什么、用哪个件、锚在哪句词上」。
 *
 * 填表规则见 `docs/06_填表说明.md`。
 * 选件规则见 `docs/03_组件选型表.md`。
 */

/** 时间锚点：数字=镜内秒；字符串=原话子串（ASR 字级）；[子串, 偏移]=子串时刻+偏移秒。 */
export type At = number | string | [string, number];

export type Color = 'cream' | 'gold' | 'dim' | 'text' | 'bg';

/* ---------------- 画面件（对应组件库 12 类） ---------------- */

export type Block =
  /** 逐字升起的一行字（最常用） */
  | {t: 'rise'; text: string; size: number; color?: Color; at: At}
  /** 药丸行（短句并列） */
  | {t: 'chips'; items: string[]; gold?: number; size?: number; at: At}
  /** 一行内多种样式文字（标签 + 值） */
  | {t: 'inline'; parts: Array<{text: string; size: number; color?: Color; weight?: number}>; gap?: number}
  /** 平台通知条 */
  | {t: 'notice'; title: string; body: string; stamp?: string; at: At}
  /** 设备框（电脑 / 界面） */
  | {
      t: 'monitor';
      title: string;
      w?: number;
      screenH?: number;
      glow?: boolean;
      badge?: string;
      badgeTone?: 'red' | 'gold';
      at: At;
      inner: MonitorInner;
    }
  /** 两行对比（同一个框内，label → 说法） */
  | {t: 'rowsbox'; rows: Array<{label: string; text: string; accent?: boolean}>}
  /** 带框的多行列表（每行自己的框，逐行进场） */
  | {t: 'rowlist'; rows: Array<{label: string; text: string}>; at: At; stagger?: number; gap?: number}
  /** A → B 转换（药丸） */
  | {t: 'flow'; a: string; b: string; at?: At}
  /** 数值行（标签 + 数值 + 可选箭头） */
  | {t: 'stat'; label: string; value: string; arrow?: string; at?: At}
  /** 词格（词 + 金 ✗），2 列，可带尾格 */
  | {
      t: 'wordgrid';
      items: Array<string | {text: string; anchor: string}>;
      size?: number;
      h?: number;
      tail?: string;
      /** 网格间距，默认 '24px 34px' */
      gap?: string;
      at: At;
    }
  /** 序号步骤 */
  | {t: 'steps'; items: Array<string | {text: string; at: At}>; accent?: number; at: At; stagger?: number; gap?: number}
  /** 卡片：标题 + 逐行进场的内容行 */
  | {t: 'cardlist'; title: string; lines: string[]; at: At; stagger?: number}
  /** 文案框：出处 + 句子 + 被标出的字 + 备注 */
  | {t: 'textbox'; title: string; line: string; mark: string; note: string; at?: At}
  /** 整句 + 红框标出其中一个词 */
  | {t: 'sentence'; parts: string[]; mark: number; at: At; markAt: At}
  /** 大字划线否定 */
  | {t: 'strike'; text: string; size: number; at: At; strikeAt: At}
  /** 审核结果行（✓ / × + 标签 + 结论） */
  | {t: 'checks'; title: string; items: Array<{tag: string; ok: boolean}>; at: At; stagger?: number}
  /** 大数字 */
  | {t: 'number'; text: string; size: number; unit?: string; unitSize?: number; at: At}
  /** 大词（无动画） */
  | {t: 'bigword'; text: string; size: number; color?: Color}
  /** 照片铺满（下段画面卡） */
  | {t: 'photo'; src: string; caption?: string}
  /** 纵向分组的容器 */
  | {t: 'group'; gap?: number; align?: CSSProperties['alignItems']; blocks: Block[]};

export type MonitorInner =
  | {t: 'row'; parts: InnerPart[]; gap?: number; maskAt?: At}
  | {t: 'text'; text: string; size?: number; color?: Color};

export type InnerPart =
  | {text: string; size: number; color?: Color; weight?: number}
  /** kind:'line' = 细占位条；kind:'mask' = 打码条（会随 maskAt 变亮） */
  | {bar: number; kind?: 'line' | 'mask'};

/* ---------------- 镜头 ---------------- */

export type Layout =
  /** 上段文字卡 + 下段画面卡 */
  | 'band'
  /** 整高卡 */
  | 'tall'
  /** 首镜钩子：顶带 → 缩窗后落两段式 */
  | 'hook'
  /** 整幅截图翻页 */
  | 'fullcard'
  /** 收尾 CTA：顶带金底 */
  | 'cta';

export type ShotConfig = {
  id: string;
  layout: Layout;
  /** 整卡进场时刻（band/tall/fullcard 用） */
  at?: At;
  /** 卡内边距（默认按 layout 走固定值） */
  pad?: string;
  /** band/hook 的上段文字卡 */
  top?: {at: At; blocks: Block[]};
  /** band/hook 的下段画面卡 */
  media?: {at: At; gap?: number; pad?: string; blocks: Block[]};
  /** tall 的整高卡 */
  body?: Block[];
  /** fullcard 的整幅页 */
  pages?: Array<{src: string; at: At; outAt?: At; dir?: 1 | -1}>;
  /** fullcard 底部药丸 */
  pill?: {text: string; size: number; at: At; bottom?: number};
  /** hook/cta 的顶带 */
  band?: {
    text: string;
    size: number;
    at: At;
    /** hook：顶带退场时刻（缩窗点之前） */
    outAt?: number;
    /** cta：金底 */
    gold?: boolean;
  };
  /** hook：缩窗后落到两段式的时刻（镜内秒） */
  settleAt?: number;
  /** 入场多渲帧（默认 0；首镜给 6 保证第 0 帧就在场） */
  lead?: number;
  /** 出场多渲帧（默认 12；整幅卡片镜给 8） */
  tail?: number;
  /** 重音微动（缺省则整镜只走缓推，不落拍） */
  cam?: Beat[];
};

/**
 * 重音微动：把「某个字被念到」当作落拍点。
 * `say` 必须能在本镜口播稿里唯一命中（tSay 取首次出现位置），`off` 是字头之后的秒数。
 */
export type Beat = {
  /** 口播稿里的字/词（首次出现位置即锚点） */
  say: string;
  /** 字头之后多少秒落拍，默认 0 */
  off?: number;
  /** 缩放增量（0.024 ≈ 2.4%） */
  scale: number;
  /** 回弹帧数，默认 6 */
  frames?: number;
  /** 抖动幅度（0 = 不抖），默认 0 */
  shake?: number;
};

/* =====================================================================
 * 示例重音微动表（7 镜 / 7 拍）
 * 落拍时刻 = 「say 这个字被念到」的时刻 + off 秒。
 * say 必须能在本镜口播稿里唯一命中；下面是示例文案里的词。
 * ===================================================================== */

export const CAMERA: Record<string, Beat[]> = {
  s1: [{say: '坑', off: 0.0, scale: 0.02, frames: 5}],
  s2: [{say: '稿', off: 0.12, scale: 0.024, frames: 6}],
  s3: [{say: '步', off: 0.18, scale: 0.026, frames: 6}],
  s4: [{say: '判', off: 0.08, scale: 0.024, frames: 6}],
  s5: [{say: '过', off: 0.06, scale: 0.028, frames: 7, shake: 2}],
  s6: [{say: '眼', off: 0.1, scale: 0.024, frames: 6}],
  s7: [{say: '改', off: 0.0, scale: 0.028, frames: 8, shake: 1}],
};

/* =====================================================================
 * 示例分镜（7 镜）—— 换片时把下面整段替换成你自己的内容。
 *
 * ⚠️ at 里的字符串锚点，必须是**你口播稿里的原话连续子串**。
 *    写成上屏的提炼语会**静默失效**（元素在第 0 帧就冒出来，而且不报错）。
 * ⚠️ 凡带秒数的参数（outAt / settleAt / off），搬到你这条要**重新推导**，别抄数值。
 *
 * 7 镜分别演示 5 种版式里的 4 种 + 常见画面件：
 *   s1 hook（首镜钩子）· s2/s4 band（上下两段）· s3/s5 tall（整高卡）
 *   s6 fullcard（整幅翻页）· s7 cta（收尾金底）
 * ===================================================================== */

export const STORYBOARD: ShotConfig[] = [
  /* s1 · 首镜钩子：顶带 → 退场 → 落两段式 */
  {
    id: 's1',
    layout: 'hook',
    band: {text: '最容易踩什么坑？', size: 88, at: '新手做口播最容易踩的三个坑', outAt: 3.4},
    settleAt: 3.7,
    top: {
      at: 3.7,
      blocks: [
        {t: 'rise', text: '最容易踩什么坑？', size: 76, color: 'cream', at: 3.72},
        {t: 'rise', text: '不是画质，也不是普通话', size: 46, color: 'gold', at: 3.86},
        {t: 'chips', items: ['没流量', '没人看完', '白忙一场'], gold: 1, size: 34, at: 4.04},
      ],
    },
    media: {
      at: 3.76,
      pad: '0',
      blocks: [{t: 'photo', src: 'broll/demo_s1.jpg', caption: '示例：这一格换成你的实拍图'}],
    },
    cam: [{say: '坑', off: 0.0, scale: 0.02, frames: 5}],
  },

  /* s2 · 上段文字卡 + 下段设备框 */
  {
    id: 's2',
    layout: 'band',
    top: {
      at: ['第一个坑', 0.2],
      blocks: [
        {t: 'rise', text: '第一个坑：只顾念稿', size: 62, color: 'cream', at: '第一个坑'},
        {t: 'rise', text: '眼睛不抬，观众三秒就走', size: 40, color: 'gold', at: ['第一个坑', 1.1]},
      ],
    },
    media: {
      at: ['第一个坑', 0.6],
      blocks: [
        {
          t: 'monitor',
          title: '提词器',
          glow: true,
          badge: '示例',
          badgeTone: 'gold',
          at: ['第一个坑', 0.8],
          inner: {
            t: 'row',
            parts: [
              {text: '眼睛看镜头', size: 34},
              {bar: 3, kind: 'mask'},
            ],
          },
        },
      ],
    },
    cam: [{say: '稿', off: 0.12, scale: 0.024, frames: 6}],
  },

  /* s3 · 整高卡：编号步骤条 */
  {
    id: 's3',
    layout: 'tall',
    at: ['第二步', 0.1],
    body: [
      {t: 'rise', text: '正确的顺序是这三步', size: 56, color: 'cream', at: '第二步'},
      {
        t: 'steps',
        items: ['先把话说顺', '再对着镜头念', '最后配画面'],
        accent: 2,
        at: ['第二步', 0.5],
        stagger: 0.22,
      },
    ],
    cam: [{say: '步', off: 0.18, scale: 0.026, frames: 6}],
  },

  /* s4 · 上段词格 + 下段平台通知条 */
  {
    id: 's4',
    layout: 'band',
    top: {
      at: ['平台判定', 0.1],
      blocks: [
        {t: 'rise', text: '第二个坑：随口说绝对话', size: 54, color: 'cream', at: '平台判定'},
        {t: 'wordgrid', items: ['最', '第一', '唯一', '百分之百'], at: ['平台判定', 0.5]},
      ],
    },
    media: {
      at: ['平台判定', 0.7],
      blocks: [
        {
          t: 'notice',
          title: '作品被判定为夸大宣传',
          body: '示例：这一格换成平台真实提示的截图。',
          stamp: '示例',
          at: ['平台判定', 0.9],
        },
      ],
    },
    cam: [{say: '判', off: 0.08, scale: 0.024, frames: 6}],
  },

  /* s5 · 整高卡：审核结果勾叉清单 */
  {
    id: 's5',
    layout: 'tall',
    at: ['改完再看', 0.1],
    body: [
      {t: 'rise', text: '发之前自己先过一遍', size: 56, color: 'cream', at: '改完再看'},
      {
        t: 'checks',
        title: '发布前自检',
        items: [
          {tag: '画面没有压脸', ok: true},
          {tag: '字幕只有一层', ok: true},
          {tag: '没有绝对化用词', ok: false},
        ],
        at: ['改完再看', 0.5],
      },
    ],
    cam: [{say: '过', off: 0.06, scale: 0.028, frames: 7, shake: 2}],
  },

  /* s6 · 整幅翻页卡 */
  {
    id: 's6',
    layout: 'fullcard',
    pages: [{src: 'broll/demo_s6.png', at: ['最后再看一眼', 0.1], dir: 1}],
    pill: {text: '示例：整幅截图 / 设计稿', size: 32, at: ['最后再看一眼', 0.4]},
    cam: [{say: '眼', off: 0.1, scale: 0.024, frames: 6}],
  },

  /* s7 · 收尾 CTA：金底顶带 */
  {
    id: 's7',
    layout: 'cta',
    band: {text: '下一条讲怎么改', size: 72, at: '关注我下一条讲怎么改', gold: true},
    cam: [{say: '改', off: 0.0, scale: 0.028, frames: 8, shake: 1}],
  },
];
