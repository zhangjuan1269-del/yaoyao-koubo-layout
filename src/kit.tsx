import React, {createContext, useContext} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, CONTENT_BOTTOM, CONTENT_TOP, FONT} from './theme';
import {tSay} from './timing';

/* ============================================================
 * 本片共享件。所有「跟着嘴走」的时间锚点一律走 tSay()（ASR 字级时间戳），
 * 不许写死秒数——这是本片要证明的那件事。
 * ============================================================ */

/* ---------- 镜内时钟 ---------- */
/**
 * 每一镜是独立 Sequence，起点 = round(startSec*fps) - lead，所以 Sequence 内的
 * useCurrentFrame() 比「镜内口播时间」**早了 lead 帧**。而 tSay() 返回的是镜内口播秒。
 * 两者不换算就会整体提前 lead/fps 秒（s1 的 lead=0 所以看不出来，s2–s5 早 0.4s）。
 * 这个 context 把两者对齐：镜内口播秒 = (frame - lead) / fps。
 */
const ClockCtx = createContext(0);

export const ShotClock: React.FC<{lead: number; children: React.ReactNode}> = ({
  lead,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <ClockCtx.Provider value={(frame - lead) / fps}>{children}</ClockCtx.Provider>;
};

/** 镜内口播秒（与 tSay 同一坐标系）。所有动效时间必须用它，不许用 frame/fps。 */
export const useShotTime = (): number => useContext(ClockCtx);

/* ---------- 缓动：GSAP core 不带 CustomEase，自己解 cubic-bezier ---------- */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return function (p: number) {
    let t = p;
    for (let i = 0; i < 8; i++) {
      const e = ((ax * t + bx) * t + cx) * t - p;
      if (Math.abs(e) < 1e-6) break;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    t = Math.max(0, Math.min(1, t));
    return ((ay * t + by) * t + cy) * t;
  };
}
export const FADE_EASE = cubicBezier(0.2, 0.8, 0.2, 1);
export const TRAVEL_EASE = cubicBezier(0.2, 0.8, 0.6, 0.85);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const tw = (t: number, t0: number, d: number, ease: (x: number) => number) =>
  ease(clamp01((t - t0) / d));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/* ---------- 逐字升起（per-character-rise 卡片原参数） ---------- */
/** 位移 0.333s / 淡入 0.70s / 错峰 0.0333s / 起始下沉 = 字号 44% / 零模糊零缩放 */
export const RiseLine: React.FC<{
  text: string;
  /** 镜内秒：整句入场锚点（= 首字的字级语音时间戳，由 tSay 给） */
  startAt: number;
  fontSize: number;
  lineHeight?: number;
  color?: string;
  /** 该子串换强调色（一句最多一个强调，design-language §6） */
  accent?: string;
  /** 整句提前量：字在自己的语音点之前 lead 秒起升，落定正好在字上 */
  lead?: number;
}> = ({text, startAt, fontSize, lineHeight = 1.15, color = C.text, accent, lead = 0.2}) => {
  const t = useShotTime();
  const chars = Array.from(text);
  const rise = fontSize * 0.44;
  const aFrom = accent ? text.indexOf(accent) : -1;
  const aTo = aFrom >= 0 && accent ? aFrom + accent.length : -1;

  // 首字起升之前整句不占位。否则底板会先按最终高度撑开，
  // 里面空空如也 —— 空框会被读成「画面卡住了」（s3 的底板就是栽在这）。
  if (t < startAt - lead) return null;

  return (
    <span
      style={{
        whiteSpace: 'nowrap',
        fontSize,
        fontWeight: 600,
        lineHeight,
        letterSpacing: 0, // 中文字距 0（design-language §2）
        fontFamily: FONT.cn,
        color,
      }}
    >
      {chars.map((ch, i) => {
        const at = startAt - lead + i * 0.0333;
        const fadeP = tw(t, at, 0.7, FADE_EASE);
        const y = lerp(rise, 0, tw(t, at, 0.3333, TRAVEL_EASE));
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              backfaceVisibility: 'hidden',
              transformOrigin: '50% 55%',
              opacity: fadeP,
              transform: `translateY(${y}px)`,
              color: aFrom >= 0 && i >= aFrom && i < aTo ? C.gold : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/* ---------- 语义锚点 ---------- */
/** 镜内秒：`substr` 开始被念到的时刻（ASR 字级）。查不到回落到 0 —— 查不到就是写错了。 */
export const useSay = (sceneId: string, substr: string): number => tSay(sceneId, substr);

/* ---------- 幕底 ---------- */
/**
 * 让台之后人物只剩一个圆章，画面必须有自己的底 —— 否则是一片死绿的空场。
 * 全屏镜里这一层被人物层整块盖住，不参与画面；只在缩位/圆章期露出来。
 * 深底 + 顶部一层极淡的金辉 + 72px 细格（4% 不抢字）。
 */
export const Backdrop: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse 74% 44% at 50% 26%, rgba(232,180,76,0.17), transparent 72%)',
      }}
    />
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse 96% 58% at 50% 96%, rgba(11,26,19,0.62), transparent 72%)',
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage:
          'linear-gradient(rgba(232,180,76,0.07) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(232,180,76,0.07) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
  </AbsoluteFill>
);

/* ---------- 中段内容区（chip 时代的地基） ---------- */
/**
 * 人物钉右上角圆窗之后，中段 y≈440–1360 整块都是空的（旧版这块被人脸占着）。
 * 所有中段图形统一放进这个区，并**尽量铺满** —— 空着就会被读成「中间养鱼」。
 *
 * 区宽固定 888（左右 action-safe 96），区高 920。内部是一个纵向 flex：
 *   · align='center'（默认）：内容在中段垂直居中 —— 单卡镜用；
 *   · align='top'：贴中段顶 —— 「上图形 + 下素材」两段式用。
 *
 * `scale` 是第一版的手段：各镜的卡片是按「躲人脸」的旧约束做小的，
 * 内部尺寸（字号、条长、面板宽）都是写死的常量。整卡等比放大能一次把
 * 「太小」解决掉，又不会把卡里的对齐关系搞散。
 * `transformOrigin` 跟着 align 走：居中放大不会偏心，贴顶放大向下长。
 *
 * **但 scale 解决不了「填满」（10-10 第二版）**：内容区是 888 × 920 的竖长块，
 * 而中段这些卡天生是**扁**的（图表 888×400、转发图 888×350…）。等比放大时
 * 宽度先撞墙 —— 888 宽的卡 scale > 1.11 就横向越界（内容区左右只剩 96 边距），
 * 于是卡最多长到 ~500 高，上下各空 200+ 的幕底，正是用户说的
 * 「卡片就这么一点点居在中间…上面和下面还有这么多留白的地方」「中间养鱼吗」。
 *
 * 所以 `fill` 才是真正的解法：**纵向撑满，而不是等比放大**。
 *   · 内容区整幅（888 × 920）交给子元素，子元素 `flex:1` 撑开；
 *   · 卡 `height:100%` + 卡内 `justifyContent:'space-evenly'`，
 *     留白从「幕底上的一块空场」变成「卡片内部的呼吸」——
 *     同样多空白，前者读成画面漏了，后者读成排版刻意。
 * 这时 `scale` 退化成整体微调（一般留 1）。
 */
export const Stage: React.FC<{
  children: React.ReactNode;
  scale?: number;
  align?: 'center' | 'top';
  /** 纵向撑满内容区（888 × 920），而不是按内容自然高度居中 */
  fill?: boolean;
}> = ({children, scale = 1, align = 'center', fill = false}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: 96,
        width: 888,
        top: CONTENT_TOP,
        height: CONTENT_BOTTOM - CONTENT_TOP,
        display: 'flex',
        flexDirection: 'column',
        alignItems: fill ? 'stretch' : 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      <div
        style={{
          width: fill ? '100%' : undefined,
          height: fill ? '100%' : undefined,
          display: fill ? 'flex' : undefined,
          flexDirection: fill ? 'column' : undefined,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: align === 'center' ? '50% 50%' : '50% 0%',
        }}
      >
        {children}
      </div>
    </div>
  </AbsoluteFill>
);

/**
 * 撑满型卡片外框：`Stage fill` 里的卡统一用它包一层。
 * 干两件事：① 卡纵向撑满内容区；② 卡内留白交给 `space-evenly` 均分。
 * `stretch` 这个 wrapper 负责把 `flex:1` 传下去（`Stage fill` 的子元素是 flex item）。
 */
export const FillBox: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  /** 卡内纵向分布；默认均分 */
  justify?: 'space-evenly' | 'space-between' | 'center';
  /** 卡内边距 */
  pad?: string;
}> = ({children, opacity, justify = 'space-evenly', pad}) => (
  <div style={{opacity, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
    <Panel
      pad={pad}
      style={{width: '100%', flex: 1, boxSizing: 'border-box', justifyContent: justify}}
    >
      {children}
    </Panel>
  </div>
);

/* ---------- 卡片底板（圆角 28 = 卡片档，design-language §3） ---------- */
export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: string;
  /** 镜内秒：底板跟着自己的内容一起进场；不传 = 一直在。
   *  不许内容没出来先摆一个空框 —— 空框会被读成「画面卡住了」。 */
  fadeAt?: number;
}> = ({children, style, pad = '34px 44px', fadeAt}) => {
  const t = useShotTime();
  const op = fadeAt === undefined ? 1 : tw(t, fadeAt, 0.3, cubicBezier(0.2, 0.9, 0.25, 1));
  if (op <= 0) return null;
  return (
    <div
      style={{
        padding: pad,
        borderRadius: 28,
        // 10-10：原来底色 rgba(11,26,19,0.82) 跟幕底 #13291F 几乎同色，
        // 用户原话「感觉跟画面贴在一起了…相当于覆盖了一个打了补丁一样的感觉」。
        // 现在改成「明显更深 + 顶部一道金内高光 + 更亮的金边 + 更重的投影」，
        // 让卡真正从幕底里浮起来，而不是糊一块补丁上去。
        background: 'linear-gradient(180deg, rgba(9,24,17,0.95) 0%, rgba(5,15,10,0.97) 100%)',
        border: '2px solid rgba(232,180,76,0.38)',
        boxShadow:
          '0 28px 70px rgba(0,0,0,0.58), 0 0 0 1px rgba(232,180,76,0.06), inset 0 1px 0 rgba(232,180,76,0.16)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: op,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------- 画面卡：用免版权素材补画面（B-roll） ---------- */
/**
 * 让台之后中段会空出一大片（图形块都在上三分之一），画面读起来「空洞」。
 * 用一张画面卡把那段填上 —— 素材来自 Pexels（Pexels License：免费商用、免署名）。
 *
 * 规格：卡高 480 / 宽 888（≈1.85:1），objectFit:cover 所以素材按需裁；
 * 上面压两层：品牌墨绿 multiply（把素材收进色系）+ 上下暗角（让卡里的亮部不炸）。
 * 进场与让台同一拍：淡入 + 轻微上浮，不做弹跳（这是「补画面」不是「炫技」）。
 */
export const MediaCard: React.FC<{
  /** public 下的相对路径 */
  src: string;
  /** 镜内秒：进场 */
  at: number;
  /** 素材起始帧（同一条素材在多镜复用时可错开取段） */
  startFrom?: number;
  /** 位置与尺寸 */
  style?: React.CSSProperties;
}> = ({src, at, startFrom = 0, style}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.5, cubicBezier(0.2, 0.9, 0.25, 1));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: 26,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: `2px solid ${C.line}`,
        boxShadow: '0 20px 54px rgba(0,0,0,0.42)',
        opacity: p,
        transform: `translateY(${lerp(26, 0, p)}px)`,
        ...style,
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
      {/* 品牌墨绿压色：素材多偏冷偏亮，压一层才和幕底同一个色系（压太狠会发闷） */}
      <AbsoluteFill style={{background: C.bg, opacity: 0.16, mixBlendMode: 'multiply'}} />
      {/* 上下暗角：卡里的高光别把旁边的字压下去 */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(11,26,19,0.3), transparent 34%, transparent 66%, rgba(11,26,19,0.3))',
        }}
      />
    </div>
  );
};

/**
 * 真实截图卡 —— 跟 MediaCard 同一套外框，但内层是图片（PNG/JPG）不是视频。
 *
 * **为什么压色很轻、且不放暗角**：白底真实截图（用户的抖音后台）压狠了数字读不清，
 * 而截图的「白」本身是「这是真页面」的最大信号，不能灭。
 * 默认 `tint=0.08` 只是为了把白底收一点进色温，不让它在深绿幕底上炸开。
 * 不用暗角：截图的角里通常是表格/卡片边界，加暗角会糊掉。
 */
export const ImageCard: React.FC<{
  src: string;
  at: number;
  fit?: 'cover' | 'contain';
  tint?: number;
  style?: React.CSSProperties;
}> = ({src, at, fit = 'cover', tint = 0.08, style}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.5, cubicBezier(0.2, 0.9, 0.25, 1));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: 26,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: `2px solid ${C.line}`,
        boxShadow: '0 20px 54px rgba(0,0,0,0.42)',
        background: '#0B1A13',
        opacity: p,
        transform: `translateY(${lerp(26, 0, p)}px)`,
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: fit}}
      />
      {tint > 0 ? (
        <AbsoluteFill
          style={{background: C.bg, opacity: tint, mixBlendMode: 'multiply'}}
        />
      ) : null}
    </div>
  );
};

/* ---------- 人物层：全屏 ←→ 右上金框圆窗（host-portrait-bubble） ---------- */

/**
 * 全局人物层开关（10-09 改版）。true 时，场景里的 `HostLayer` 一律**不画人**——
 * 人物交给 MainVideo 的 `<GlobalHost />` 单独一层统一负责。留着这个开关是为了
 * 随时能切回旧版对照（改回 false 即恢复「每镜各自画人」的旧行为）。
 */
export const GLOBAL_HOST: boolean = true;

/**
 * 缩位让台。**不用 clip-path 裁切**。
 *
 * 为什么不用裁切：旧版用 `inset()` 裁一个窗 + 内层 scale/位移。缩位**中途**那一二十帧，
 * 画面就是「深底上凭空一块硬边矩形」，而且窗边会横切人脸 —— 用户截的 0:05 两帧
 * 正是这个坏相（读起来像渲染坏了，不像设计）。
 *
 * 为什么是**圆窗**而不是小方窗：9:16 的方窗在缩位后只剩 ~180px 宽，脸小到看不清；
 * 收成正方形（1:1）同样外框能多拿一截宽度，脸大一倍。圆窗也是账号既有的
 * 「金边圆窗人像」形态（koubo-auto-edit 定稿），不是新发明。
 *
 * **为什么放右上角、不放底部**：竖屏发布时底部那条是抖音的**视频描述 + 播放控件**，
 * 常驻件放那儿会被整块盖掉（用户 10-09 反馈：「还要加视频描述的，就完全被盖住了」）。
 * 所以常驻件只能落在上三分之二里 —— 字幕带（y1409–1500）之上、图形块之侧。
 *
 *  · t=0 时窗就是整幅（宽高 = W/H、无圆角无边无影）→ 全屏镜看不出这一层；
 *  · t=1 时收成右上角一个正方形，圆角 = 边长一半 → 正圆；上/右缘贴 action-safe 96px；
 *  · 金边/投影**早于**缩位主体进场（chrome 0.10→0.40）——等缩完才描边的话，
 *    中途那十几帧还是「光秃秃一块矩形」。
 */
export const HostLayer: React.FC<{
  /** 人物素材在整片时间轴上的起始帧（每镜是独立 Sequence，不偏移口型就对不上） */
  startFrom: number;
  /** 镜内秒：开始缩位；不传 = 全程保持 chipFrom 状态 */
  chipAt?: number;
  shrink?: number;
  /** 起始进度：0 = 全屏，1 = 圆窗（承接上一镜的让台） */
  chipFrom?: number;
  /** 目标进度：默认 1（让台）；传 0 = 反向放大回归全屏（交接纪律：图形先退 → 人再放大） */
  chipTo?: number;
  /** 圆窗直径。要满足 `chipTop + chipD < 图形块顶边`，否则会压到上面的底板。 */
  chipD?: number;
  /** 圆窗右缘距画面右（action-safe 96） */
  chipRight?: number;
  /** 圆窗上缘距画面顶（action-safe 96） */
  chipTop?: number;
}> = ({
  startFrom,
  chipAt,
  shrink = 0.34,
  chipFrom = 0,
  chipTo = 1,
  chipD = 288,
  chipRight = 96,
  chipTop = 96,
}) => {
  // 10-09：人物已抽成全局一层（<GlobalHost />），场景内不再重复画人。
  if (GLOBAL_HOST) return null;
  const {width: W, height: H} = useVideoConfig();
  const sec = useShotTime();

  const t =
    chipAt === undefined
      ? chipFrom
      : interpolate(sec, [chipAt, chipAt + shrink], [chipFrom, chipTo], {
          easing: Easing.inOut(Easing.quad), // power2.inOut：这是「让」不是「弹」
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const left = lerp(0, W - chipRight - chipD, t);
  const top = lerp(0, chipTop, t);
  const width = lerp(W, chipD, t);
  const height = lerp(H, chipD, t);
  // 圆角跟着「当前短边」走：t=0 是 0（整幅方框），t=1 是边长一半（正圆）。
  const radius = (t * Math.min(width, height)) / 2;

  // 金边/投影早于缩位主体进场：中途任何一帧都得读成「一张刻意的圆窗」。
  const chrome = interpolate(t, [0.1, 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          borderRadius: radius,
          overflow: 'hidden',
          boxSizing: 'border-box',
          border: `${(4 * chrome).toFixed(2)}px solid rgba(232,180,76,${chrome.toFixed(3)})`,
          boxShadow: `0 ${(26 * chrome).toFixed(1)}px ${(64 * chrome).toFixed(1)}px rgba(0,0,0,${(
            0.5 * chrome
          ).toFixed(3)})`,
        }}
      >
        <OffthreadVideo
          src={staticFile('dh/host_raw.mp4')}
          startFrom={startFrom}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // 脸心在素材 52.8% 高处；收成方窗时把取景框压在脸上，别把人顶到窗顶
            objectPosition: '50% 52%',
            // 原片是夜里室内，整体偏暗 —— 提亮 + 一点点饱和，别让脸发灰
            filter: 'brightness(1.16) saturate(1.06) contrast(1.02)',
          }}
          muted
        />
        {/* 深墨绿调色：只留一点点把偏冷的窗光收进品牌底色（原 0.32 压得太黑） */}
        <AbsoluteFill style={{background: C.bg, opacity: 0.1, mixBlendMode: 'multiply'}} />
        {/* 暗角只在全屏期有效；缩成圆窗后要退掉，否则窗里一圈黑 */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 44%, transparent 42%, ${C.bgDeep} 108%)`,
            opacity: 0.4 * (1 - t),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 全局人物层：固定位 · 全片一条连续素材 ---------- */
/**
 * 10-09 改版（用户定稿）。人物从 19 个镜头里**抽出来**，做成全片唯一的一层。
 *
 * 旧版为什么读起来「闪 + 精分」：人物层画在每个镜头**内部**（在 ShotFade 里、在
 * CameraRig 里），于是
 *   · 每次切镜，人物跟着这一镜淡出→下一镜淡入 —— 观感是人物一闪一闪；
 *   · 镜头那条推进曲线（1.048→1.052）同样作用在人物上 —— 圆窗里的脸一直在缩放、
 *     在位移，用户读成「人物一直在动来动去，像精分」。
 *
 * 新版：一整条 host_raw.mp4 连续播放。素材时间轴与全片时间轴**同起点**（旧版每镜的
 * `startFrom = round(startSec*fps) - lead` 恰好等于该镜 Sequence 的 from，即
 * 「全片第 N 帧 ↔ 素材第 N 帧」），所以这里不需要 startFrom，也不受任何镜头边界影响。
 * 只用一个窗口决定「人在画面哪儿」：
 *   · 中段（shrinkAt → expandAt）：右上角金框圆窗，窗口**钉死不动**（不跟相机），
 *     画面里的图形照常走它们的推进；
 *   · 开场（0 → shrinkAt）与收尾（expandAt → 片尾）：窗口展开回整幅 —— 口播的头和尾
 *     要露全人（自我介绍 / 引流），中间那段才交给画面。
 *
 * z 序：MainVideo 里画在 Backdrop 之上、SHOTS 之下 —— 与旧版「HostLayer 是场景第一个
 * 子元素」完全一致，所以场景里的顶带板（s1 标题 / s19 关注件）依旧压在人物之上。
 */
export const GlobalHost: React.FC<{
  /** 全局秒：开始缩位（此前全屏） */
  shrinkAt: number;
  shrinkDur?: number;
  /** 全局秒：开始放大回全屏 */
  expandAt: number;
  expandDur?: number;
  /** 圆窗直径 / 右缘距画面右 / 上缘距画面顶（沿用 HostLayer 的定稿值） */
  chipD?: number;
  chipRight?: number;
  chipTop?: number;
}> = ({
  shrinkAt,
  shrinkDur = 0.5,
  expandAt,
  expandDur = 0.5,
  chipD = 288,
  chipRight = 96,
  chipTop = 96,
}) => {
  const {width: W, height: H, fps} = useVideoConfig();
  const frame = useCurrentFrame();

  // t：0 = 整幅全屏，1 = 右上圆窗。两端各留一段平台期（0→0 / 1→1），
  // 中间两段才是真正的缩位与放大；inputRange 严格递增，不会出现除零。
  const t = interpolate(
    frame,
    [0, shrinkAt * fps, (shrinkAt + shrinkDur) * fps, expandAt * fps, (expandAt + expandDur) * fps],
    [0, 0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    },
  );

  const left = lerp(0, W - chipRight - chipD, t);
  const top = lerp(0, chipTop, t);
  const width = lerp(W, chipD, t);
  const height = lerp(H, chipD, t);
  const radius = (t * Math.min(width, height)) / 2;
  const chrome = interpolate(t, [0.1, 0.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          borderRadius: radius,
          overflow: 'hidden',
          boxSizing: 'border-box',
          border: `${(4 * chrome).toFixed(2)}px solid rgba(232,180,76,${chrome.toFixed(3)})`,
          boxShadow: `0 ${(26 * chrome).toFixed(1)}px ${(64 * chrome).toFixed(1)}px rgba(0,0,0,${(
            0.5 * chrome
          ).toFixed(3)})`,
        }}
      >
        <OffthreadVideo
          src={staticFile('dh/host_raw.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 52%',
            filter: 'brightness(1.16) saturate(1.06) contrast(1.02)',
          }}
          muted
        />
        <AbsoluteFill style={{background: C.bg, opacity: 0.1, mixBlendMode: 'multiply'}} />
        {/* 暗角只在全屏期有效；收成圆窗后退掉，否则窗里一圈黑 */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 44%, transparent 42%, ${C.bgDeep} 108%)`,
            opacity: 0.4 * (1 - t),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 截图卡：真实后台截图（图片版 MediaCard） ---------- */
/**
 * 与 `MediaCard` 同款外框，区别只有两点：
 *   · 内容是**静态图**（她给的创作者后台截图），所以用 `Img` 不是 `OffthreadVideo`；
 *   · 内里垫一层米白 + `objectFit: contain` —— 后台截图是浅色、比例各异，
 *     直接 `cover` 会把表格裁掉。米白底垫着才像「贴了一张截图」而不是「渲染坏了」。
 * 用途：`HostLayer` 收成小窗后，中段露出的空墙用真实素材补（10-09 改版）。
 */
export const StillCard: React.FC<{
  /** public 下的相对路径 */
  src: string;
  /** 镜内秒：进场 */
  at: number;
  /** 位置与尺寸 */
  style?: React.CSSProperties;
  /** 截图与卡片边缘之间的米白留白 */
  pad?: number;
}> = ({src, at, style, pad = 18}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.5, cubicBezier(0.2, 0.9, 0.25, 1));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        borderRadius: 26,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: `2px solid ${C.line}`,
        boxShadow: '0 20px 54px rgba(0,0,0,0.42)',
        background: 'rgba(247,242,231,0.94)',
        padding: pad,
        opacity: p,
        transform: `translateY(${lerp(26, 0, p)}px)`,
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12, display: 'block'}}
      />
    </div>
  );
};

/* ---------- 数字板（word-synced pop） ---------- */
export const NumberSlab: React.FC<{
  text: string;
  /** 镜内秒：自己的语音时间戳 */
  at: number;
  fontSize?: number;
  color?: string;
  unit?: string;
  unitSize?: number;
}> = ({text, at, fontSize = 150, color = C.gold, unit, unitSize = 44}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.34, cubicBezier(0.2, 0.9, 0.25, 1));
  // 起 → 过冲 → 回落（三段连续，不能在同一帧从 1.05 直接掉到 1.0）
  const pop = tw(t, at, 0.22, cubicBezier(0.2, 0.9, 0.3, 1));
  const settle = tw(t, at + 0.22, 0.14, cubicBezier(0.3, 0, 0.2, 1));
  if (p <= 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        opacity: p,
        transform: `scale(${lerp(lerp(0.9, 1.05, pop), 1, settle)})`,
        fontFamily: FONT.cn,
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 700,
          lineHeight: 1,
          color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {text}
      </span>
      {unit ? (
        <span style={{fontSize: unitSize, fontWeight: 600, color: C.dim, lineHeight: 1}}>{unit}</span>
      ) : null}
    </div>
  );
};

/* ---------- 数据行：左标签 + 右数值，值随嘴出来 ---------- */
/**
 * 全片所有「标签 → 数值」的行共用这一个件（s5/s8/s13/s14 都用它）。
 * 值必须在自己的语音时间戳上落地 —— 不许提前摆好再等嘴。
 */
export const StatRow: React.FC<{
  label: string;
  value: string;
  /** 镜内秒：值的语音时间戳 */
  at: number;
  /** 更好的那条用金（结论靠色，不靠字重） */
  accent?: boolean;
  labelW?: number;
  valueSize?: number;
  /** 值后面跟的小字（单位 / 备注） */
  unit?: string;
}> = ({label, value, at, accent = false, labelW = 250, valueSize = 96, unit}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.42, cubicBezier(0.2, 0.9, 0.25, 1));
  if (p <= 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 36,
        opacity: p,
        transform: `translateX(${lerp(34, 0, p)}px)`,
      }}
    >
      <span
        style={{
          width: labelW,
          textAlign: 'right',
          fontSize: 44,
          fontWeight: 600,
          color: C.dim,
          fontFamily: FONT.cn,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: valueSize,
          fontWeight: 700,
          lineHeight: 1,
          color: accent ? C.gold : C.cream,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: FONT.cn,
        }}
      >
        {value}
      </span>
      {unit ? (
        <span style={{fontSize: 36, fontWeight: 600, color: C.dim, fontFamily: FONT.cn, lineHeight: 1}}>
          {unit}
        </span>
      ) : null}
    </div>
  );
};

/* ---------- 对比条：两条并排，长度按 value/max 归一 ---------- */
/**
 * 「播放量高的那条，两秒就划走的比例反而更高」这类**反差**靠长度说话，
 * 不靠形容词。条子在自己的语音点上长出来，长完就静置（不做呼吸）。
 */
export const CompareBar: React.FC<{
  label: string;
  value: number;
  /** 归一化的满格值 */
  max: number;
  at: number;
  accent?: boolean;
  /** 条右端的小字 */
  caption?: string;
  barW?: number;
}> = ({label, value, max, at, accent = false, caption, barW = 460}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.52, cubicBezier(0.2, 0.9, 0.25, 1));
  if (p <= 0) return null;
  const w = (value / max) * barW * p;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 26, opacity: p}}>
      <span
        style={{
          width: 190,
          textAlign: 'right',
          fontSize: 40,
          fontWeight: 600,
          color: C.dim,
          fontFamily: FONT.cn,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <div style={{width: barW, height: 22, borderRadius: 11, background: 'rgba(247,242,231,0.10)'}}>
        <div
          style={{
            width: w,
            height: 22,
            borderRadius: 11,
            background: accent ? C.gold : 'rgba(247,242,231,0.52)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 38,
          fontWeight: 700,
          color: accent ? C.gold : C.cream,
          fontFamily: FONT.cn,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {caption ?? `${value}`}
      </span>
    </div>
  );
};

/* ---------- 步骤行：序号圆片 + 文案（顺序类语义专用） ---------- */
export const StepRow: React.FC<{n: number; text: string; at: number; accent?: boolean}> = ({
  n,
  text,
  at,
  accent = false,
}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.44, cubicBezier(0.2, 0.9, 0.25, 1));
  if (p <= 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        opacity: p,
        transform: `translateX(${lerp(-30, 0, p)}px)`,
      }}
    >
      <span
        style={{
          width: 62,
          height: 62,
          borderRadius: 31,
          flex: '0 0 62px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: accent ? C.gold : 'rgba(232,180,76,0.14)',
          border: `2px solid ${accent ? C.gold : C.line}`,
          color: accent ? C.bg : C.cream,
          fontSize: 36,
          fontWeight: 700,
          fontFamily: FONT.cn,
          lineHeight: 1,
        }}
      >
        {n}
      </span>
      <span style={{fontSize: 56, fontWeight: 600, color: C.cream, fontFamily: FONT.cn, lineHeight: 1.1}}>
        {text}
      </span>
    </div>
  );
};

/* ---------- 划线否定：字先落定，再一笔划掉 ---------- */
/**
 * 「我一开始以为呢，这说明开头不重要」—— 这一句的语义是**否定一个旧认知**，
 * 所以字必须先完整出现（她真的说了这句话），再被划掉。
 * 不许反过来（先划掉再显字 = 观众没读到就被否了）。
 */
export const StrikeLine: React.FC<{
  text: string;
  /** 镜内秒：整句入场 */
  at: number;
  /** 镜内秒：起笔划掉 */
  strikeAt: number;
  fontSize: number;
  color?: string;
}> = ({text, at, strikeAt, fontSize, color = C.cream}) => {
  const t = useShotTime();
  const p = tw(t, at, 0.7, FADE_EASE);
  const s = tw(t, strikeAt, 0.34, cubicBezier(0.3, 0, 0.2, 1));
  if (p <= 0) return null;
  return (
    <span style={{position: 'relative', display: 'inline-block', opacity: p}}>
      <span
        style={{
          fontSize,
          fontWeight: 600,
          lineHeight: 1.15,
          color: s > 0.5 ? C.dim : color,
          fontFamily: FONT.cn,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      {s > 0 ? (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: '54%',
            width: `${s * 100}%`,
            height: Math.max(4, fontSize * 0.06),
            borderRadius: 4,
            background: C.gold,
            transformOrigin: '0 50%',
          }}
        />
      ) : null}
    </span>
  );
};

/** 关键词换色：把一句话里的 accent 词标出来（一句最多一个强调，design-language §6）。 */
export const AccentLine: React.FC<{
  text: string;
  accent: string;
  fontSize: number;
  color?: string;
  weight?: number;
}> = ({text, accent, fontSize, color = C.text, weight = 600}) => {
  const parts = text.split(accent);
  return (
    <span
      style={{
        fontSize,
        fontWeight: weight,
        lineHeight: 1.2,
        letterSpacing: 0,
        fontFamily: FONT.cn,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 ? <span style={{color: C.gold}}>{accent}</span> : null}
        </React.Fragment>
      ))}
    </span>
  );
};
