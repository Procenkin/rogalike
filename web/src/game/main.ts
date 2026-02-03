import Phaser from "phaser";
import { MainScene } from "./scenes/MainScene";

export function startGame() {
    new Phaser.Game({
        type: Phaser.AUTO,
        width: 960,
        height: 540,
        backgroundColor: "#111111",
        parent: "app",
        physics: {
            default: "arcade",
            arcade: { debug: false }
        },
        scene: [MainScene]
    });
}
