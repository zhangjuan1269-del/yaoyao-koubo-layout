import type React from 'react';
import {STORYBOARD} from '../storyboard';
import {buildScenes} from '../scene-from-config';

/**
 * 由 `storyboard.ts` 配置生成的 22 镜。
 *
 * 与 `./SopScenes`（手写版）功能等价，用于验证配置化后画面一致；
 * 验证通过后，`./index.tsx` 改为从这里导出，新视频就只需改配置表。
 */
export const SCENES: Record<string, React.FC> = buildScenes(STORYBOARD);
