import { resolveRouteRequest, planSurfaceRoute } from './navigation.js';

const clone = value => value == null ? value : structuredClone(value);

// Authored teaching thresholds. They are intentionally centralized and conservative.
export const ASTRA_MONITOR_THRESHOLDS = Object.freeze({
  returnFloorMinutes: 20, warningWithinMinutes: 10, habitatCautionPercent: 55,
  powerWarningKwh: 8, fatigueCautionPercent: 70, radiationShelterRate: 1
});

function missionSnapshot(m) {
  const s = m.state, expedition = s.expedition;
  return clone({ destination: m.config.world, stage: expedition?.stage ?? m.objectiveIndex?.(), phase: s.phase,
    status: s.status, suit: { oxygenMinutes: s.oxygen, waterLitres: s.water, batteryWh: s.suitWh },
    habitat: expedition?.outpost ? { ...expedition.outpost } : null,
    resources: expedition?.outpost ? { ...expedition.outpost } : { oxygen: s.oxygen, water: s.water, batteryWh: s.suitWh },
    fatigue: expedition?.outpost?.fatigue ?? s.fatigue, elapsedSeconds: s.time,
    objectives: { next: m.nextAction?.() ?? null, target: m.target?.() ?? null, stage: expedition?.stage ?? null },
    returnMargin: m.lifeline?.() ?? null,
    player: s.player, rover: s.rover, route: m.route, scans: s.scans });
}

const tools = {
  getMissionState: { name: 'getMissionState', kind: 'read', run: (ctx, { question } = {}) => ({ ...missionSnapshot(ctx.mission), answer: question ? ctx.mission.astra(question) : null }) },
  previewDecision: { name: 'previewDecision', kind: 'preview', run: (ctx, { id } = {}) => {
    const m = ctx.mission, option = m.stage?.options?.find(x => x.id === id);
    return option && m.preview ? clone(m.preview(option)) : null;
  }},
  estimateRoute: { name: 'estimateRoute', kind: 'preview', run: (ctx, { target } = {}) => {
    const request = typeof target === 'string' ? resolveRouteRequest(ctx.mission, target) : target;
    return request ? clone(planSurfaceRoute(ctx.mission, request)) : null;
  }},
  explainAssumption: { name: 'explainAssumption', kind: 'read', run: (ctx, { key } = {}) => {
    const values = { resourceModel: { value: ctx.mission.config.world, units: 'destination-specific model', provenance: 'authored assumption', dataKind: 'authored assumption' },
      ephemerides: { value: 'bundled samples', units: 'dated positions', provenance: 'cached JPL data', dataKind: 'cached data' } };
    return clone(values[key] || { value: null, units: null, provenance: 'authored assumption', dataKind: 'authored assumption' });
  }},
  highlightObjective: { name: 'highlightObjective', kind: 'ui', run: (ctx, { id } = {}) => ctx.ui?.highlightObjective?.(id) ?? false },
  openPanel: { name: 'openPanel', kind: 'ui', run: (ctx, { id } = {}) => ctx.ui?.openPanel?.(id) ?? false }
};

export const ASTRA_TOOLS = Object.freeze(Object.fromEntries(Object.entries(tools).map(([key, tool]) => [key, Object.freeze(tool)])));
export const ASTRA_TOOL_NAMES = Object.freeze(Object.keys(ASTRA_TOOLS));

export function runAstraTool(name, mission, args = {}, ui = null) {
  const tool = ASTRA_TOOLS[name];
  if (!tool) throw new Error(`ASTRA capability is not registered: ${name}`);
  return tool.run(Object.freeze({ mission, ui }), clone(args));
}

export function astraMonitor(mission, now = Date.now(), state = missionSnapshot(mission)) {
  const o = state.habitat, threshold = ASTRA_MONITOR_THRESHOLDS, advisories = [];
  const life = mission.lifeline?.();
  if (life && life.margin <= threshold.warningWithinMinutes) advisories.push({ id: 'return-margin', severity: 'warning', text: 'Return reserve is approaching its floor. Review your route home.' });
  else if (life && !life.safe) advisories.push({ id: 'return-margin', severity: 'warning', text: 'Return reserve is below the modeled floor. Review your route home.' });
  if (state.fatigue >= threshold.fatigueCautionPercent && !state.objectives?.next?.title?.toLowerCase().includes('begin')) advisories.push({ id: 'fatigue-eva', severity: 'caution', text: 'Crew fatigue is elevated before the next field task.' });
  if (o) {
    if (o.energy < threshold.powerWarningKwh || o.habitat < threshold.habitatCautionPercent) advisories.push({ id: 'habitat-trend', severity: o.energy < threshold.powerWarningKwh ? 'warning' : 'caution', text: 'Haven power or habitat margin is low. Review the current operating plan.' });
    if (o.radiationRate >= threshold.radiationShelterRate && o.shield === 'none') advisories.push({ id: 'radiation-shelter', severity: 'warning', text: 'Radiation training alert is active. Consider shelter options.' });
  }
  return advisories.map(item => ({ ...item, at: now }));
}

export function createAstraMonitor({ cooldownMs = 60000 } = {}) {
  const lastRaised = new Map();
  return Object.freeze({
    check(mission, now = Date.now(), { guidance = 'advisor', tutorials = true } = {}) {
      const ready = [];
      for (const item of astraMonitor(mission, now)) {
        if (guidance === 'quiet' && item.severity !== 'warning') continue;
        if (!tutorials && item.severity !== 'warning') continue;
        if (lastRaised.has(item.id) && now - lastRaised.get(item.id) < cooldownMs) continue;
        lastRaised.set(item.id, now); ready.push(item);
      }
      return ready;
    },
    clear() { lastRaised.clear(); }
  });
}

export function createAstraMissionView(mission) {
  // ASTRA receives cloned data and a small set of pure query methods only.
  const state=runAstraTool('getMissionState',mission);
  return Object.freeze({ config: clone(mission.config), state, scenario: clone(mission.scenario), lesson: clone(mission.lesson),
    isExpedition: !!mission.isExpedition, levelIndex: mission.levelIndex,
    astra: question => runAstraTool('getMissionState',mission,{question}).answer, nextAction: () => clone(state.objectives.next),
    lifeline: () => clone(state.returnMargin),
    target: () => clone(state.objectives.target),
    preview: option => clone(mission.preview?.(option)),
    stage: clone(mission.stage),
    terrain: Object.freeze({ cell: mission.terrain.cell, width: mission.terrain.width, height: mission.terrain.height,
      inBounds: (x,y) => mission.terrain.inBounds(x,y) }),
    objects: clone(mission.objects), science: clone(mission.science), route: clone(mission.route),
    returnMargin: () => clone(mission.lifeline?.())
  });
}
