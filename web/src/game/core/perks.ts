import type { Hero } from "./types";

export type PerkId = "offense" | "armorer" | "archery" | "logistics" | "haste";

export type Perk = {
    id: PerkId;
    title: string;
    desc: string;
    apply: (hero: Hero) => void;
};

export const PERKS: Perk[] = [
    {
        id: "offense",
        title: "Offense",
        desc: "+15% урона",
        apply: (h) => {
            h.combat.baseDamage = Math.round(h.combat.baseDamage * 1.15);
        }
    },
    {
        id: "armorer",
        title: "Armorer",
        desc: "+1 Defense",
        apply: (h) => {
            h.stats.defense += 1;
        }
    },
    {
        id: "archery",
        title: "Archery",
        desc: "+20% дальность атаки",
        apply: (h) => {
            h.combat.range = Math.round(h.combat.range * 1.2);
        }
    },
    {
        id: "logistics",
        title: "Logistics",
        desc: "+12% скорость движения",
        apply: (h) => {
            h.combat.moveSpeed = Math.round(h.combat.moveSpeed * 1.12);
        }
    },
    {
        id: "haste",
        title: "Haste",
        desc: "-12% кулдаун автоатаки",
        apply: (h) => {
            h.combat.attackCooldownMs = Math.max(120, Math.round(h.combat.attackCooldownMs * 0.88));
        }
    }
];

export function pickPerks3(): Perk[] {
    const copy = [...PERKS];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 3);
}
