import type { Hero } from "./types";

export type PerkId = "damage" | "range" | "haste";

export type Perk = {
    id: PerkId;
    title: string;
    desc: string;
    apply: (hero: Hero) => void;
};

export const PERKS: Perk[] = [
    {
        id: "damage",
        title: "Sharpened Arrows",
        desc: "+25% урона",
        apply: (h) => {
            h.combat.baseDamage = Math.round(h.combat.baseDamage * 1.25);
        },
    },
    {
        id: "range",
        title: "Longbow",
        desc: "+30% дальности",
        apply: (h) => {
            h.combat.range = Math.round(h.combat.range * 1.3);
        },
    },
    {
        id: "haste",
        title: "Quick Hands",
        desc: "-15% перезарядки",
        apply: (h) => {
            h.combat.attackCooldownMs = Math.max(
                120,
                Math.round(h.combat.attackCooldownMs * 0.85),
            );
        },
    },
];

export function pickPerks3(): Perk[] {
    // выбор без повторов
    const copy = [...PERKS];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 3);
}
