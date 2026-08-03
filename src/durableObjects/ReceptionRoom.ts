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

  private slotTaken(key: 'p1' | 'p2'): boolean {
    return !!this.state[key]?.playerName;
  }

  // ─── FIX: the client sends `stats: {...}` + `baseSkills`, but the frontend
  // renders flat fields (me.hp, me.maxHp, me.skills, me.ultimateBar, etc).
  // Flatten here so both sides agree on the shape. ──────────────────────────
  private buildPlayerState(payload: any, userId?: string) {
    const stats = payload?.stats || {};
    return {
      ...stats, // hp, maxHp, atk, def, spd, sp, score, lives, shield, resolveStacks, witherStacks, bleedStacks, ultimateBar, transformationActive, transformationTurnsLeft
      playerName: payload?.playerName || 'Player',
      identityId: payload?.identityId,
      weaponId: payload?.weaponId,
      giftIds: payload?.giftIds || [],
      classes: payload?.classes || [],
      classCategory: payload?.classCategory || 'Attacker',
      classEffect: payload?.classEffect || 0,
      baseSkills: payload?.baseSkills || [],
      transformedSkills: payload?.transformedSkills || [],
      skills: (payload?.baseSkills && payload.baseSkills.length > 0) ? payload.baseSkills : [],
      hasUltimate: payload?.hasUltimate || false,
      transformationTrigger: payload?.transformationTrigger || 'none',
      ultimateDuration: payload?.ultimateDuration || 0,
      transformationPassive: payload?.transformationPassive || null,
      weaponPassive: payload?.weaponPassive || '',
      userId,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    // ─── DEBUG: force-clear stuck/stale room state (e.g. leftover from earlier bugs) ──
    if (url.searchParams.get('reset') === 'true') {
      this.state = this.createDefaultState();
      await this.saveState();
      return Response.json({ reset: true, state: this.state });
    }
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
    const session = (ws.deserializeAttachment() || {}) as { playerIndex?: 0 | 1 };

    // ─── FIX: matchmaking entry point — this is what the client actually sends ──────
    if (data.type === 'findMatch') {
      // Already assigned a seat in this room (e.g. re-sent request) — ignore duplicates.
      if (session?.playerIndex !== undefined) return;

      const p1Taken = this.slotTaken('p1');
      const p2Taken = this.slotTaken('p2');

      if (p1Taken && p2Taken) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full. Please try again shortly.' }));
        return;
      }

      const idx: 0 | 1 = p1Taken ? 1 : 0;
      const playerKey = idx === 0 ? 'p1' : 'p2';
      this.state[playerKey] = this.buildPlayerState(data.payload, data.userId);
      ws.serializeAttachment({ playerIndex: idx });
      await this.saveState();

      const bothFilled = this.slotTaken('p1') && this.slotTaken('p2');

      if (bothFilled) {
        this.state.phase = 'p1Select';
        this.state.winner = null;
        this.state.p1SkillIdx = null;
        this.state.p2SkillIdx = null;
        this.state.clashResult = null;
        await this.saveState();

        // Tell every connected socket its own seat, then send the fresh state.
        for (const sock of this.ctx.getWebSockets()) {
          const sess = (sock.deserializeAttachment() || {}) as { playerIndex?: 0 | 1 };
          if (sess?.playerIndex !== undefined) {
            sock.send(JSON.stringify({ type: 'roomJoined', playerIndex: sess.playerIndex }));
          }
        }
        this.broadcastState();
      } else {
        ws.send(JSON.stringify({ type: 'queued' }));
      }
      return;
    }

    // ─── FIX: allow a queued (not-yet-matched) player to back out ────────────────────
    if (data.type === 'cancelMatch') {
      const idx = session?.playerIndex;
      if (idx === undefined) return;

      const key = idx === 0 ? 'p1' : 'p2';
      const otherKey = idx === 0 ? 'p2' : 'p1';

      // If an opponent has already taken the other seat, the match has started —
      // cancelling isn't meaningful anymore (they'd need to forfeit instead).
      if (this.slotTaken(otherKey)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Match already started, cannot cancel.' }));
        return;
      }

      this.state[key] = {} as any;
      ws.serializeAttachment({});
      await this.saveState();
      ws.send(JSON.stringify({ type: 'matchCancelled' }));
      return;
    }

    // ─── FIX: respond to the leaderboard request the client sends on connect ────────
    if (data.type === 'getLeaderboard') {
      ws.send(JSON.stringify({ type: 'leaderboard', data: [] }));
      return;
    }

    if (data.type === 'join') {
      const idx = this.state.p1.playerName ? 1 : 0;
      const playerKey = idx === 0 ? 'p1' : 'p2';
      this.state[playerKey] = this.buildPlayerState(data.playerData, data.userId);
      this.state.phase = 'p1Select';
      ws.serializeAttachment({ playerIndex: idx });
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
      // ─── FIX: client sends `{ type, payload }` via sendAction(), not `{ type, skillIdx }` ──
      const skillIdx = typeof data.skillIdx === 'number' ? data.skillIdx : data.payload;

      // ─── FIX: validate the index against the player's actual skill list before
      // accepting it. Previously any number (including -1, which the client could
      // send when Array.indexOf() failed to find a skill reference) was accepted
      // here. Once both players had "selected", resolveClash() would look up
      // this.state[key].skills[-1], get `undefined`, and bail out WITHOUT
      // resetting p1SkillIdx/p2SkillIdx — leaving both players permanently stuck
      // on "Skill submitted – waiting for opponent" / "Waiting for opponent"
      // with no way to act again. Rejecting bad indices here stops that state
      // from ever being written. ─────────────────────────────────────────────
      const skillsArr = this.state[key]?.skills || [];
      if (typeof skillIdx !== 'number' || skillIdx < 0 || skillIdx >= skillsArr.length) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid skill selection.' }));
        return;
      }

      this.state[`${key}SkillIdx`] = skillIdx;
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

    // ─── FIX: this used to `return` here with no cleanup whenever either
    // skill lookup came back undefined (e.g. a stale/invalid index slipped
    // through). Both p1SkillIdx/p2SkillIdx stayed non-null forever, so the
    // room was permanently stuck: every client saw "submitted" state with
    // no further messages ever arriving, i.e. the exact soft lock reported
    // ("Waiting for opponent" forever, on both sides, whether or not the
    // Excalibur auto-select passive fired). Now we reset the turn's
    // selection state and re-broadcast so play can continue instead of
    // hanging silently. The selectSkill validation above should prevent
    // this from triggering at all going forward, but this is kept as a
    // safety net. ──────────────────────────────────────────────────────
    if (!p1Skill || !p2Skill) {
      this.state.p1SkillIdx = null;
      this.state.p2SkillIdx = null;
      this.state.clashResult = null;
      await this.saveState();
      this.broadcastState();
      return;
    }

    const p1IsUlt = p1Skill.isUltimate && this.state.p1.ultimateBar >= 100;
    const p2IsUlt = p2Skill.isUltimate && this.state.p2.ultimateBar >= 100;

    if (p1IsUlt) {
      this.state.p1.ultimateBar = 0;
      if (this.state.p1.transformationTrigger === 'ultimate' && this.state.p1.transformedSkills.length > 0) {
        this.state.p1.transformationActive = true;
        this.state.p1.transformationTurnsLeft = this.state.p1.ultimateDuration || 8;
        this.state.p1.skills = this.state.p1.transformedSkills;
      }
    }
    if (p2IsUlt) {
      this.state.p2.ultimateBar = 0;
      if (this.state.p2.transformationTrigger === 'ultimate' && this.state.p2.transformedSkills.length > 0) {
        this.state.p2.transformationActive = true;
        this.state.p2.transformationTurnsLeft = this.state.p2.ultimateDuration || 8;
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
      p1Dmg = Math.max(1, Math.floor((this.state.p1.atk * (diff / 6) - this.state.p2.def * 0.5) / 16) * p1Mult * (0.85 + Math.random() * 0.3));
      p1Dmg = Math.min(p1Dmg, 75);
      this.state.p2.hp = Math.max(0, this.state.p2.hp - p1Dmg);
      won = true;
      if (this.state.p1.hasUltimate) {
        const gain = 0.0025 + Math.random() * 0.0275;
        this.state.p1.ultimateBar = Math.min(100, this.state.p1.ultimateBar + gain);
      }
    } else {
      const diff = Math.max(1, result.enemyTotal - result.playerTotal + result.enemyTotal / 4);
      p2Dmg = Math.max(1, Math.floor((this.state.p2.atk * (diff / 6) - this.state.p1.def * 0.5) / 16) * p2Mult * (0.85 + Math.random() * 0.3));
      p2Dmg = Math.min(p2Dmg, 75);
      this.state.p1.hp = Math.max(0, this.state.p1.hp - p2Dmg);
      won = false;
      if (this.state.p2.hasUltimate) {
        const gain = 0.0025 + Math.random() * 0.0275;
        this.state.p2.ultimateBar = Math.min(100, this.state.p2.ultimateBar + gain);
      }
    }

    if (p1Skill.type !== 'ego') this.state.p1.sp = Math.min(100, this.state.p1.sp + 10);
    if (p2Skill.type !== 'ego') this.state.p2.sp = Math.min(100, this.state.p2.sp + 10);

    this.state.clashResult = {
      p: result.playerTotal,
      e: result.enemyTotal,
      pName: p1Skill.name,
      eName: p2Skill.name,
      won,
      dmg: won ? p1Dmg : p2Dmg,
      actorName: won ? this.state.p1.playerName : this.state.p2.playerName,
      ultimateGain: won ? (this.state.p1.hasUltimate ? (this.state.p1.ultimateBar / 100) : 0) : 0,
    };

    // ─── FIX: broadcast the clash result NOW, while this.state.clashResult is
    // still populated. Previously the only broadcastState() call in this
    // function ran at the very end, by which point clashResult had already
    // been reset back to null a few lines below — so clients never actually
    // received a message with clashResult set, even though the HP mutation
    // above was already baked into that same final broadcast. That's why it
    // looked like the clash "resolved" (HP changed, log updated) without the
    // clash result screen ever appearing: the populated state was computed
    // but never sent. We now ship this intermediate state immediately. ────
    await this.saveState();
    this.broadcastState();

    if (this.state.p1.hp <= 0 || this.state.p2.hp <= 0) {
      const p1Won = this.state.p2.hp <= 0;
      this.state.winner = p1Won ? 'p1' : 'p2';
      const scoreChange = 20;
      const p1NewScore = this.state.p1.score + (p1Won ? scoreChange : -scoreChange);
      const p2NewScore = this.state.p2.score + (p1Won ? -scoreChange : scoreChange);
      const p1Lives = this.state.p1.lives - (p1Won ? 0 : 1);
      const p2Lives = this.state.p2.lives - (p1Won ? 1 : 0);
      const p1FinalLives = p1Lives <= 0 ? 5 : p1Lives;
      const p2FinalLives = p2Lives <= 0 ? 5 : p2Lives;
      const p1FinalScore = p1Lives <= 0 ? p1NewScore - 50 : p1NewScore;
      const p2FinalScore = p2Lives <= 0 ? p2NewScore - 50 : p2NewScore;

      this.state.scoreChanges = { p1: p1FinalScore - this.state.p1.score, p2: p2FinalScore - this.state.p2.score };
      this.state.lifeChanges = { p1: p1FinalLives - this.state.p1.lives, p2: p2FinalLives - this.state.p2.lives };
      this.state.newRanks = {
        p1: getRankInfo(p1FinalScore).name,
        p2: getRankInfo(p2FinalScore).name,
      };
      this.broadcastMatchResult();
      // ─── FIX: reset the room so it can host a new match instead of staying full forever ──
      this.state = this.createDefaultState();
      await this.saveState();
      return;
    }

    // ─── FIX: the clearing of clashResult (and the turn/skill-idx reset for the
    // next round) used to happen synchronously, right after the broadcast above,
    // with no gap between them. Even though this is a separate broadcastState()
    // call, it fires on the very next microtask/tick — clients had no realistic
    // window to render the clash screen before the "next round" state (with
    // clashResult back to null) overwrote it. We delay this part so the clash
    // result actually stays visible for a bit before the round advances. ──────
    const CLASH_RESULT_DISPLAY_MS = 2500;
    setTimeout(() => {
      this.advanceToNextRound().catch(err => console.error('advanceToNextRound failed:', err));
    }, CLASH_RESULT_DISPLAY_MS);
  }

  private async advanceToNextRound() {
    this.state.p1SkillIdx = null;
    this.state.p2SkillIdx = null;
    this.state.turn = this.state.turn === 'p1' ? 'p2' : 'p1';
    this.state.phase = this.state.turn === 'p1' ? 'p1Select' : 'p2Select';
    this.state.clashResult = null;

    if (this.state.p1.transformationActive) {
      this.state.p1.transformationTurnsLeft -= 1;
      if (this.state.p1.transformationTurnsLeft <= 0) {
        this.state.p1.transformationActive = false;
        this.state.p1.skills = this.state.p1.baseSkills;
      }
    }
    if (this.state.p2.transformationActive) {
      this.state.p2.transformationTurnsLeft -= 1;
      if (this.state.p2.transformationTurnsLeft <= 0) {
        this.state.p2.transformationActive = false;
        this.state.p2.skills = this.state.p2.baseSkills;
      }
    }

    await this.saveState();
    this.broadcastState();
  }

  private broadcastState() {
    const message = JSON.stringify({ type: 'gameState', state: this.state });
    for (const ws of this.ctx.getWebSockets()) {
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
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(JSON.stringify({ type: 'matchResult', ...result }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    const session = (ws.deserializeAttachment() || {}) as { playerIndex?: 0 | 1 };
    if (session?.playerIndex !== undefined) {
      const idx = session.playerIndex;
      const loserKey = idx === 0 ? 'p1' : 'p2';
      const winnerKey = idx === 0 ? 'p2' : 'p1';
      const loser = this.state[loserKey];
      const winner = this.state[winnerKey];

      // ─── FIX: only treat this as a forfeit if a real match was underway ──────────
      // Previously this ran on ANY disconnect, including a solo player who was still
      // queued (no opponent yet) — which corrupted the room state and blocked new matches.
      if (loser?.playerName && winner?.playerName) {
        const scoreChange = 20;
        const winnerNewScore = winner.score + scoreChange;
        const loserNewScore = loser.score - scoreChange;
        const loserLives = loser.lives - 1;
        const loserFinalLives = loserLives <= 0 ? 5 : loserLives;
        const loserFinalScore = loserLives <= 0 ? loserNewScore - 50 : loserNewScore;

        this.state.scoreChanges = {
          [winnerKey]: winnerNewScore - winner.score,
          [loserKey]: loserFinalScore - loser.score,
        };
        this.state.lifeChanges = {
          [winnerKey]: 0,
          [loserKey]: loserFinalLives - loser.lives,
        };
        this.state.newRanks = {
          [winnerKey]: getRankInfo(winnerNewScore).name,
          [loserKey]: getRankInfo(loserFinalScore).name,
        };
        this.state.winner = winnerKey;
        this.broadcastMatchResult();
        this.state = this.createDefaultState();
        await this.saveState();
      } else if (loser?.playerName) {
        // Solo player (still queued) disconnected — just free up their seat.
        this.state[loserKey] = {} as any;
        await this.saveState();
      }
    }
  }
}
