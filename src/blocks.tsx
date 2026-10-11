import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BAND_TOP, C, FONT} from './theme';
import {CameraRig} from './camera';
import {shotById} from './shots';
import {
  Panel,
  RiseLine,
  ShotClock,
  cubicBezier,
  lerp,
  tw,
  useSay,
  useShotTime,
} from './kit';

/**
 * 通用画面件库 —— 从 SopScenes.tsx 原样抽出，逻辑一行未改。
 *
 * 用途：`storyboard.ts` 里的配置只描述「用哪个件 + 填什么内容」，
 * 由 `scene-from-config.tsx` 组装；新视频不再手写镜头组件。
 *
 * ── 固定版式（来自已验收标准工程，禁止改动）────────────────────────────
 *   · 人物：全片 GlobalHost 右上金边圆窗（chipD 288 / chipRight 96 / chipTop 96），
 *     本层一律不画人，也不占用 y 96–384 × x 696–984 那块。
 *   · 中间素材区（两段式）：
 *       上段 文字卡  left 96 / top 440 / 888 × 450
 *       下段 画面卡  left 96 / top 900 / 888 × 480
 *       两段之间 890→900 留 10px 缝，不留大空场。
 *   · 内容不分两段的镜头，用整高卡：left 96 / top 440 / 888 × 920。
 *   · 字幕：只有底部一层口播字幕（MainVideo 的 Subtitles，bottom 430）。
 *   · 动效锚点：一律 useSay(sceneId, 原话连续子串)，不写死秒数。
 */

/* ============================== 固定版式常量 ============================== */

export const PANEL_L = 96;
export const PANEL_TOP = 440;
export const PANEL_W = 888;
export const PANEL_H = 450;
export const MEDIA_TOP = 900;
export const MEDIA_W = 888;
export const MEDIA_H = 480;
export const TALL_H = 920;

export const ease = cubicBezier(0.2, 0.9, 0.25, 1);

/* ============================== 通用外壳 ============================== */

export const Frame: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => {
  const shot = shotById(id);
  return (
    <CameraRig
      path={shot.path}
      impulses={shot.impulses}
      durationSec={shot.durationSec}
      leadFrames={shot.lead}
    >
      <ShotClock lead={shot.lead}>{children}</ShotClock>
    </CameraRig>
  );
};

/** 通用进场：淡入 + 轻微上浮。 */
export const Pop: React.FC<{
  at: number;
  d?: number;
  dy?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({at, d = 0.42, dy = 16, style, children}) => {
  const t = useShotTime();
  const p = tw(t, at, d, ease);
  if (p <= 0) return null;
  return (
    <div style={{opacity: p, transform: `translateY(${lerp(dy, 0, p)}px)`, ...style}}>{children}</div>
  );
};

/** 上段：文字卡 888 × 450 @ top 440。至少 3 个信息块，纵向均分。 */
export const TextBand: React.FC<{
  at: number;
  pad?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({at, pad = '36px 60px', style, children}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.34, ease);
  if (p <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: PANEL_TOP,
        pointerEvents: 'none',
      }}
    >
      <div style={{opacity: p}}>
        <Panel
          pad={pad}
          style={{
            width: PANEL_W,
            height: PANEL_H,
            boxSizing: 'border-box',
            justifyContent: 'space-evenly',
            ...style,
          }}
        >
          {children}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

/** 整高卡 888 × 920 @ top 440。内容纵向均分撑满，不留下半截空场。
 *  ⚠️ 底部留 160px 内边距：字幕是 2 行时带顶会抬到 y≈1335，而整高卡下缘是 1360 ——
 *  不留这段，卡里最后一行（结论句）会被字幕压住。 */
export const TallBand: React.FC<{
  at: number;
  pad?: string;
  justify?: React.CSSProperties['justifyContent'];
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({at, pad = '48px 60px 160px', justify = 'space-evenly', style, children}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.34, ease);
  if (p <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: PANEL_TOP,
        pointerEvents: 'none',
      }}
    >
      <div style={{opacity: p}}>
        <Panel
          pad={pad}
          style={{
            width: PANEL_W,
            height: TALL_H,
            boxSizing: 'border-box',
            justifyContent: justify,
            ...style,
          }}
        >
          {children}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

/** 下段：中间素材区 888 × 480 @ top 900。 */
export const MediaBand: React.FC<{
  at: number;
  gap?: number;
  pad?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({at, gap = 18, pad = '30px 44px', style, children}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.5, ease);
  if (p <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: PANEL_L,
          top: MEDIA_TOP,
          width: MEDIA_W,
          height: MEDIA_H,
          borderRadius: 26,
          overflow: 'hidden',
          boxSizing: 'border-box',
          border: `2px solid ${C.line}`,
          boxShadow: '0 20px 54px rgba(0,0,0,0.42)',
          background: 'linear-gradient(180deg, rgba(9,24,17,0.96), rgba(5,15,10,0.98))',
          opacity: p,
          transform: `translateY(${lerp(26, 0, p)}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
          padding: pad,
          ...style,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/* ============================== 中间素材件 ============================== */

/** 整幅截图卡（1080×1920）：进场上浮淡入，翻页时向 dir 方向滑出。 */
export const CardPage: React.FC<{src: string; at: number; outAt?: number; dir?: 1 | -1}> = ({
  src,
  at,
  outAt,
  dir = 1,
}) => {
  const t = useShotTime();
  const inn = tw(t, at, 0.4, ease);
  const out = outAt === undefined ? 0 : tw(t, outAt, 0.3, ease);
  const p = inn * (1 - out);
  if (p <= 0) return null;
  const dx = lerp(80 * dir, 0, inn) + lerp(0, -80 * dir, out);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Img
        src={staticFile(src)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          opacity: p,
          transform: `translateX(${dx}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** 下段画面卡里铺真实照片：cover 铺满 888×480 + 品牌墨绿压色 + 上下暗角 + 左下角一句提炼。 */
export const PhotoFill: React.FC<{src: string; caption?: string}> = ({src, caption}) => (
  <>
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(180deg, rgba(19,41,31,0.34) 0%, rgba(19,41,31,0.10) 34%, rgba(5,15,10,0.88) 100%)',
      }}
    />
    {caption ? (
      <span
        style={{
          position: 'absolute',
          left: 34,
          bottom: 24,
          fontSize: 38,
          fontWeight: 700,
          fontFamily: FONT.cn,
          color: C.cream,
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}
      >
        {caption}
      </span>
    ) : null}
  </>
);

/** 小药丸。 */
export const Chip: React.FC<{text: string; gold?: boolean; size?: number}> = ({
  text,
  gold,
  size = 38,
}) => (
  <span
    style={{
      fontSize: size,
      fontWeight: 700,
      fontFamily: FONT.cn,
      lineHeight: 1.15,
      color: gold ? C.bg : C.cream,
      background: gold ? C.gold : 'rgba(11,26,19,0.92)',
      border: '2px solid rgba(232,180,76,0.42)',
      borderRadius: 14,
      padding: '12px 30px',
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </span>
);

/** 药丸行：撑满文字卡的一条，用来把短句卡填实。 */
export const ChipRow: React.FC<{at: number; items: string[]; gold?: number; size?: number}> = ({
  at,
  items,
  gold = -1,
  size = 36,
}) => (
  <Pop at={at} dy={12} style={{display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center'}}>
    {items.map((t, i) => (
      <Chip key={t} text={t} gold={i === gold} size={size} />
    ))}
  </Pop>
);

/** 设备框（电脑显示器）：讲「屏幕 / 电脑 / 界面」时用它。 */
export const Monitor: React.FC<{
  at: number;
  title: string;
  glow?: boolean;
  badge?: string;
  badgeTone?: 'red' | 'gold';
  w?: number;
  screenH?: number;
  children?: React.ReactNode;
}> = ({at, title, glow, badge, badgeTone = 'red', w = 660, screenH = 200, children}) => {
  const badgeBg = badgeTone === 'gold' ? C.gold : 'rgba(196,66,54,0.92)';
  const badgeFg = badgeTone === 'gold' ? C.bg : '#FFE7E2';
  return (
    <Pop
      at={at}
      d={0.5}
      dy={22}
      style={{width: w, display: 'flex', flexDirection: 'column', alignItems: 'center'}}
    >
      <div
        style={{
          width: '100%',
          borderRadius: 20,
          border: `3px solid rgba(232,180,76,${glow ? 0.72 : 0.42})`,
          background: '#0A1A12',
          boxShadow: glow
            ? '0 0 0 8px rgba(232,180,76,0.10), 0 26px 64px rgba(0,0,0,0.55)'
            : '0 26px 64px rgba(0,0,0,0.5)',
          padding: 18,
          boxSizing: 'border-box',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14}}>
          <span style={{width: 13, height: 13, borderRadius: 7, background: '#ff5f56'}} />
          <span style={{width: 13, height: 13, borderRadius: 7, background: '#ffbd2e'}} />
          <span style={{width: 13, height: 13, borderRadius: 7, background: '#27c93f'}} />
          <span style={{fontSize: 24, color: C.dim, fontFamily: FONT.cn, marginLeft: 8}}>
            {title}
          </span>
        </div>
        <div
          style={{
            height: screenH,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: glow
              ? 'linear-gradient(135deg, rgba(232,180,76,0.22), rgba(19,41,31,0.6))'
              : 'linear-gradient(135deg, rgba(232,180,76,0.07), rgba(19,41,31,0.6))',
            border: '1px solid rgba(232,180,76,0.22)',
          }}
        >
          {children}
        </div>
      </div>
      <div
        style={{
          width: 150,
          height: 16,
          background: 'rgba(232,180,76,0.26)',
          borderRadius: '0 0 10px 10px',
        }}
      />
      <div
        style={{width: 250, height: 11, marginTop: 5, background: 'rgba(232,180,76,0.16)', borderRadius: 6}}
      />
      {badge ? (
        <div
          style={{
            marginTop: 18,
            fontSize: 40,
            fontWeight: 700,
            fontFamily: FONT.cn,
            color: badgeFg,
            background: badgeBg,
            borderRadius: 14,
            padding: '10px 32px',
            whiteSpace: 'nowrap',
            boxShadow: '0 16px 40px rgba(0,0,0,0.42)',
          }}
        >
          {badge}
        </div>
      ) : null}
    </Pop>
  );
};

/** 平台通知条（平台口吻）。 */
export const Notice: React.FC<{at: number; title: string; body: string; stamp?: string}> = ({
  at,
  title,
  body,
  stamp,
}) => (
  <Pop at={at} d={0.5} dy={18} style={{width: '100%'}}>
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 20,
        background: 'rgba(11,26,19,0.94)',
        border: '2px solid rgba(232,180,76,0.30)',
        padding: '26px 30px',
        position: 'relative',
        display: 'flex',
        gap: 22,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          width: 68,
          height: 68,
          borderRadius: 34,
          background: 'rgba(196,66,54,0.18)',
          border: '2px solid rgba(196,66,54,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          color: '#F08A7E',
        }}
      >
        !
      </span>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start'}}>
        <span style={{fontSize: 40, fontWeight: 700, color: C.cream, fontFamily: FONT.cn}}>{title}</span>
        <span style={{fontSize: 32, color: C.dim, fontFamily: FONT.cn, lineHeight: 1.3}}>{body}</span>
      </div>
      {stamp ? (
        <span
          style={{
            position: 'absolute',
            right: 20,
            top: -18,
            transform: 'rotate(-8deg)',
            fontSize: 32,
            fontWeight: 700,
            color: '#FFD9D3',
            background: 'rgba(196,66,54,0.95)',
            borderRadius: 10,
            padding: '8px 18px',
            fontFamily: FONT.cn,
            whiteSpace: 'nowrap',
          }}
        >
          {stamp}
        </span>
      ) : null}
    </div>
  </Pop>
);

/** 词格：一个词 + 金色 ✗ 角标（在自己的语音点弹出）。 */
export const WordCell: React.FC<{
  id: string;
  text: string;
  anchor: string;
  size?: number;
  h?: number;
}> = ({id, text, anchor, size = 62, h = 150}) => {
  const t = useShotTime();
  const at = useSay(id, anchor);
  const xAt = at + 0.7;
  const xP = tw(t, xAt, 0.22, ease);
  const pop = tw(t, xAt, 0.16, cubicBezier(0.2, 0.9, 0.3, 1));
  const settle = tw(t, xAt + 0.16, 0.14, cubicBezier(0.3, 0, 0.2, 1));
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: h,
        borderRadius: 18,
        background: 'rgba(232,180,76,0.07)',
        border: '1.5px solid rgba(232,180,76,0.34)',
        padding: '0 26px',
      }}
    >
      <RiseLine text={text} startAt={at} fontSize={size} color={C.cream} />
      {xP > 0 ? (
        <div
          style={{
            position: 'absolute',
            right: -14,
            top: -14,
            width: 56,
            height: 56,
            borderRadius: 28,
            background: C.gold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.bg,
            fontSize: 38,
            fontWeight: 700,
            fontFamily: FONT.cn,
            opacity: xP,
            transform: `scale(${lerp(lerp(0.5, 1.18, pop), 1, settle)})`,
            boxShadow: '0 6px 18px rgba(0,0,0,0.5), 0 0 0 4px rgba(11,26,19,0.92)',
          }}
        >
          ×
        </div>
      ) : null}
    </div>
  );
};

/** 词格网格（2 列）。 */
export const WordGrid: React.FC<{
  items: Array<{id: string; text: string; anchor: string}>;
  size?: number;
  h?: number;
}> = ({items, size = 60, h = 150}) => (
  <div
    style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 34px', width: '100%'}}
  >
    {items.map((w) => (
      <WordCell key={w.text} id={w.id} text={w.text} anchor={w.anchor} size={size} h={h} />
    ))}
  </div>
);
