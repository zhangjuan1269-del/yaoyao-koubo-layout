import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C} from './theme';
import {Backdrop, GlobalHost, ShotClock} from './kit';
import {Environment, Overlays} from './Environment';
import {Subtitles} from './Subtitles';
import {SHOTS, shotSequence} from './shots';
import {SCENES} from './scenes';
import {CUES} from './sfx';

/**
 * ⑤-1 首镜先做先确认（SKILL.md）：合成骨架先搭全（全片时长 / SHOTS 全表 / 全局系统），
 * 还没实现的镜头落到这个占位场景 —— 只让幕底与字幕露出来，不写任何动效。
 * 这样 render_shots 的段表 / 时长断言原样生效，样板镜就能先渲一条有声预览给用户看。
 */
const PlaceholderScene: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill
    style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: 32, pointerEvents: 'none'}}
  >
    <div style={{fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 24, opacity: 0.32, color: C.text}}>
      {id} · 占位（未实现）
    </div>
  </AbsoluteFill>
);

/**
 * 镜间交叉淡入淡出：出镜在 tail 里淡出，入镜的 lead 在下方升起 ——
 * 运动由各镜自己的相机路径承接（本片是连续的缓推，没有鞭甩），这一层只混像素。
 */
const ShotFade: React.FC<{
  lead: number;
  tail: number;
  narrationFrames: number;
  /** 首镜关掉淡入：第 0 帧必须已经是完整画面（抖音拿它当封面）。 */
  fadeIn?: boolean;
  children: React.ReactNode;
}> = ({lead, tail, narrationFrames, fadeIn = true, children}) => {
  const frame = useCurrentFrame();
  const total = lead + narrationFrames + tail;

  let opacity = 1;
  if (fadeIn && lead > 0) {
    opacity = interpolate(frame, [0, lead], [0, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    });
  }
  if (tail > 0) {
    opacity *= interpolate(frame, [total - tail, total], [1, 0], {
      extrapolateLeft: 'clamp',
      easing: Easing.inOut(Easing.quad),
    });
  }

  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

export const MainVideo: React.FC = () => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {/* L0 幕底：全屏镜被人物层盖住；缩位/圆章期它是画面的底 */}
      <Backdrop />
      <Audio src={staticFile('narration.wav')} />
      {/* 音效层（10-10 新增）：cue 表在 src/sfx.ts —— 点位全部锚在**画面动作**上
          （卡片上屏 / 数字落地 / 线落下 / 划掉 / 标签弹出 / 镜切），不是按拍子铺。
          音量按引擎规范「比人声低约 12dB」定，同帧最多一条。采样在 public/sfx/
          （Mixkit Sound Effects Free License，免署名可商用）。 */}
      {CUES.map((c, i) => {
        const from = Math.round(c.t * fps);
        if (from < 0) return null;
        return (
          <Sequence key={`sfx-${i}-${c.name}`} from={from}>
            <Audio
              src={staticFile(`sfx/${c.name}.mp3`)}
              volume={c.vol}
              playbackRate={c.rate ?? 1}
            />
          </Sequence>
        );
      })}
      {/* L1 全局人物层（10-09 改版）：全片**一条连续素材**、**固定位**，
          不再随镜头切分（旧版画在每镜里 → 切镜就闪、相机一推脸就跟着动）。
          开场 0→8.3s 全屏（钩子 + 自我介绍），中段收成右上角金框圆窗，
          收尾再展开回全屏（引流要露人）。

          10-10 修正（本条替换，非版式改动）：标准工程 expandAt=100.7，
          而它末镜 s19 起于 101.5s → 规则是「末镜起 - 0.8s」。
          本片正片 118.96s、末镜 s22 起于 117.52s，直接抄 99.6 会让 s19–s21
          三镜（截图卡 / 三步清单 / 30 天）全部落在全屏人像上、面板压脸。
          按同一条规则改为 116.72s。 */}
      <GlobalHost shrinkAt={8.3} shrinkDur={0.5} expandAt={116.72} expandDur={0.5} />
      {SHOTS.map((shot, i) => {
        const {from, duration} = shotSequence(shot, fps);
        const Scene = SCENES[shot.id]; // 未实现的镜头 → 占位（⑤-1）
        const narrationFrames = Math.round(shot.durationSec * fps);
        return (
          <Sequence key={shot.id} from={from} durationInFrames={duration}>
            {/* ⚠️ 镜内时钟必须在**镜头组件外面**也提供一次。
                原因：kit 的 ShotClock 只把 ClockCtx 给自己的 children，而镜头组件
                （S1/S9/S12/S19）是在自己的函数体里调 useShotTime() 的 —— 那层读不到
                Frame 内部的 provider，只会拿到 createContext(0) 的默认值 0，
                于是 tw(0, at, d) 恒为 0：s1 顶带不淡出、s9 红框不出现、
                s12 打码条不变亮、s19「截图保存」药丸整块不可见（10-11 实测复现）。
                这里按同一套公式补一层 provider，内层 Frame 再套一层同值 provider，无副作用。 */}
            <ShotClock lead={shot.lead}>
              <ShotFade
                lead={shot.lead}
                tail={shot.tail}
                narrationFrames={narrationFrames}
                fadeIn={i > 0}
              >
                {Scene ? <Scene /> : <PlaceholderScene id={shot.id} />}
              </ShotFade>
            </ShotClock>
          </Sequence>
        );
      })}
      {/* L6 环境层与字幕在所有镜头之上，屏幕空间 */}
      <Overlays />
      <Environment />
      {/* 字幕带抬到 y≈1409–1500：一是贴回账号定稿的字幕位（y1414），
          二是竖屏底带要留给抖音的视频描述和播放控件，字幕不许再往下压。
          keywords 只给「点个关注」——keyword-pop 全片上限 3 次（design-language §5），
          像「播放量」这种全片出现 8 次以上的词会直接超限报错。 */}
      <Subtitles bottom={430} maxWidth="90%" keywords={['点个关注']} accent={C.gold} />
    </AbsoluteFill>
  );
};
