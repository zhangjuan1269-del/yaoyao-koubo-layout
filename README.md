# yaoyao-koubo-layout · 竖屏口播「版式层」

把一条口播视频做成抖音竖屏动效成片的**版式层**：5 种版式 + 20 种画面件 + 表驱动分镜。
换新视频**只改一个文件**（`src/storyboard.ts`），版式、动效、混音参数全不动。

> ⚠️ 这不是一个能独立运行的工具。它是 **[video-talkcraft](https://github.com/Vincentwei1021/video-talkcraft) 的扩展层**，必须先装引擎。

---

## 一、它和 video-talkcraft 的分工

| 这块活 | 谁负责 |
|---|---|
| 配音 → 字级时间戳 → Remotion 渲染管线 | **video-talkcraft**（本仓库的依赖）|
| 通用动效卡库（110 张）、相机 / 幕底 / 字幕等通用件 | **video-talkcraft** 的 `template/` |
| **本仓库 = 上面那层「版式」** | 5 种版式 + 20 种画面件 + 表驱动分镜 |

所以本仓库里**只有增量**：不重复放 `backdrop.tsx` / `camera.tsx` / `time.ts` / `timing.ts` / `env.tsx` 这些引擎自带件（清单见 `NOTICE.md`）。

---

## 二、装什么

1. **video-talkcraft**（引擎，必须）
   <https://github.com/Vincentwei1021/video-talkcraft>
   装到非系统盘 / 用户目录。

2. **本仓库**（版式层）
   `git clone` 到任意位置。

---

## 三、怎么用

```bash
# 1. 用引擎的模板起一个工程（或拿任意已跑通的 video-talkcraft 工程）
#    工程里至少要有 remotion/ 目录

# 2. 把本仓库的 src/ 覆盖进工程的 remotion/src/
cp -r yaoyao-koubo-layout/src/*  <你的工程>/remotion/src/

# 3. 改 src/storyboard.ts —— 换成你这条片的内容（唯一的必改文件）
#    填表规则：docs/06_填表说明.md
#    选件规则：docs/03_组件选型表.md

# 4. 按 video-talkcraft 的流程走：
#    提音轨 → 字级时间戳 → 渲关键帧预览 → 渲染 → 混音 → 响度归一化
```

`src/storyboard.ts` 里已经放了一份 **7 镜示例**（演示 4 种版式 + 常见画面件），照着改就行。

---

## 四、5 种版式

| layout | 长什么样 | 什么时候用 |
|---|---|---|
| `hook` | 顶带 → 缩窗 → 落两段式 | 首镜钩子 |
| `band` | 上段文字卡 + 下段画面卡 | 最常用 |
| `tall` | 一张整高卡 | 步骤 / 清单 |
| `fullcard` | 整幅截图翻页 | 展示截图 / 设计稿 |
| `cta` | 金底顶带 | 收尾 |

20 种画面件（`rise` `chips` `inline` `notice` `monitor` `rowsbox` `rowlist` `flow` `stat` `wordgrid` `steps` `cardlist` `textbox` `sentence` `strike` `checks` `number` `bigword` `photo` `group`）见 `docs/03_组件选型表.md`。

---

## 五、三条最容易翻车的铁律

1. **锚点必须是口播稿原话的连续子串。**
   写成上屏的提炼语会**静默失效**——元素在第 0 帧就冒出来，而且**不报错**，只能盯着预览帧才发现。
2. **中间必须是真画面**（设备框 / 通知条 / 词表 / 步骤条 / 勾叉清单），不能是空面板。
3. **带秒数的参数每条重新推导**，别抄示例里的数值。

更多见 `docs/06_填表说明.md`。

---

## 六、许可

- 本仓库整体沿用 **PolyForm Noncommercial License 1.0.0**（见 `LICENSE`）——因为它包含 video-talkcraft 的派生文件。
- **个人非商业免费；商业用途（含内容账号变现）需先联系 video-talkcraft 作者 [@VincentWei93](https://github.com/Vincentwei1021) 取得授权。**
- 派生自 video-talkcraft 的文件清单见 `NOTICE.md`。
- 用本模板产出的**视频归创作者自己所有**。

---

## 七、免责

本仓库按「原样」提供，不附带任何担保。模板里的示例文案、配色、尺寸只是参考，请换成你自己的。
