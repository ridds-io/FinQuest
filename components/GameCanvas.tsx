'use client';

import { useEffect, useRef } from 'react';

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import('phaser').Game | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    import('phaser').then((mod) => {
      const P = mod.default;

      class BootScene extends P.Scene {
        preload() {
          // Placeholder: no assets required for minimal world
        }
        create() {
          this.scene.start('World');
        }
      }

      class WorldScene extends P.Scene {
        private player!: import('phaser').GameObjects.Rectangle;
        private cursors!: import('phaser').Types.Input.Keyboard.CursorKeys;
        private moveLeft = false;
        private moveRight = false;
        private moveUp = false;
        private moveDown = false;
        private joyWrap!: import('phaser').GameObjects.Container;
        private joyStick!: import('phaser').GameObjects.Ellipse;

        preload() {}

        create() {
          const w = this.cameras.main.width;
          const h = this.cameras.main.height;
          // Green grass background
          this.add.rectangle(w / 2, h / 2, w, h, 0x2d5a1b);

          // Simple player (rectangle as placeholder for Nano Banana sprite)
          this.player = this.add.rectangle(w / 2, h / 2, 32, 48, 0xffd700).setDepth(10);
          this.physics.add.existing(this.player, true);
          const body = this.player.body as import('phaser').Physics.Arcade.StaticBody;
          body.setSize(32, 48);

          this.cursors = this.input.keyboard!.createCursorKeys();

          // Touch joystick for mobile
          const joyBase = this.add.ellipse(w - 80, h - 100, 70, 70, 0x000000, 0.4).setDepth(100).setScrollFactor(0);
          const joyKnob = this.add.ellipse(w - 80, h - 100, 30, 30, 0xffd700, 0.8).setDepth(101).setScrollFactor(0);
          this.joyWrap = this.add.container(0, 0, [joyBase, joyKnob]);
          this.joyStick = joyKnob;
          joyBase.setInteractive({ useHandCursor: true });
          const startPos = { x: w - 80, y: h - 100 };
          let active = false;
          joyBase.on('pointerdown', (ptr: import('phaser').Input.Pointer) => {
            active = true;
            this.joyStick.x = ptr.x;
            this.joyStick.y = ptr.y;
            const dx = (ptr.x - startPos.x) / 35;
            const dy = (ptr.y - startPos.y) / 35;
            this.moveLeft = dx < -0.3;
            this.moveRight = dx > 0.3;
            this.moveUp = dy < -0.3;
            this.moveDown = dy > 0.3;
          });
          this.input.on('pointermove', (ptr: import('phaser').Input.Pointer) => {
            if (!active || !joyBase.getBounds().contains(ptr.x, ptr.y)) return;
            this.joyStick.x = P.Math.Clamp(ptr.x, startPos.x - 35, startPos.x + 35);
            this.joyStick.y = P.Math.Clamp(ptr.y, startPos.y - 35, startPos.y + 35);
            const dx = (this.joyStick.x - startPos.x) / 35;
            const dy = (this.joyStick.y - startPos.y) / 35;
            this.moveLeft = dx < -0.3;
            this.moveRight = dx > 0.3;
            this.moveUp = dy < -0.3;
            this.moveDown = dy > 0.3;
          });
          this.input.on('pointerup', () => {
            active = false;
            this.joyStick.x = startPos.x;
            this.joyStick.y = startPos.y;
            this.moveLeft = this.moveRight = this.moveUp = this.moveDown = false;
          });
        }

        update() {
          const speed = 3;
          let vx = 0, vy = 0;
          if (this.cursors.left.isDown || this.moveLeft) vx = -speed;
          if (this.cursors.right.isDown || this.moveRight) vx = speed;
          if (this.cursors.up.isDown || this.moveUp) vy = -speed;
          if (this.cursors.down.isDown || this.moveDown) vy = speed;
          this.player.x += vx;
          this.player.y += vy;
          const w = this.cameras.main.width;
          const h = this.cameras.main.height;
          this.player.x = P.Math.Clamp(this.player.x, 20, w - 20);
          this.player.y = P.Math.Clamp(this.player.y, 20, h - 20);
        }
      }

      const config: import('phaser').Types.Core.GameConfig = {
        type: P.AUTO,
        width: 1024,
        height: 576,
        parent: containerRef.current,
        backgroundColor: '#2d5a2d',
        pixelArt: true,
        scale: {
          mode: P.Scale.FIT,
          autoCenter: P.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 } },
        },
        scene: [BootScene, WorldScene],
      };

      gameRef.current = new P.Game(config);
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
}
