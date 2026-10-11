import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Environment as EnvLayer} from './env';

/**
 * 拆解契约：幕底画布（Environment，画在所有镜头之下）与幕级覆盖（Overlays，画在镜头之上、字幕之下）。
 * 本片复用 env.tsx 的实现（单一深墨绿幕，无幕级覆盖）。
 */
export const Environment: React.FC = () => <EnvLayer vignette={0.16} />;

export const Overlays: React.FC = () => <AbsoluteFill style={{pointerEvents: 'none'}} />;
