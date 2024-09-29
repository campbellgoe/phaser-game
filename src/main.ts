import Phaser from 'phaser';
import { Howl } from 'howler';

class SimpleGame extends Phaser.Scene {
    private box!: Phaser.GameObjects.Rectangle;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private moveSound!: Howl;
    private walking: boolean = false;
    private soundPlaying: boolean = false;

    constructor() {
        super('simple-game');
    }

    preload(): void {
        // Load your walking sound here if needed
    }

    create(): void {
        // Create a box (rectangle)
        this.box = this.add.rectangle(400, 300, 50, 50, 0xff0000);
        this.physics.add.existing(this.box);
        (this.box.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

        // Capture keyboard arrow keys
        this.cursors = this.input.keyboard?.createCursorKeys();

        // Initialize Howler sound
        this.moveSound = new Howl({
            loop: true,
            volume: 1,
            src: ['walk.wav'], // Add your move sound file here
        });
    }

    update(): void {
        const boxBody = this.box.body as Phaser.Physics.Arcade.Body;
        boxBody.setVelocity(0);

        let isWalking = false;

        // Check if the player is pressing any arrow key
        if (this.cursors?.left?.isDown) {
            boxBody.setVelocityX(-200);
            isWalking = true;
        } else if (this.cursors?.right?.isDown) {
            boxBody.setVelocityX(200);
            isWalking = true;
        }

        if (this.cursors?.up?.isDown) {
            boxBody.setVelocityY(-200);
            isWalking = true;
        } else if (this.cursors?.down?.isDown) {
            boxBody.setVelocityY(200);
            isWalking = true;
        }

        // Handle walking sound state
        if (isWalking) {
            if (!this.moveSound.playing() && !this.soundPlaying) {
                this.moveSound.fade(this.moveSound.volume() || 0, 1, 333);
                this.moveSound.play();
                this.soundPlaying = true;
            }
        } else {
            if (this.soundPlaying) {
                this.moveSound.fade(this.moveSound.volume(), 0, 333);
                this.soundPlaying = false;
                this.moveSound.once('fade', () => {
                    this.moveSound.stop();
                });
            }
        }
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#3498db',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: SimpleGame
};

new Phaser.Game(config);