import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BAND_TOP, C, FONT} from './theme';
import {NumberSlab, Panel, RiseLine, StepRow, StrikeLine, lerp, tw, useShotTime} from './kit';
import {tSay} from './timing';
import {
  CardPage,
  Chip,
  ChipRow,
  Frame,
  MediaBand,
  Monitor,
  Notice,
  PhotoFill,
  Pop,
  TallBand,
  TextBand,
  WordCell,
  ease,
} from './blocks';
import type {At, Block, Color, InnerPart, MonitorInner, ShotConfig} from './storyboard';

/**
 * 配置 → 镜头 的渲染器。
 *
 * 本文件是固定不变量：新视频**不改这里**，只改 `storyboard.ts`。
 * 所有画面件的实现都在 `blocks.tsx`（与已验收的 SopScenes.tsx 逐字一致）。
 */

/** 时间锚点解析：数字=镜内秒；字符串=原话子串；[子串, 偏移]=子串时刻+偏移。 */
export const atv = (id: string, a: At): number =>
  typeof a === 'number' ? a : typeof a === 'string' ? tSay(id, a) : tSay(id, a[0]) + a[1];

const col = (c?: Color): string =>
  c === 'gold' ? C.gold : c === 'dim' ? C.dim : c === 'bg' ? C.bg : c === 'text' ? C.text : C.cream;

/* ---------------- 设备框内部 ---------------- */

const InnerView: React.FC<{id: string; inner: MonitorInner}> = ({id, inner}) => {
  const t = useShotTime();
  if (inner.t === 'text') {
    return (
      <span style={{fontSize: inner.size ?? 32, color: col(inner.color ?? 'dim'), fontFamily: FONT.cn}}>
        {inner.text}
      </span>
    );
  }
  const maskP = inner.maskAt === undefined ? 1 : tw(t, atv(id, inner.maskAt), 0.4, ease);
  const part = (p: InnerPart, i: number) => {
    if ('bar' in p) {
      if (p.kind === 'mask') {
        return (
          <span
            key={i}
            style={{
              width: p.bar,
              height: 56,
              borderRadius: 8,
              background:
                'repeating-linear-gradient(90deg, rgba(247,242,231,0.42) 0 12px, rgba(247,242,231,0.10) 12px 24px)',
              filter: 'blur(2px)',
              opacity: 0.35 + 0.65 * maskP,
            }}
          />
        );
      }
      return (
        <span
          key={i}
          style={{width: p.bar, height: 12, background: 'rgba(247,242,231,0.5)', borderRadius: 6}}
        />
      );
    }
    return (
      <span
        key={i}
        style={{
          fontSize: p.size,
          color: col(p.color),
          fontFamily: FONT.cn,
          fontWeight: p.weight,
        }}
      >
        {p.text}
      </span>
    );
  };
  return (
    <div style={{display: 'flex', gap: inner.gap ?? 18, alignItems: 'center'}}>
      {inner.parts.map(part)}
    </div>
  );
};

/* ---------------- 单个画面件 ---------------- */

const BlockView: React.FC<{id: string; b: Block}> = ({id, b}) => {
  const t = useShotTime();
  switch (b.t) {
    case 'rise':
      return (
        <RiseLine text={b.text} startAt={atv(id, b.at)} fontSize={b.size} color={col(b.color)} />
      );

    case 'chips':
      return (
        <ChipRow at={atv(id, b.at)} items={b.items} gold={b.gold ?? -1} size={b.size ?? 36} />
      );

    case 'inline':
      return (
        <div style={{display: 'flex', gap: b.gap ?? 18, alignItems: 'center'}}>
          {b.parts.map((p, i) => (
            <span
              key={i}
              style={{
                fontSize: p.size,
                color: col(p.color),
                fontFamily: FONT.cn,
                fontWeight: p.weight,
              }}
            >
              {p.text}
            </span>
          ))}
        </div>
      );

    case 'notice':
      return <Notice at={atv(id, b.at)} title={b.title} body={b.body} stamp={b.stamp} />;

    case 'monitor':
      return (
        <Monitor
          at={atv(id, b.at)}
          title={b.title}
          w={b.w}
          screenH={b.screenH}
          glow={b.glow}
          badge={b.badge}
          badgeTone={b.badgeTone}
        >
          <InnerView id={id} inner={b.inner} />
        </Monitor>
      );

    case 'rowsbox':
      return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 30, width: '100%'}}>
          {b.rows.map((r) => (
            <div
              key={r.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                borderRadius: 16,
                background: r.accent ? 'rgba(232,180,76,0.10)' : 'rgba(232,180,76,0.06)',
                border: `1.5px solid rgba(232,180,76,${r.accent ? 0.46 : 0.28})`,
                padding: '26px 30px',
              }}
            >
              <span
                style={{
                  fontSize: 34,
                  color: C.dim,
                  fontFamily: FONT.cn,
                  width: 170,
                  textAlign: 'right',
                }}
              >
                {r.label}
              </span>
              <span
                style={{
                  fontSize: 44,
                  color: r.accent ? C.gold : C.cream,
                  fontFamily: FONT.cn,
                  fontWeight: r.accent ? 700 : undefined,
                }}
              >
                {r.text}
              </span>
            </div>
          ))}
        </div>
      );

    case 'rowlist':
      return (
        <div style={{display: 'flex', flexDirection: 'column', gap: b.gap ?? 22, width: '100%'}}>
          {b.rows.map((r, i) => (
            <Pop
              key={r.label}
              at={atv(id, b.at) + 0.2 + i * (b.stagger ?? 0.24)}
              dy={14}
              style={{width: '100%'}}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  borderRadius: 14,
                  background: 'rgba(232,180,76,0.06)',
                  border: '1.5px solid rgba(232,180,76,0.28)',
                  padding: '18px 28px',
                }}
              >
                <span style={{fontSize: 34, color: C.gold, fontFamily: FONT.cn, width: 100}}>
                  {r.label}
                </span>
                <span style={{fontSize: 46, color: C.cream, fontFamily: FONT.cn}}>{r.text}</span>
              </div>
            </Pop>
          ))}
        </div>
      );

    case 'flow': {
      const node = (
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <Chip text={b.a} size={44} />
          <span style={{fontSize: 60, color: C.gold, fontFamily: FONT.cn}}>→</span>
          <Chip text={b.b} gold size={44} />
        </div>
      );
      return b.at === undefined ? node : <Pop at={atv(id, b.at)}>{node}</Pop>;
    }

    case 'stat': {
      const node = (
        <div
          style={{
            width: '100%',
            borderRadius: 18,
            background: 'rgba(232,180,76,0.06)',
            border: '1.5px solid rgba(232,180,76,0.28)',
            padding: '34px 40px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 26,
          }}
        >
          <span style={{fontSize: 36, color: C.dim, fontFamily: FONT.cn}}>{b.label}</span>
          <span style={{fontSize: 64, fontWeight: 700, color: C.dim, fontFamily: FONT.cn}}>
            {b.value}
          </span>
          {b.arrow ? (
            <span style={{fontSize: 48, color: C.gold, fontFamily: FONT.cn}}>{b.arrow}</span>
          ) : null}
        </div>
      );
      return b.at === undefined ? node : <Pop at={atv(id, b.at)}>{node}</Pop>;
    }

    case 'wordgrid': {
      const items = b.items.map((w) => (typeof w === 'string' ? {text: w, anchor: w} : w));
      const h = b.h ?? 150;
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: b.gap ?? '24px 34px',
            width: '100%',
          }}
        >
          {items.map((w) => (
            <WordCell key={w.text} id={id} text={w.text} anchor={w.anchor} size={b.size ?? 60} h={h} />
          ))}
          {b.tail ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: h,
                borderRadius: 18,
                border: '1.5px dashed rgba(232,180,76,0.30)',
                color: C.gold,
                fontSize: 42,
                fontFamily: FONT.cn,
              }}
            >
              {b.tail}
            </div>
          ) : null}
        </div>
      );
    }

    case 'steps':
      return (
        <div style={{display: 'flex', flexDirection: 'column', gap: b.gap ?? 30, width: '100%'}}>
          {b.items.map((it, i) => {
            const obj = typeof it === 'string' ? null : it;
            const text = obj ? obj.text : (it as string);
            const at = obj ? atv(id, obj.at) : atv(id, b.at) + 0.2 + i * (b.stagger ?? 0.3);
            return <StepRow key={text} n={i + 1} text={text} at={at} accent={b.accent === i} />;
          })}
        </div>
      );

    case 'cardlist':
      return (
        <div
          style={{
            width: '100%',
            borderRadius: 18,
            background: 'rgba(11,26,19,0.94)',
            border: '2px solid rgba(232,180,76,0.34)',
            padding: '30px 36px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          <span style={{fontSize: 32, color: C.gold, fontFamily: FONT.cn}}>{b.title}</span>
          {b.lines.map((line, i) => (
            <Pop
              key={line}
              at={atv(id, b.at) + 0.5 + i * (b.stagger ?? 0.22)}
              dy={10}
              style={{width: '100%'}}
            >
              <span style={{fontSize: 40, color: C.cream, fontFamily: FONT.cn}}>{line}</span>
            </Pop>
          ))}
        </div>
      );

    case 'textbox':
      return (
        <div
          style={{
            width: '100%',
            borderRadius: 18,
            background: 'rgba(232,180,76,0.05)',
            border: '1.5px solid rgba(232,180,76,0.26)',
            padding: '34px 40px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            alignItems: 'flex-start',
          }}
        >
          <span style={{fontSize: 30, color: C.dim, fontFamily: FONT.cn}}>{b.title}</span>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap'}}>
            <span style={{fontSize: 48, color: C.cream, fontFamily: FONT.cn}}>{b.line}</span>
            <span style={{fontSize: 60, color: C.gold, fontFamily: FONT.cn, fontWeight: 700}}>
              {b.mark}
            </span>
          </div>
          <span style={{fontSize: 32, color: C.dim, fontFamily: FONT.cn}}>{b.note}</span>
        </div>
      );

    case 'sentence': {
      const markP = tw(t, atv(id, b.markAt), 0.34, ease);
      return (
        <div
          style={{
            width: '100%',
            borderRadius: 18,
            background: 'rgba(232,180,76,0.05)',
            border: '1.5px solid rgba(232,180,76,0.26)',
            padding: '46px 40px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 56,
            fontFamily: FONT.cn,
            color: C.cream,
            flexWrap: 'wrap',
          }}
        >
          {b.parts.map((p, i) =>
            i === b.mark ? (
              <span key={i} style={{position: 'relative', padding: '2px 10px'}}>
                <span style={{color: markP > 0.4 ? '#F08A7E' : C.cream}}>{p}</span>
                <span
                  style={{
                    position: 'absolute',
                    inset: -8,
                    borderRadius: 10,
                    border: '3px solid rgba(196,66,54,0.9)',
                    opacity: markP,
                    transform: `scale(${lerp(1.3, 1, markP)})`,
                  }}
                />
              </span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </div>
      );
    }

    case 'strike':
      return (
        <StrikeLine
          text={b.text}
          at={atv(id, b.at)}
          strikeAt={atv(id, b.strikeAt)}
          fontSize={b.size}
        />
      );

    case 'checks':
      return (
        <>
          <span
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: C.cream,
              fontFamily: FONT.cn,
              alignSelf: 'flex-start',
            }}
          >
            {b.title}
          </span>
          {b.items.map((r, i) => (
            <Pop
              key={r.tag}
              at={atv(id, b.at) + 0.4 + i * (b.stagger ?? 0.28)}
              dy={12}
              style={{width: '100%'}}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 30,
                    fontWeight: 700,
                    fontFamily: FONT.cn,
                    background: r.ok ? 'rgba(232,180,76,0.16)' : 'rgba(196,66,54,0.9)',
                    color: r.ok ? C.gold : '#FFE7E2',
                  }}
                >
                  {r.ok ? '✓' : '×'}
                </span>
                <span style={{fontSize: 40, color: C.cream, fontFamily: FONT.cn}}>{r.tag}</span>
                <span style={{marginLeft: 'auto', fontSize: 32, color: C.dim, fontFamily: FONT.cn}}>
                  {r.ok ? '通过' : '有问题'}
                </span>
              </div>
            </Pop>
          ))}
        </>
      );

    case 'number':
      return (
        <NumberSlab
          text={b.text}
          at={atv(id, b.at)}
          fontSize={b.size}
          unit={b.unit}
          unitSize={b.unitSize}
        />
      );

    case 'bigword':
      return (
        <span
          style={{
            fontSize: b.size,
            fontWeight: 700,
            color: col(b.color),
            fontFamily: FONT.cn,
            lineHeight: 1,
          }}
        >
          {b.text}
        </span>
      );

    case 'photo':
      return <PhotoFill src={b.src} caption={b.caption} />;

    case 'group':
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: b.gap ?? 20,
            alignItems: b.align ?? 'center',
          }}
        >
          {b.blocks.map((x, i) => (
            <BlockView key={i} id={id} b={x} />
          ))}
        </div>
      );
  }
};

/* ---------------- 镜头组装 ---------------- */

const buildScene = (cfg: ShotConfig): React.FC => {
  const Scene: React.FC = () => {
    const t = useShotTime();
    const id = cfg.id;

    switch (cfg.layout) {
      case 'hook': {
        const bandAt = cfg.band ? atv(id, cfg.band.at) : 0;
        const bandOut = cfg.band?.outAt === undefined ? 1 : 1 - tw(t, cfg.band.outAt, 0.3, ease);
        return (
          <Frame id={id}>
            {cfg.band && bandOut > 0 ? (
              <AbsoluteFill
                style={{
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  pointerEvents: 'none',
                  opacity: bandOut,
                }}
              >
                <Panel style={{marginTop: BAND_TOP}} pad="8px 32px" fadeAt={bandAt - 0.2}>
                  <RiseLine text={cfg.band.text} startAt={bandAt} fontSize={cfg.band.size} />
                </Panel>
              </AbsoluteFill>
            ) : null}
            {cfg.top ? (
              <TextBand at={atv(id, cfg.top.at)}>
                {cfg.top.blocks.map((b, i) => (
                  <BlockView key={i} id={id} b={b} />
                ))}
              </TextBand>
            ) : null}
            {cfg.media ? (
              <MediaBand at={atv(id, cfg.media.at)} gap={cfg.media.gap} pad={cfg.media.pad}>
                {cfg.media.blocks.map((b, i) => (
                  <BlockView key={i} id={id} b={b} />
                ))}
              </MediaBand>
            ) : null}
          </Frame>
        );
      }

      case 'cta':
        return (
          <Frame id={id}>
            <AbsoluteFill
              style={{alignItems: 'center', justifyContent: 'flex-start', pointerEvents: 'none'}}
            >
              <Panel
                style={{
                  marginTop: BAND_TOP,
                  background: C.gold,
                  border: '2px solid rgba(19,41,31,0.28)',
                  boxShadow: '0 18px 48px rgba(0,0,0,0.42)',
                }}
                pad="14px 46px"
                fadeAt={atv(id, cfg.band!.at) - 0.2}
              >
                <RiseLine
                  text={cfg.band!.text}
                  startAt={atv(id, cfg.band!.at)}
                  fontSize={cfg.band!.size}
                  color={C.bg}
                />
              </Panel>
            </AbsoluteFill>
          </Frame>
        );

      case 'band':
        return (
          <Frame id={id}>
            {cfg.top ? (
              <TextBand at={atv(id, cfg.top.at)}>
                {cfg.top.blocks.map((b, i) => (
                  <BlockView key={i} id={id} b={b} />
                ))}
              </TextBand>
            ) : null}
            {cfg.media ? (
              <MediaBand at={atv(id, cfg.media.at)} gap={cfg.media.gap} pad={cfg.media.pad}>
                {cfg.media.blocks.map((b, i) => (
                  <BlockView key={i} id={id} b={b} />
                ))}
              </MediaBand>
            ) : null}
          </Frame>
        );

      case 'tall':
        return (
          <Frame id={id}>
            <TallBand at={atv(id, cfg.at!)} pad={cfg.pad}>
              {cfg.body!.map((b, i) => (
                <BlockView key={i} id={id} b={b} />
              ))}
            </TallBand>
          </Frame>
        );

      case 'fullcard': {
        const pillAt = cfg.pill ? atv(id, cfg.pill.at) : 0;
        const pill = cfg.pill ? tw(t, pillAt, 0.35, ease) : 0;
        return (
          <Frame id={id}>
            {cfg.pages!.map((p) => (
              <CardPage
                key={p.src}
                src={p.src}
                at={atv(id, p.at)}
                outAt={p.outAt === undefined ? undefined : atv(id, p.outAt)}
                dir={p.dir}
              />
            ))}
            {cfg.pill ? (
              <AbsoluteFill
                style={{
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: cfg.pill.bottom ?? 150,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    background: C.gold,
                    borderRadius: 16,
                    padding: '14px 40px',
                    opacity: pill,
                    transform: `translateY(${lerp(18, 0, pill)}px)`,
                  }}
                >
                  <RiseLine
                    text={cfg.pill.text}
                    startAt={pillAt}
                    fontSize={cfg.pill.size}
                    color={C.bg}
                  />
                </div>
              </AbsoluteFill>
            ) : null}
          </Frame>
        );
      }
    }
  };
  return Scene;
};

export const buildScenes = (config: ShotConfig[]): Record<string, React.FC> =>
  Object.fromEntries(config.map((c) => [c.id, buildScene(c)]));
