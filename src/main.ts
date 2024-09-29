import Phaser from 'phaser';
import { Howl } from 'howler';
const n = 32
const sizeNum = 400
const gapNum = 200
const gapVariation =200
export class SimpleGame extends Phaser.Scene {
    private box!: Phaser.GameObjects.Rectangle;
    private floors!: Phaser.GameObjects.Rectangle[];
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private moveSound!: Howl;
    private soundPlaying: boolean = false;
    private isJumping: boolean = false;
    private moveDirection: 'left' | 'right' | null = null; // To track the current movement direction
    private jumps: number = 0;
    constructor() {
        super('simple-game');
    }

    preload(): void {
        // Load your walking sound here if needed
        this.load.audio('walk', 'walk.wav'); // Ensure the path is correct
    }

    create(): void {
        this.jumps = 0;
        // Create a box (rectangle)
        this.box = this.add.rectangle(400, 300, 50, 50, 0xffff00);
        this.physics.add.existing(this.box);
        // (this.box.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

        // Enable gravity
        (this.box.body as Phaser.Physics.Arcade.Body).setGravityY(300);
const calculateX = (i: number) => sizeNum * i + (gapNum + Math.cos(i/n*Math.PI*2/3)*gapVariation) * i
        // Create the floor (static object)
        this.floors = Array.from({ length: n }).map((_, i) =>
            this.add.rectangle(calculateX(i), 580+(Math.cos(i/n*Math.PI)/2+0.5)*100, sizeNum, 40, 0x00ff00)
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
        this.cameras.main.setBounds(0, 0,calculateX(n), 600);  // Set camera bounds

        // Listen for Esc key to pause and go to MainMenu
        this.input.keyboard?.on('keydown-ESC', () => {
            this.scene.launch('main-menu'); // Launch MainMenu without stopping SimpleGame
            this.scene.pause(); // Pause SimpleGame
        });
    }

    update(): void {
        const boxBody = this.box.body as Phaser.Physics.Arcade.Body;
        let isWalking = false;

        // Respawn if the box falls off the bottom of the screen
        if (boxBody.y > this.cameras.main.height) {
            boxBody.reset(400, 300); // Reset position
            boxBody.setVelocity(0, 0); // Reset velocity to stop any momentum
        }

        // Reset horizontal velocity
        boxBody.setVelocityX(0);

        // Direction logic to prioritize first key pressed and prevent changing directions while holding both keys
        if (this.cursors?.left?.isDown && this.cursors?.right?.isDown) {
            // If both keys are pressed, keep moving in the current direction
            if (this.moveDirection === 'left') {
                boxBody.setVelocityX(-160); // Continue moving left
                isWalking = true;
            } else if (this.moveDirection === 'right') {
                boxBody.setVelocityX(160); // Continue moving right
                isWalking = true;
            }
        } else if (this.cursors?.left?.isDown) {
            // Move left and set the movement direction
            this.moveDirection = 'left';
            boxBody.setVelocityX(-160);
            isWalking = true;
        } else if (this.cursors?.right?.isDown) {
            // Move right and set the movement direction
            this.moveDirection = 'right';
            boxBody.setVelocityX(160);
            isWalking = true;
        } else {
            // Reset direction when no key is pressed
            this.moveDirection = null;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors?.up!) && this.jumps < 2) {
            // Jump with upward velocity
            boxBody.setVelocityY(-330);
            // Increment jump counter
            this.jumps++;
            // Optional: Play jump sound or add other effects here
        }

        // Reset jump state when the box lands back on the floor
        if (boxBody.blocked.down) {
            this.isJumping = false;
            this.jumps = 0;
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


export class MainMenu extends Phaser.Scene {
    private playButton!: Phaser.GameObjects.Text;
    private resumeButton!: Phaser.GameObjects.Text;

    constructor() {
        super('main-menu');
    }

    create(): void {
        const { width, height } = this.scale;

        // Title Text
        this.add.text(width / 2, height / 3, 'My Phaser Game', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Play Button
        this.playButton = this.add.text(width / 2, height / 2, 'Play', {
            fontSize: '32px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Resume Button
        this.resumeButton = this.add.text(width / 2, height / 2 + 60, 'Resume', {
            fontSize: '32px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Check if SimpleGame scene is already running to toggle Resume button
        const isGameRunning = this.scene.isActive('simple-game');
        this.resumeButton.setVisible(isGameRunning);

        // Play Button Event
        this.playButton.on('pointerdown', () => {
            // Start a new game by starting SimpleGame scene
            this.scene.start('simple-game');
        });

        // Resume Button Event
        this.resumeButton.on('pointerdown', () => {
            // Resume the SimpleGame scene
            this.scene.resume('simple-game');
            this.scene.stop(); // Stop the MainMenu
        });

        // Handle responsive layout
        this.scale.on('resize', this.resize, this);
    }

    private resize(gameSize: Phaser.Structs.Size): void {
        const { width, height } = gameSize;

        // Update positions based on new size
        this.playButton.setPosition(width / 2, height / 2);
        this.resumeButton.setPosition(width / 2, height / 2 + 60);
    }
}


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#3498db',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 300 }, // Global gravity
            debug: false // You can enable this for debugging
        }
    },
    scene: [MainMenu, SimpleGame]  // Multiple scenes as an array
};

new Phaser.Game(config);
