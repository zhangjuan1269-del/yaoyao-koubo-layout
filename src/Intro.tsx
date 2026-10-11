import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, FONT} from './theme';

/**
 * 「瑶瑶妈说」片头 —— 3 秒（90 帧 @30fps，1080×1920）。
 *
 * 复用本片品牌 token（深墨绿 + 金 + 米白），不动 MainVideo。
 * 结构：墨绿底 + 极淡金格线 → 「瑶瑶妈说」逐字升起 → 金线展开 → 末尾淡出。
 * 单独渲染成 mp4，再用 ffmpeg 拼到正片前面（见交付说明）。
 */

const TITLE = '瑶瑶妈说';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // 底 / 格线淡入
  const bgIn = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 末尾 12 帧整体淡出
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 金线展开
  const lineP = spring({
    frame: frame - 34,
    fps,
    config: {damping: 200},
    durationInFrames: 26,
  });

  // 底部小字
  const subP = interpolate(frame, [44, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: C.bg, fontFamily: FONT.cn, opacity: out}}>
      {/* 极淡金格线 */}
      <AbsoluteFill
        style={{
          opacity: bgIn * 0.5,
          backgroundImage:
            `linear-gradient(${C.line} 1px, transparent 1px),` +
            `linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />
      {/* 暗角 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 44%, transparent 38%, ${C.bgDeep} 100%)`,
        }}
      />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        {/* 标题：逐字升起 */}
        <div style={{display: 'flex', gap: 16}}>
          {TITLE.split('').map((ch, i) => {
            const p = spring({
              frame: frame - (10 + i * 4),
              fps,
              config: {damping: 200},
              durationInFrames: 24,
            });
            return (
              <span
                key={i}
                style={{
                  fontSize: 150,
                  fontWeight: 700,
                  color: C.cream,
                  letterSpacing: 4,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 48}px)`,
                  textShadow: `0 0 30px ${C.goldSoft}`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* 金线 */}
        <div
          style={{
            marginTop: 42,
            height: 3,
            backgroundColor: C.gold,
            width: interpolate(lineP, [0, 1], [0, 420]),
            borderRadius: 2,
            boxShadow: `0 0 20px ${C.goldSoft}`,
          }}
        />

        {/* 底部小字 */}
        <div
          style={{
            marginTop: 34,
            fontSize: 34,
            letterSpacing: 10,
            color: C.dim,
            opacity: subP,
          }}
        >
          每天跑通一个点
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
