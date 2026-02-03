import Phaser from "phaser";
import type { Enemy, Hero } from "../core/types";
import { damageByEnemyToHero, damageByHeroToEnemy } from "../core/balance";
import { pickPerks3, type Perk } from "../core/perks";

type EnemyGO = Phaser.Physics.Arcade.Sprite & {
    dataEnemy: Enemy;
};

export class MainScene extends Phaser.Scene {
    private hero!: Hero;
    private heroGO!: Phaser.GameObjects.Rectangle;
    private heroBody!: Phaser.Physics.Arcade.Body;

    private enemies!: Phaser.Physics.Arcade.Group;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    // бой
    private nextHeroAttackAt = 0;

    // волны
    private wave = 1;
    private waveLeftToSpawn = 0;
    private waveAlive = 0;
    private nextSpawnAt = 0;

    // враги бьют героя
    private enemyNextHitAt = new WeakMap<EnemyGO, number>();

    // UI
    private hudText!: Phaser.GameObjects.Text;

    // выбор перка
    private isChoosingPerk = false;
    private perkChoices: Perk[] = [];
    private perkText!: Phaser.GameObjects.Text;

    constructor() {
        super("main");
    }

    preload() {
        // создаём простую белую текстуру 1x1, чтобы враги были Sprite (для Arcade Physics)
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 1, 1);
        g.generateTexture("pixel", 1, 1);
        g.destroy();
    }

    create() {
        this.cursors = this.input.keyboard!.createCursorKeys();

        this.hero = {
            lvl: 1,
            xp: 0,
            stats: { attack: 1, defense: 1, power: 1, knowledge: 1 },
            combat: {
                hpMax: 100,
                hp: 100,
                moveSpeed: 220,
                range: 160,
                attackCooldownMs: 450,
                baseDamage: 10
            }
        };

        // Герой как прямоугольник + физика
        this.heroGO = this.add.rectangle(480, 270, 26, 26, 0x00ff00);
        this.physics.add.existing(this.heroGO);
        this.heroBody = this.heroGO.body as Phaser.Physics.Arcade.Body;
        this.heroBody.setCollideWorldBounds(true);

        // Враги
        this.enemies = this.physics.add.group();

        // HUD
        this.hudText = this.add
            .text(12, 10, "", { fontSize: "16px", color: "#ffffff" })
            .setDepth(10);

        // Overlay выбора перка
        this.perkText = this.add
            .text(this.scale.width / 2, this.scale.height / 2, "", {
                fontSize: "20px",
                color: "#ffffff",
                align: "center"
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setVisible(false);

        // клавиши выбора 1/2/3
        this.input.keyboard!.on("keydown-ONE", () => this.choosePerk(0));
        this.input.keyboard!.on("keydown-TWO", () => this.choosePerk(1));
        this.input.keyboard!.on("keydown-THREE", () => this.choosePerk(2));

        // стартуем первую волну
        this.startWave(1);
    }

    update(time: number, _delta: number) {
        if (this.isChoosingPerk) {
            this.heroBody.setVelocity(0, 0);
            return;
        }

        this.handleHeroMove();
        this.handleSpawning(time);
        this.handleEnemiesAI();
        this.handleHeroAutoAttack(time);
        this.handleEnemyHitsHero(time);
        this.updateHud();

        if (this.hero.combat.hp <= 0) {
            this.scene.restart();
        }
    }

    private handleHeroMove() {
        const speed = this.hero.combat.moveSpeed;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left?.isDown) vx -= speed;
        if (this.cursors.right?.isDown) vx += speed;
        if (this.cursors.up?.isDown) vy -= speed;
        if (this.cursors.down?.isDown) vy += speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.heroBody.setVelocity(vx, vy);
    }

    // -------- Waves / Spawning --------

    private startWave(n: number) {
        this.wave = n;
        this.waveLeftToSpawn = 6 + (n - 1) * 3;
        this.waveAlive = 0;
        this.nextSpawnAt = this.time.now + 600;
    }

    private handleSpawning(time: number) {
        if (this.waveLeftToSpawn > 0 && time >= this.nextSpawnAt) {
            this.spawnEnemy();
            this.waveLeftToSpawn--;
            this.waveAlive++;

            const interval = Math.max(250, 900 - this.wave * 40);
            this.nextSpawnAt = time + interval;
        }

        // Волна пройдена -> выбор перка
        if (this.waveLeftToSpawn === 0 && this.waveAlive === 0) {
            this.openPerkChoice();
        }
    }

    private spawnEnemy() {
        const p = this.pickSpawnPointAwayFromHero(260);

        const s = this.physics.add.sprite(p.x, p.y, "pixel") as EnemyGO;
        s.setTint(0xff4444);
        s.setDisplaySize(22, 22);
        s.setCollideWorldBounds(true);

        const enemy: Enemy = {
            kind: "grunt",
            hpMax: 25 + this.wave * 6,
            hp: 25 + this.wave * 6,
            moveSpeed: 90 + this.wave * 3,
            baseDamage: 6 + Math.floor(this.wave * 0.6)
        };

        s.dataEnemy = enemy;
        this.enemies.add(s);
    }

    private pickSpawnPointAwayFromHero(minDist: number) {
        const w = this.scale.width;
        const h = this.scale.height;
        const hx = this.heroGO.x;
        const hy = this.heroGO.y;

        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(20, w - 20);
            const y = Phaser.Math.Between(20, h - 20);
            const d = Phaser.Math.Distance.Between(x, y, hx, hy);
            if (d >= minDist) return { x, y };
        }

        return { x: 40, y: 40 };
    }

    // -------- Enemies AI --------

    private handleEnemiesAI() {
        const hx = this.heroGO.x;
        const hy = this.heroGO.y;

        this.enemies.children.each((obj) => {
            const e = obj as EnemyGO;
            if (!e.active || !e.dataEnemy) return;

            const dx = hx - e.x;
            const dy = hy - e.y;
            const len = Math.hypot(dx, dy) || 1;

            const vx = (dx / len) * e.dataEnemy.moveSpeed;
            const vy = (dy / len) * e.dataEnemy.moveSpeed;

            e.body.setVelocity(vx, vy);
        });
    }

    // -------- Combat: hero auto-attacks nearest --------

    private handleHeroAutoAttack(time: number) {
        if (time < this.nextHeroAttackAt) return;

        const target = this.findNearestEnemyInRange(this.hero.combat.range);
        if (!target) return;

        const dmg = damageByHeroToEnemy(this.hero);
        target.dataEnemy.hp -= dmg;

        // лёгкий эффект попадания
        this.tweens.add({
            targets: target,
            duration: 80,
            alpha: 0.3,
            yoyo: true
        });

        if (target.dataEnemy.hp <= 0) {
            target.destroy();
            this.waveAlive--;

            this.hero.xp += 5 + this.wave;
            this.tryLevelUp();
        }

        this.nextHeroAttackAt = time + this.hero.combat.attackCooldownMs;
    }

    private findNearestEnemyInRange(range: number): EnemyGO | null {
        let best: EnemyGO | null = null;
        let bestDist = Infinity;

        const hx = this.heroGO.x;
        const hy = this.heroGO.y;

        this.enemies.children.each((obj) => {
            const e = obj as EnemyGO;
            if (!e.active || !e.dataEnemy) return;

            const d = Phaser.Math.Distance.Between(hx, hy, e.x, e.y);
            if (d <= range && d < bestDist) {
                bestDist = d;
                best = e;
            }
        });

        return best;
    }

    // -------- Enemies hit hero if close --------

    private handleEnemyHitsHero(time: number) {
        const hx = this.heroGO.x;
        const hy = this.heroGO.y;

        this.enemies.children.each((obj) => {
            const e = obj as EnemyGO;
            if (!e.active || !e.dataEnemy) return;

            const d = Phaser.Math.Distance.Between(hx, hy, e.x, e.y);
            if (d > 22) return;

            const next = this.enemyNextHitAt.get(e) ?? 0;
            if (time < next) return;

            const dmg = damageByEnemyToHero(e.dataEnemy.baseDamage, this.hero);
            this.hero.combat.hp -= dmg;

            this.tweens.add({
                targets: this.heroGO,
                duration: 60,
                alpha: 0.4,
                yoyo: true
            });

            this.enemyNextHitAt.set(e, time + 700);
        });
    }

    // -------- Level up (Heroes-like base) --------

    private tryLevelUp() {
        const need = 30 + (this.hero.lvl - 1) * 20;
        if (this.hero.xp < need) return;

        this.hero.xp -= need;
        this.hero.lvl++;

        // первичные статы — пока рандом
        const roll = Phaser.Math.Between(1, 4);
        if (roll === 1) this.hero.stats.attack++;
        if (roll === 2) this.hero.stats.defense++;
        if (roll === 3) this.hero.stats.power++;
        if (roll === 4) this.hero.stats.knowledge++;

        // небольшой рост выживаемости
        this.hero.combat.hpMax += 5;
        this.hero.combat.hp = Math.min(this.hero.combat.hp + 20, this.hero.combat.hpMax);
    }

    // -------- Perk choice between waves --------

    private openPerkChoice() {
        if (this.isChoosingPerk) return; // защита от повторного вызова
        this.isChoosingPerk = true;
        this.perkChoices = pickPerks3();

        const lines = [
            `Волна ${this.wave} пройдена! Выбери улучшение:`,
            ``,
            `1) ${this.perkChoices[0].title} — ${this.perkChoices[0].desc}`,
            `2) ${this.perkChoices[1].title} — ${this.perkChoices[1].desc}`,
            `3) ${this.perkChoices[2].title} — ${this.perkChoices[2].desc}`,
            ``,
            `Нажми 1 / 2 / 3`
        ];

        this.perkText.setText(lines.join("\n")).setVisible(true);
    }

    private choosePerk(index: number) {
        if (!this.isChoosingPerk) return;
        if (index < 0 || index >= this.perkChoices.length) return;

        const perk = this.perkChoices[index];
        perk.apply(this.hero);

        this.perkText.setVisible(false);
        this.isChoosingPerk = false;

        this.startWave(this.wave + 1);
    }

    private updateHud() {
        const h = this.hero;
        this.hudText.setText(
            [
                `Wave: ${this.wave}  (left: ${this.waveLeftToSpawn}, alive: ${this.waveAlive})`,
                `HP: ${h.combat.hp}/${h.combat.hpMax}`,
                `Lvl: ${h.lvl}  XP: ${h.xp}`,
                `A:${h.stats.attack}  D:${h.stats.defense}  P:${h.stats.power}  K:${h.stats.knowledge}`,
                `Dmg: ${damageByHeroToEnemy(h)}  Range: ${h.combat.range}`
            ].join("\n")
        );
    }
}
