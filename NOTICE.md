# 第三方许可声明 / Third-party notices

本仓库自身沿用 **PolyForm Noncommercial License 1.0.0**（见 `LICENSE`）。
原因：本仓库是 **video-talkcraft** 的版式扩展层，其中部分文件派生自该项目的模板。
把本仓库的文件复制进成片工程时，请把本文件一并带上。

- **video-talkcraft** — <https://github.com/Vincentwei1021/video-talkcraft>
  Copyright (c) 2026 Vincent Wei · PolyForm Noncommercial 1.0.0

---

## 一、派生自 video-talkcraft 的文件

下列文件基于 video-talkcraft `template/motion-systems/` 下的同名文件修改而来，
**版权与许可声明随副本保留**，许可仍为 PolyForm Noncommercial 1.0.0：

| 本仓库文件 | 来源 |
|---|---|
| `src/theme.ts` | `template/motion-systems/theme.ts`（改为本片品牌 token）|
| `src/shots.ts` | `template/motion-systems/shots.ts`（改为表驱动）|
| `src/Subtitles.tsx` | `template/motion-systems/Subtitles.tsx` |

---

## 二、本仓库原创的文件

下列文件为本仓库原创，随本仓库一并按 PolyForm Noncommercial 1.0.0 分发：

```
src/kit.tsx
src/blocks.tsx
src/scene-from-config.tsx
src/MainVideo.tsx
src/MainVideoConfig.tsx
src/Root.tsx
src/Intro.tsx
src/Environment.tsx
src/sfx.ts
src/entry.ts
src/storyboard.ts
src/scenes/index.tsx
src/scenes/config-scenes.tsx
docs/03_组件选型表.md
docs/06_填表说明.md
```

---

## 三、未随本仓库分发、但运行必需的文件

以下文件由 video-talkcraft 提供，本仓库**不重复分发**，请从引擎安装：

```
backdrop.tsx        camera.tsx          life.tsx
longtake.tsx        schematic.tsx       transitions.tsx
ui.tsx              Counter.tsx         env.tsx
hooks.ts            icons.ts            params.ts
time.ts             timing.ts           anime-remotion.ts
three-anime.ts      Subtitles.tsx（原版）
```

---

## 四、产出的视频

用本模板产出的视频**归创作者自己所有**。
但**产片过程**若属商业用途（含内容账号变现），仍需 video-talkcraft 作者的授权。
