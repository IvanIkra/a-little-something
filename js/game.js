class DinoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.dino = {
            x: 50,
            y: CONFIG.game.groundLevel,
            width: CONFIG.game.dinoWidth,
            height: CONFIG.game.dinoHeight,
            velocityY: 0,
            isJumping: false,
            runFrame: 0,
            runSpeed: 0.2,
            blinkTimer: 0,
            isBlinking: false
        };

        // один спрайт (PNG) — положи в /assets/dino_run1.png
        this.dinoSprite = new Image();
        this.dinoSprite.src = "assets/dino_run1.png";

        this.obstacles = [];
        this.clouds = [];
        this.score = 0;
        this.gameSpeed = CONFIG.game.gameSpeed;
        this.isGameOver = false;
        this.isGameWon = false;
        this.isGameStarted = false;

        // система спавна с гарантированными зазорами
        this.spawnGap = 0;          // пиксели до следующего спавна
        this.reactionFrames = 8;    // запас на реакцию (кадры)
        this.safetyPx = 24;         // доп. буфер безопасности (px)
        this.minGapPx = 0;
        this.maxGapPx = 0;
        this.minTimeBetween = 0.9;  // секунды между группами кактусов (минимум)

        this.updateSpawnGaps();
        this.spawnGap = Math.floor(this.minGapPx * 2.2); // стартовый зазор пореже

        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        const jumpKeys = [' ', 'ArrowUp', 'w', 'W'];

        document.addEventListener('keydown', (e) => {
            if (jumpKeys.includes(e.key)) {
                if (!this.isGameStarted) {
                    this.startGame();
                } else if (!this.dino.isJumping && !this.isGameOver) {
                    this.jump();
                }
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('click', () => {
            if (!this.isGameStarted) {
                this.startGame();
            } else if (!this.dino.isJumping && !this.isGameOver) {
                this.jump();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.isGameStarted) {
                this.startGame();
            } else if (!this.dino.isJumping && !this.isGameOver) {
                this.jump();
            }
            e.preventDefault();
        });
    }

    startGame() {
        this.isGameStarted = true;
        this.jump();
    }

    jump() {
        if (!this.dino.isJumping) {
            this.dino.velocityY = CONFIG.game.jumpForce;
            this.dino.isJumping = true;
        }
    }

    updateDino() {
        this.dino.velocityY += CONFIG.game.gravity;
        this.dino.y += this.dino.velocityY;

        if (this.dino.y >= CONFIG.game.groundLevel) {
            this.dino.y = CONFIG.game.groundLevel;
            this.dino.velocityY = 0;
            this.dino.isJumping = false;
        }

        if (this.isGameStarted && !this.dino.isJumping) {
            this.dino.runFrame += this.dino.runSpeed;
        }

        if (this.isGameStarted) {
            this.updateBlinking();
        }
    }

    updateBlinking() {
        this.dino.blinkTimer += 1;

        if (this.dino.blinkTimer > 180 + Math.random() * 120) {
            this.dino.isBlinking = true;
            this.dino.blinkTimer = 0;
        }

        if (this.dino.isBlinking && this.dino.blinkTimer > 10) {
            this.dino.isBlinking = false;
        }
    }

    // === РАСЧЁТ БЕЗОПАСНЫХ ЗАЗОРОВ ===
    updateSpawnGaps() {
        const v0 = Math.abs(CONFIG.game.jumpForce); // |jumpForce|
        const g  = CONFIG.game.gravity;
        const T  = (2 * v0) / g;                    // время полёта в кадрах (~60 FPS)
        const dinoW = CONFIG.game.dinoWidth;
        const speed = this.gameSpeed;               // px/кадр

        const safeFrames = Math.max(0, T - this.reactionFrames);
        const jumpable   = speed * safeFrames;      // px, которые «перелетаем»

        // минимум по геометрии
        let minGap = Math.floor(jumpable - dinoW - this.safetyPx);

        // минимум по времени (не чаще, чем раз в minTimeBetween сек)
        const minTimePx = Math.ceil(this.minTimeBetween * 60 * speed);

        this.minGapPx = Math.max(140, minGap, minTimePx);
        this.maxGapPx = Math.max(this.minGapPx + 120, Math.floor(this.minGapPx * 3.2));
    }

    planNextSpawn(groupSpan) {
        // groupSpan — суммарная ширина группы (включая промежутки)
        const base = Math.max(this.minGapPx, groupSpan + 60);
        const factor = 1.2 + Math.random() * 1.8; // 1.2..3.0x
        this.spawnGap = Math.floor(base * factor);
        this.spawnGap = Math.min(this.spawnGap, 900); // мягкий потолок, чтобы не пустовало в начале
    }

    // === ГРУППОВОЙ СПАВН КАКТУСОВ (1–3 подряд) ===
    generateObstacle() {
        // уменьшаем «дистанцию до следующего спавна»
        this.spawnGap -= this.gameSpeed;
        if (this.spawnGap > 0) return;

        // размер группы: 1–3 кактуса
        const groupSize = 1 + Math.floor(Math.random() * 2);
        let offset = 0;

        for (let g = 0; g < groupSize; g++) {
            const isLarge = Math.random() < 0.5;
            const width   = isLarge ? 25 : 17;
            const height  = isLarge ? 50 : 35;
            const yPos    = isLarge ? 90  : 105;

            this.obstacles.push({
                x: this.canvas.width + offset,
                y: yPos,
                width,
                height,
                isLarge
            });

            // расстояние внутри группы (между кактусами)
            const intraGap = 20 + Math.floor(Math.random() * 15);
            offset += width + intraGap;
        }

        // планируем следующий спавн, учитывая всю протяжённость группы
        this.planNextSpawn(offset);
    }

    generateClouds() {
        if (Math.random() < 0.005) {
            this.clouds.push({
                x: this.canvas.width,
                y: Math.random() * 100 + 50,
                width: Math.random() * 30 + 20,
                height: Math.random() * 15 + 10
            });
        }
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;

            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += CONFIG.score.increment;

                if (this.score >= CONFIG.score.threshold) {
                    this.winGame();
                }
            }
        }
    }

    updateClouds() {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= this.gameSpeed * 0.5;

            if (cloud.x + cloud.width < 0) {
                this.clouds.splice(i, 1);
            }
        }
    }

    checkCollision() {
        for (const obstacle of this.obstacles) {
            if (this.dino.x < obstacle.x + obstacle.width &&
                this.dino.x + this.dino.width > obstacle.x &&
                this.dino.y < obstacle.y + obstacle.height &&
                this.dino.y + this.dino.height > obstacle.y) {
                this.gameOver();
                return true;
            }
        }
        return false;
    }

    gameOver() {
        this.isGameOver = true;
        this.gameSpeed = 0;
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        document.addEventListener('keydown', this.restartHandler.bind(this), { once: true });
        this.canvas.addEventListener('click', this.restartHandler.bind(this), { once: true });
        this.canvas.addEventListener('touchstart', this.restartHandler.bind(this), { once: true });
    }

    winGame() {
        if (this.isGameWon) return; // страховка от повторных вызовов
        this.isGameWon = true;
        // без ведущего слэша — относительный путь рядом с index.html
        window.location.href = `end.html?s=${this.score}`;
    }

    restartHandler(e) {
        if (e.type === 'keydown' && e.key !== ' ') {
            return;
        }
        location.reload();
    }

    // === РИСОВАНИЕ ===
    drawDino() {
        if (this.dinoSprite.complete) {
            // Рисуем спрайт от верхнего левого угла (теперь стоит на земле)
            this.ctx.drawImage(
                this.dinoSprite,
                this.dino.x,
                this.dino.y,
                this.dino.width,
                this.dino.height
            );
        }
    }

    drawDinoRunning() { this.drawDino(); }
    drawDinoJumping()  { this.drawDino(); }

    drawScore() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    }

    drawStartScreen() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PRESS SPACE TO START', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawGameOverScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

        this.ctx.font = '18px Courier New';
        this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '16px Courier New';
        this.ctx.fillText('PRESS SPACE TO RESTART', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }

    drawObstacles() {
        this.ctx.fillStyle = '#fff';
        for (const obstacle of this.obstacles) {
            if (obstacle.isLarge) {
                // «большой» кактус
                this.ctx.fillRect(obstacle.x, obstacle.y, 7, 38);
                this.ctx.fillRect(obstacle.x + 8, obstacle.y, 7, 49);
                this.ctx.fillRect(obstacle.x + 13, obstacle.y + 10, 10, 38);
            } else {
                // «маленький» кактус
                this.ctx.fillRect(obstacle.x, obstacle.y + 7, 5, 27);
                this.ctx.fillRect(obstacle.x + 4, obstacle.y, 6, 34);
                this.ctx.fillRect(obstacle.x + 10, obstacle.y + 4, 7, 14);
            }
        }
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (const cloud of this.clouds) {
            this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
        }
    }

    drawGround() {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.game.groundLevel + CONFIG.game.dinoHeight);
        this.ctx.lineTo(this.canvas.width, CONFIG.game.groundLevel + CONFIG.game.dinoHeight);
        this.ctx.stroke();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawClouds();
        this.drawGround();
        this.drawDino();
        this.drawObstacles();

        this.drawScore();

        if (!this.isGameStarted && !this.isGameOver) {
            this.drawStartScreen();
        }

        if (this.isGameOver) {
            this.drawGameOverScreen();
        }
    }

    update() {
        if (this.isGameOver || this.isGameWon) return;

        this.updateDino();

        if (this.isGameStarted) {
            this.generateObstacle();
            this.generateClouds();
            this.updateObstacles();
            this.updateClouds();
            this.checkCollision();

            this.gameSpeed += CONFIG.game.speedIncrement * 0.01; // плавное ускорение
            this.updateSpawnGaps(); // перерасчёт границ, НЕ трогает spawnGap
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DinoGame();
});