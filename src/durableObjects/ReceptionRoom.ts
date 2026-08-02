// src/durableObjects/ReceptionRoom.ts
import { DurableObject } from 'cloudflare:workers';
import { ReceptionRoomState } from '../types';
import { clash, getRankInfo, rollCoin } from '../utils';

export class ReceptionRoom extends DurableObject {
  private state: ReceptionRoomState;
  private storageKey = 'receptionState';

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.state = this.createDefaultState();
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<ReceptionRoomState>(this.storageKey);
      if (stored) this.state = stored;
    });
  }

  private createDefaultState(): ReceptionRoomState {
    return {
      p1: {} as any,
      p2: {} as any,
      turn: 'p1',
      phase: 'p1Select',
      p1SkillIdx: null,
      p2SkillIdx: null,
      clashResult: null,
      winner: null,
      scoreChanges: { p1: 0, p2: 0 },
      lifeChanges: { p1: 0, p2: 0 },
      newRanks: { p1: 'Manager', p2: 'Manager' },
    };
  }

  private async saveState() {
    await this.ctx.storage.put(this.storageKey, this.state);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === '/state') {
      return Response.json(this.state);
    }
    return new Response('Not found', { status: 404 });
  }

  async webSocketOpen(ws: WebSocket) {
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Reception room.' }));
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    const session = this.ctx.getWebSocketData(ws) as { playerIndex?: 0 | 1 };

    if (data.type === 'join') {
      const idx = this.state.p1.playerName ? 1 : 0;
      const playerKey = idx === 0 ? 'p1' : 'p2';
      this.state[playerKey] = { ...data.playerData, userId: data.userId };
      this.state.phase = 'p1Select';
      this.ctx.setWebSocketData(ws, { playerIndex: idx });
      await this.saveState();
      this.broadcastState();
      ws.send(JSON.stringify({ type: 'roomJoined', playerIndex: idx }));
      return;
    }

    if (data.type === 'selectSkill') {
      const idx = session?.playerIndex;
      if (idx === undefined) return;
      const key = idx === 0 ? 'p1' : 'p2';
      if (this.state[`${key}SkillIdx`] !== null) return;
      this.state[`${key}SkillIdx`] = data.skillIdx;
      await this.saveState();
      this.broadcastState();

      if (this.state.p1SkillIdx !== null && this.state.p2SkillIdx !== null) {
        await this.resolveClash();
      }
      return;
    }
  }

  // ─── FIX: added `async` here ──────────────────────────────────────
  private async resolveClash() {
    const p1Skill = this.state.p1.skills[this.state.p1SkillIdx!];
    const p2Skill = this.state.p2.skills[this.state.p2SkillIdx!];
    if (!p1Skill || !p2Skill) return;

    const p1IsUlt = p1Skill.isUltimate && this.state.p1.stats.ultimateBar >= 100;
    const p2IsUlt = p2Skill.isUltimate && this.state.p2.stats.ultimateBar >= 100;

    if (p1IsUlt) {
      this.state.p1.stats.ultimateBar = 0;
      if (this.state.p1.transformationTrigger === 'ultimate' && this.state.p1.transformedSkills.length > 0) {
        this.state.p1.stats.transformationActive = true;
        this.state.p1.stats.transformationTurnsLeft = this.state.p1.ultimateDuration || 8;
        this.state.p1.skills = this.state.p1.transformedSkills;
      }
    }
    if (p2IsUlt) {
      this.state.p2.stats.ultimateBar = 0;
      if (this.state.p2.transformationTrigger === 'ultimate' && this.state.p2.transformedSkills.length > 0) {
        this.state.p2.stats.transformationActive = true;
        this.state.p2.stats.transformationTurnsLeft = this.state.p2.ultimateDuration || 8;
        this.state.p2.skills = this.state.p2.transformedSkills;
      }
    }

    const result = clash(p1Skill.power, p2Skill.power, p1Skill.coins, p2Skill.coins);
    let p1Mult = 1.0, p2Mult = 1.0;
    if (this.state.p1.classCategory === 'Attacker') p1Mult += this.state.p1.classEffect;
    if (this.state.p2.classCategory === 'Attacker') p2Mult += this.state.p2.classEffect;

    let p1Dmg = 0, p2Dmg = 0, won = false;
    if (result.playerTotal >= result.enemyTotal) {
      const diff = Math.max(1, result.playerTotal - result.enemyTotal + result.playerTotal / 4);
      p1Dmg = Math.max(1, Math.floor((this.state.p1.stats.atk * (diff / 6) - this.state.p2.stats.def * 0.5) / 16) * p1Mult * (0.85 + Math.random() * 0.3));
      p1Dmg = Math.min(p1Dmg, 75);
      this.state.p2.stats.hp = Math.max(0, this.state.p2.stats.hp - p1Dmg);
      won = true;
      if (this.state.p1.hasUltimate) {
        const gain = 0.0025 + Math.random() * 0.0275;
        this.state.p1.stats.ultimateBar = Math.min(100, this.state.p1.stats.ultimateBar + gain);
      }
    } else {
      const diff = Math.max(1, result.enemyTotal - result.playerTotal + result.enemyTotal / 4);
      p2Dmg = Math.max(1, Math.floor((this.state.p2.stats.atk * (diff / 6) - this.state.p1.stats.def * 0.5) / 16) * p2Mult * (0.85 + Math.random() * 0.3));
      p2Dmg = Math.min(p2Dmg, 75);
      this.state.p1.stats.hp = Math.max(0, this.state.p1.stats.hp - p2Dmg);
      won = false;
      if (this.state.p2.hasUltimate) {
        const gain = 0.0025 + Math.random() * 0.0275;
        this.state.p2.stats.ultimateBar = Math.min(100, this.state.p2.stats.ultimateBar + gain);
      }
    }

    if (p1Skill.type !== 'ego') this.state.p1.stats.sp = Math.min(100, this.state.p1.stats.sp + 10);
    if (p2Skill.type !== 'ego') this.state.p2.stats.sp = Math.min(100, this.state.p2.stats.sp + 10);

    this.state.clashResult = {
      p: result.playerTotal,
      e: result.enemyTotal,
      pName: p1Skill.name,
      eName: p2Skill.name,
      won,
      dmg: won ? p1Dmg : p2Dmg,
      actorName: won ? this.state.p1.playerName : this.state.p2.playerName,
      ultimateGain: won ? (this.state.p1.hasUltimate ? (this.state.p1.stats.ultimateBar / 100) : 0) : 0,
    };

    if (this.state.p1.stats.hp <= 0 || this.state.p2.stats.hp <= 0) {
      const p1Won = this.state.p2.stats.hp <= 0;
      this.state.winner = p1Won ? 'p1' : 'p2';
      const scoreChange = 20;
      const p1NewScore = this.state.p1.stats.score + (p1Won ? scoreChange : -scoreChange);
      const p2NewScore = this.state.p2.stats.score + (p1Won ? -scoreChange : scoreChange);
      const p1Lives = this.state.p1.stats.lives - (p1Won ? 0 : 1);
      const p2Lives = this.state.p2.stats.lives - (p1Won ? 1 : 0);
      const p1FinalLives = p1Lives <= 0 ? 5 : p1Lives;
      const p2FinalLives = p2Lives <= 0 ? 5 : p2Lives;
      const p1FinalScore = p1Lives <= 0 ? p1NewScore - 50 : p1NewScore;
      const p2FinalScore = p2Lives <= 0 ? p2NewScore - 50 : p2NewScore;

      this.state.scoreChanges = { p1: p1FinalScore - this.state.p1.stats.score, p2: p2FinalScore - this.state.p2.stats.score };
      this.state.lifeChanges = { p1: p1FinalLives - this.state.p1.stats.lives, p2: p2FinalLives - this.state.p2.stats.lives };
      this.state.newRanks = {
        p1: getRankInfo(p1FinalScore).name,
        p2: getRankInfo(p2FinalScore).name,
      };
      this.broadcastMatchResult();
      return;
    }

    this.state.p1SkillIdx = null;
    this.state.p2SkillIdx = null;
    this.state.turn = this.state.turn === 'p1' ? 'p2' : 'p1';
    this.state.phase = this.state.turn === 'p1' ? 'p1Select' : 'p2Select';
    this.state.clashResult = null;

    if (this.state.p1.stats.transformationActive) {
      this.state.p1.stats.transformationTurnsLeft -= 1;
      if (this.state.p1.stats.transformationTurnsLeft <= 0) {
        this.state.p1.stats.transformationActive = false;
        this.state.p1.skills = this.state.p1.baseSkills;
      }
    }
    if (this.state.p2.stats.transformationActive) {
      this.state.p2.stats.transformationTurnsLeft -= 1;
      if (this.state.p2.stats.transformationTurnsLeft <= 0) {
        this.state.p2.stats.transformationActive = false;
        this.state.p2.skills = this.state.p2.baseSkills;
      }
    }

    await this.saveState();
    this.broadcastState();
  }

  private broadcastState() {
    const message = JSON.stringify({ type: 'gameState', state: this.state });
    for (const [ws, _] of this.ctx.getWebSockets()) {
      ws.send(message);
    }
  }

  private broadcastMatchResult() {
    const result = {
      winner: this.state.winner,
      scoreChanges: this.state.scoreChanges,
      lifeChanges: this.state.lifeChanges,
      newRanks: this.state.newRanks,
    };
    for (const [ws, _] of this.ctx.getWebSockets()) {
      ws.send(JSON.stringify({ type: 'matchResult', ...result }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    const session = this.ctx.getWebSocketData(ws) as { playerIndex?: 0 | 1 };
    if (session?.playerIndex !== undefined) {
      const idx = session.playerIndex;
      const loserKey = idx === 0 ? 'p1' : 'p2';
      const winnerKey = idx === 0 ? 'p2' : 'p1';
      const loser = this.state[loserKey];
      const winner = this.state[winnerKey];
      if (loser && winner) {
        const scoreChange = 20;
        const winnerNewScore = winner.stats.score + scoreChange;
        const loserNewScore = loser.stats.score - scoreChange;
        const loserLives = loser.stats.lives - 1;
        const loserFinalLives = loserLives <= 0 ? 5 : loserLives;
        const loserFinalScore = loserLives <= 0 ? loserNewScore - 50 : loserNewScore;

        this.state.scoreChanges = {
          [winnerKey]: winnerNewScore - winner.stats.score,
          [loserKey]: loserFinalScore - loser.stats.score,
        };
        this.state.lifeChanges = {
          [winnerKey]: 0,
          [loserKey]: loserFinalLives - loser.stats.lives,
        };
        this.state.newRanks = {
          [winnerKey]: getRankInfo(winnerNewScore).name,
          [loserKey]: getRankInfo(loserFinalScore).name,
        };
        this.state.winner = winnerKey;
        this.broadcastMatchResult();
      }
    }
  }
}