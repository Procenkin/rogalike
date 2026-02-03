import type { Hero } from "./types";

export function damageByHeroToEnemy(hero: Hero): number {
    const atk = hero.stats.attack;
    return Math.round(hero.combat.baseDamage * (1 + atk * 0.08));
}

export function damageByEnemyToHero(enemyBaseDamage: number, hero: Hero): number {
    const def = hero.stats.defense;
    const mult = 1 / (1 + def * 0.06);
    return Math.max(1, Math.round(enemyBaseDamage * mult));
}
