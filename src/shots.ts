import {timing, tSay} from './timing';
import {CAMERA, STORYBOARD} from './storyboard';
import type {CamImpulse, CamKey} from './camera';

/**
 * 镜头表（表驱动）。相机路径写在**镜头本地秒**；每条路径是贯穿整镜的一次呼吸，
 * impulses 叠在路径之上。
 *
 * 本片：竖屏 1080×1920 / 30fps，22 镜 / 约 119s。
 * 人物形态由 MainVideo 顶层 `<GlobalHost />` 统一控制：0→8.3s 全屏（s1 钩子），
 * 8.3→99.6s 圆窗（中段让台镜面板 + 叙述），99.6→片尾全屏（s19 卡片展示 + s20-s22 CTA）。
 *
 * 逐镜的镜头数据全部来自 `storyboard.ts`：
 *   - lead / tail 由 layout 推导（hook 多渲 6 帧入场，fullcard 少渲 4 帧出场）
 *   - 重音微动读 `CAMERA`，锚点是口播稿里的字，换片不用改本文件
 */
export type Shot = {
  id: string;
  /** 口播开始的绝对秒 */
  startSec: number;
  /** 口播时长 */
  durationSec: number;
  /** 在 startSec 之前多渲的帧（入场转场） */
  lead: number;
  /** 口播结束后多渲的帧（出场转场） */
  tail: number;
  path: CamKey[];
  impulses: CamImpulse[];
};

const D = Object.fromEntries(
  timing.scenes.map((s) => [s.id, {start: s.startSec, dur: s.durationSec}]),
) as Record<string, {start: number; dur: number}>;

/** 整镜缓推：入场从 1.048 起手，0.6s 内落到 1.01，整镜缓推到 1.052。 */
const push = (dur: number, from = 1.048, to = 1.052): CamKey[] => [
  {t: -0.4, scale: from, blur: 2},
  {t: 0.6, scale: 1.01, blur: 0},
  {t: dur + 0.4, scale: to},
];

/** lead / tail 由版式决定，不逐镜填表。 */
const LEAD: Record<string, number> = {hook: 6};
const TAIL: Record<string, number> = {fullcard: 8};

export const SHOTS: Shot[] = STORYBOARD.map((cfg) => {
  const dur = D[cfg.id]!;
  const impulses: CamImpulse[] = (CAMERA[cfg.id] ?? []).map((b) => ({
    // 落拍时刻 = 「b.say 这个字被念到」的镜内秒 + off
    t: tSay(cfg.id, b.say) + (b.off ?? 0),
    scale: b.scale,
    shake: b.shake ?? 0,
    frames: b.frames ?? 6,
  }));
  return {
    id: cfg.id,
    startSec: dur.start,
    durationSec: dur.dur,
    lead: cfg.lead ?? LEAD[cfg.layout] ?? 0,
    tail: cfg.tail ?? TAIL[cfg.layout] ?? 12,
    path: push(dur.dur),
    impulses,
  };
});

export function shotById(id: string): Shot {
  const s = SHOTS.find((x) => x.id === id);
  if (!s) throw new Error(`shot not found: ${id}`);
  return s;
}

/**
 * 段渲染序列计算：含 lead/tail 帧的总时长 + Sequence from。
 * 与 render_shots.mjs 的 Math.round(startSec*fps) 规则严格一致。
 */
export function shotSequence(shot: Shot, fps: number): {from: number; duration: number} {
  const narrationFrames = Math.round(shot.durationSec * fps);
  const total = shot.lead + narrationFrames + shot.tail;
  const from = Math.round(shot.startSec * fps) - shot.lead;
  return {from, duration: total};
}