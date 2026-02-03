import Phaser from "phaser";
import "./style.css";

class MainScene extends Phaser.Scene {
    constructor() {
        super("main");
    }

    create() {
        this.add.text(20, 20, "Roguelike start 🚀", {
            fontSize: "24px",
            color: "#ffffff",
        });

        const player = this.add.rectangle(400, 300, 24, 24, 0x00ff00);

        const cursors = this.input.keyboard?.createCursorKeys();

        this.events.on("update", () => {
            const speed = 3;
            if (!cursors) return;

            if (cursors.left?.isDown) player.x -= speed;
            if (cursors.right?.isDown) player.x += speed;
            if (cursors.up?.isDown) player.y -= speed;
            if (cursors.down?.isDown) player.y += speed;
        });
    }
}

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#111111",
    parent: "app",
    scene: [MainScene],
});
