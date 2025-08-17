const CONFIG = {
    score: {
        threshold: 25,
        increment: 1
    },
    
    tulipPalette: {
        petals: ['#ff6b9d', '#ff8fab', '#ffb3c7', '#ff9a8b', '#ffb3a3', '#ffccbb', '#ff8b9a', '#ffa3b3', '#ffbbcc', '#ff7b9a', '#ff93b3', '#ffabcc', '#ff9a7b', '#ffb393', '#ffccab'],
        particles: ['#ff6b9d', '#ff8fab', '#ffb3c7', '#ff9a8b']
    },
    
    animation: {
        duration: {
            appearance: 1.5,
            stemDrawing: 2.0,
            leaves: 1.0,
            budRise: 1.5,
            petalOpening: 2.0,
            glow: 0.5,
            particles: 1.0,
            typing: 2.0
        },
        easing: 'power2.out',
        loop: {
            leafSway: 3.0,
            particleInterval: 5.0
        }
    },
    
    game: {
        gravity: 0.6,
        jumpForce: -12,
        groundLevel: 93,
        dinoWidth: 44,
        dinoHeight: 47,
        obstacleWidth: 17,
        obstacleHeight: 35,
        gameSpeed: 6,
        speedIncrement: 0.001
    }
};
