/**
 * src/features/simulation/engine.ts — PrebakedEngine: מהלך על עץ-סימולציה מחובר-מראש.
 *
 * מימוש `SimulationEngine` לשלב-1 (hybrid · פרה-בנוי · ADR-016). טהור — אפס-רשת,
 * אפס-AI-runtime: מהלך על התורים לפי-סדר, מחזיר משוב+ניקוד פר-בחירה, ובסיום מחשב
 * ציון 0-100 + חולשות + פירוק-פר-שלב. ה-UI צורך את אותו חוזה גם ל-LiveEngine העתידי.
 */
import type {
  Simulation,
  SimTurn,
  SimOption,
  SimResponse,
  SimResult,
  SimulationEngine,
  SimStage,
  Inspector,
} from './types';

/** תווית-תצוגה פר-מפקח (לשיח + לדו"ח-החולשות). */
export const INSPECTOR_LABELS: Record<Inspector, string> = {
  technical: 'מפקח טכני',
  hygiene: 'מפקח גיהותי',
  regulatory: 'מפקח רגולטורי',
};

interface AnsweredTurn {
  stageKey: string;
  stageTitle: string;
  turn: SimTurn;
  option: SimOption;
}

export class PrebakedEngine implements SimulationEngine {
  private readonly seq: { stage: SimStage; turn: SimTurn }[];
  private cursor = 0;
  private readonly answered: AnsweredTurn[] = [];

  constructor(sim: Simulation) {
    this.seq = sim.stages.flatMap((stage) => stage.turns.map((turn) => ({ stage, turn })));
  }

  start(): SimTurn {
    this.cursor = 0;
    this.answered.length = 0;
    const first = this.seq[0];
    if (!first) throw new Error('simulation has no turns');
    return first.turn;
  }

  respond(turnId: string, optionIndex: number): SimResponse {
    const cur = this.seq[this.cursor];
    if (!cur) throw new Error('simulation already finished');
    if (cur.turn.id !== turnId) {
      throw new Error(`turn mismatch: expected ${cur.turn.id}, got ${turnId}`);
    }
    const option = cur.turn.options[optionIndex];
    if (!option) throw new Error(`invalid optionIndex ${optionIndex} for turn ${turnId}`);

    this.answered.push({
      stageKey: cur.stage.key,
      stageTitle: cur.stage.title,
      turn: cur.turn,
      option,
    });
    this.cursor += 1;
    const next = this.seq[this.cursor];
    return {
      feedback: option.feedback,
      citation: option.citation,
      pointsAwarded: option.points,
      nextTurn: next ? next.turn : null,
      done: !next,
    };
  }

  result(): SimResult {
    const maxOf = (t: SimTurn): number =>
      t.options.length > 0 ? Math.max(...t.options.map((o) => o.points)) : 0;
    const earned = this.answered.reduce((s, a) => s + a.option.points, 0);
    const max = this.answered.reduce((s, a) => s + maxOf(a.turn), 0);
    const score = max > 0 ? Math.round((earned / max) * 100) : 0;

    const weaknesses = this.answered
      .filter((a) => a.option.quality !== 'good')
      .map((a) => `${a.stageTitle} · ${INSPECTOR_LABELS[a.turn.inspector]}: ${a.option.feedback}`);

    // פירוק פר-שלב (label = כותרת-השלב · משקף את התקדמות-המועמד בכל מקטע).
    const byStage = new Map<string, { earned: number; max: number; title: string }>();
    for (const a of this.answered) {
      const e = byStage.get(a.stageKey) ?? { earned: 0, max: 0, title: a.stageTitle };
      e.earned += a.option.points;
      e.max += maxOf(a.turn);
      byStage.set(a.stageKey, e);
    }
    const perCriterion = [...byStage.values()].map((s) => ({
      name: s.title,
      score: s.max > 0 ? Math.round((s.earned / s.max) * 100) : 0,
    }));

    return { score, weaknesses, perCriterion };
  }
}
