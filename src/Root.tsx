import React from 'react';
import {Composition} from 'remotion';
import {MainVideo} from './MainVideo';
import {MainVideoConfig} from './MainVideoConfig';
import {Intro} from './Intro';
import {timing} from './timing';

/** 画幅必须写数字字面量（写变量会按默认 1920×1080 并在工作台 npm run gen 时告警）。 */
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

/** 成片时长 = 口播总时长（末镜的 tail 被自然裁掉，与 shots.json 末镜 end 同源）。 */
const totalFrames = Math.round(timing.totalSec * FPS);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MainVideo"
      component={MainVideo}
      durationInFrames={totalFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="Intro"
      component={Intro}
      durationInFrames={90}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    {/* 配置化版：与 MainVideo 同一套版式与时间轴，唯一区别是 22 镜由
        storyboard.ts 配置生成。用于逐帧对照验证；验证通过后 MainVideo 直接切过来。 */}
    <Composition
      id="MainVideoConfig"
      component={MainVideoConfig}
      durationInFrames={totalFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);
