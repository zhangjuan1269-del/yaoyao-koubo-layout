/**
 * 本片主题 token —— 按「瑶瑶妈说」账号既有视觉（深墨绿 + 金 + 米白）派生。
 * 来源：用户自有版式（koubo-auto-edit 定稿：底色 #13291F / 金 #E8B44C / 米白 #F7F2E7）。
 * design-language §0：用户明确点了风格就按用户的来——整套 token 替换。
 */
export const C = {
  bg: '#13291F', // 深墨绿
  bgDeep: '#0B1A13', // 更深的墨绿，用于暗角/分层
  gold: '#E8B44C',
  goldSoft: 'rgba(232, 180, 76, 0.55)',
  cream: '#F7F2E7', // 米白
  text: '#F7F2E7',
  dim: 'rgba(247, 242, 231, 0.62)',
  line: 'rgba(232, 180, 76, 0.22)',
  panel: 'rgba(11, 26, 19, 0.82)',
};

/**
 * 顶带落位（全屏镜的上屏文字）。
 *
 * 为什么不是 96：竖屏发到抖音时，**顶部那条是状态栏 + 顶部标签栏**，
 * 常驻文字放在 96 会被整块盖掉（用户 2026-10-09：「顶部的字幕太靠上了，
 * 可以适当往下面来一点，要不然容易被切出去」）。
 * 为什么是 300 而不是更下：全屏镜里她的头顶实测在 y 575–650（从成片抽帧量的），
 * 300 起、单行金底约 113 高 → 底 413，离头顶还有 160–240px，
 * 既不进顶部危险区，也不会贴到脸上。
 * 圆窗（chipTop=96）与顶带**从不同框**（让台镜的眉标在面板里），所以不用一起下移。
 */
export const BAND_TOP = 300;

/**
 * 让台镜（圆章/让台）里「中间动效图」的落位上边。
 *
 * 为什么不是 440：第 8 轮用户看片反馈——中间的动效图（s11 趋势 / s12 分叉 /
 * s13 阈值尺 / s14 时长条 / s17 数据卡 / s18 转发图）都「太靠上面了」，要往
 * 正中间来一点、适当往下面调。
 * 440 时面板中心约在 630–777（按各镜面板高算），离真·垂直中心 960 还远。
 * 改成 580：面板中心落到 ~760–860 这一段（靠上界的短面板 s18 约 736、
 * 最高的 s12 约 862），明显下移、更接近中心，又都压在字幕带顶（~1335，
 * 含 s17 金底「截图保存」角标的投影）之上，不与字幕打架。
 * 顶带（BAND_TOP=300）是另一套逻辑，不动。
 */
export const CHIP_PANEL_TOP = 580;

/**
 * 中段内容区（10-10 改版：人物钉右上角之后的版式地基）。
 *
 * 为什么要有这两个数：人物从「每镜各自全屏/让台」改成「全片钉在右上角圆窗」之后，
 * 画面里**多出一整块 y≈420–1380 的空区** —— 旧版这块是被人物全屏占着的。
 * 旧版各镜把图形挤在顶带（BAND_TOP=300）或只做一张小卡居中，是为了躲人脸；
 * 现在没有全屏人脸要躲，约束反过来了：
 *
 *   · 圆窗区 = x 696–984 / y 96–384 —— **永久保留**，任何图形不许进来
 *     （顶带居中件只要宽过 312px 就会撞上圆窗，这就是用户 10-10 说的「把人脸挡住」）；
 *   · 中段内容区 = x 96–984 / y CONTENT_TOP–CONTENT_BOTTOM，所有中段图形进这里，
 *     并且**要铺满** —— 空着就是用户说的「中间养鱼」；
 *   · 字幕带 y 1409 起，不碰。
 *
 * CONTENT_TOP = 384（圆窗下缘）+ 56 边距。
 * CONTENT_BOTTOM = 1409（字幕带顶）- 49 边距。
 */
export const CONTENT_TOP = 440;
export const CONTENT_BOTTOM = 1360;
/** 中段内容区宽度（左右各留 96 action-safe）。 */
export const CONTENT_W = 888;

export const FONT = {
  cn: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  mono: 'Menlo, "SF Mono", monospace',
};

export const gridBg: React.CSSProperties = {
  backgroundColor: C.bg,
  backgroundImage:
    `linear-gradient(${C.line} 1px, transparent 1px),` +
    `linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
  backgroundSize: '72px 72px',
};

/** 幕底 token（design-language §1.1）：本片统一深墨绿系，不换幕底。 */
export const bg = {light: 'pastel-mesh-flow', dark: 'mesh-flow-dark'} as const;
