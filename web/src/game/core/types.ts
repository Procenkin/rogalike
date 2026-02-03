export type PrimaryStats = {
    attack: number;    // Attack (Heroes-like)
    defense: number;   // Defense
    power: number;     // Power (позже: магия/скиллы)
    knowledge: number; // Knowledge (позже: мана/ресурс)
};

export type CombatStats = {
    hpMax: number;
    hp: number;
    moveSpeed: number;

    range: number;          // радиус автоатаки
    attackCooldownMs: number;
    baseDamage: number;
};

export type Hero = {
    lvl: number;
    xp: number;
    stats: PrimaryStats;
    combat: CombatStats;
};

export type Enemy = {
    kind: "grunt";
    hpMax: number;
    hp: number;
    moveSpeed: number;
    baseDamage: number;
};
