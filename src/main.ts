import Phaser from 'phaser';
import { Howl } from 'howler';

class SimpleGame extends Phaser.Scene {
    private box!: Phaser.GameObjects.Rectangle;
    private floors!: Phaser.GameObjects.Rectangle[];
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private moveSound!: Howl;
    private soundPlaying: boolean = false;
    private isJumping: boolean = false;

    constructor() {
        super('simple-game');
    }

    preload(): void {
        // Load your walking sound here if needed
    }

    create(): void {
        // Create a box (rectangle)
        this.box = this.add.rectangle(400, 300, 50, 50, 0xffff00);
        this.physics.add.existing(this.box);
        // (this.box.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

        // Enable gravity
        (this.box.body as Phaser.Physics.Arcade.Body).setGravityY(300);

        // Create the floor (static object)
        this.floors = Array.from({ length: 4 }).map((_, i) => 
            this.add.rectangle(400 * i + 100 * i, 580, 400, 40, 0x00ff00)
        );
        this.floors.forEach(floor => {
            // 'true' makes it static
            this.physics.add.existing(floor, true);
            // Add collision between the box and the floor
            this.physics.add.collider(this.box, floor);
        });

        // Capture keyboard arrow keys
        this.cursors = this.input.keyboard?.createCursorKeys();

        // Initialize Howler sound
        this.moveSound = new Howl({
            loop: true,
            volume: 1,
            src: ['walk.wav'], // Add your move sound file here
        });

        // Make the camera follow the box
        this.cameras.main.startFollow(this.box, true, 0.05, 0.05);  // Slight easing on follow
        this.cameras.main.setBounds(0, 0, 1600, 600);  // Set camera bounds
    }

    update(): void {
        const boxBody = this.box.body as Phaser.Physics.Arcade.Body;
        let isWalking = false;

        // Respawn if the box falls off the bottom of the screen
        if (boxBody.y > this.cameras.main.height) {
            boxBody.reset(400, 300); // Reset position
        }

        // Reset horizontal velocity
        boxBody.setVelocityX(0);

        // Left and right movement
        if (this.cursors?.left?.isDown) {
            // Move left
            boxBody.setVelocityX(-160);
            isWalking = true;
        } else if (this.cursors?.right?.isDown) {
            // Move right
            boxBody.setVelocityX(160);
            isWalking = true;
        }

        // Jumping - Allow jumping only if the character is touching the floor
        if (this.cursors?.up?.isDown && boxBody.blocked.down && !this.isJumping) {
            // Jump with upward velocity
            boxBody.setVelocityY(-330);
            // Prevent multiple jumps while in the air
            this.isJumping = true;
        }

        // Reset jump state when the box lands back on the floor
        if (boxBody.blocked.down) {
            this.isJumping = false;
        }

        // Handle walking sound state
        if (isWalking && !this.isJumping) {
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
            gravity: { x: 0, y: 300 }, // Global gravity
            debug: false // You can enable this for debugging
        }
    },
    scene: SimpleGame
};

new Phaser.Game(config);
