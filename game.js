const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
//define all variables
let engine;
let render;
let runner;
let player;
let goal;
let canJump = true;
let playerSpeed = 5;
let jumpForce = 10;

let isGameStarted = false;
let startTime;
let isLevelCompleted = false;
let wasInAir = false;
let deafenCollisionSound = false;
let goalReached = false;
let buttons = [];
let doors = [];
let conveyorBelts = [];

// load sounds
const backgroundMusic = new Audio('sounds/background.mp3'); // just found something random
const jumpSounds = createAudioPool('sounds/jump.mp3', 30, 1.0); // Amplified jump sound in audacity
const collisionSounds = createAudioPool('sounds/collision.mp3', 30); //audio pool for multiaudio
const goalSound = new Audio('sounds/goal.mp3');
const clickSound = new Audio('sounds/click.mp3');

function createAudioPool(src, size, volume = 1.0) {
    const pool = [];
    for (let i = 0; i < size; i++) {
        const audio = new Audio(src);
        audio.volume = volume;
        pool.push(audio);
    }
    return pool;
}

function playSound(pool) {
    for (const audio of pool) {
        if (audio.paused) {
            audio.play();
            break;
        }
    }
}

function startGame() {
    isGameStarted = true;
    isLevelCompleted = false;
    engine = Engine.create();
    render = Render.create({
        canvas: document.getElementById('gameCanvas'),
        engine: engine,
        options: {
            width: 800,
            height: 600,
            background: '#1a1a1a', // dark grey
            wireframes: false
        }
    });

    runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // just making sure engine inits before level
    setTimeout(() => {
        loadLevel(currentLevelIndex);
    }, 100);

    // free cheats
    document.getElementById('gravity').addEventListener('input', (event) => {
        engine.gravity.y = parseFloat(event.target.value);
    });

    document.getElementById('speed').addEventListener('input', (event) => {
        playerSpeed = parseFloat(event.target.value);
    });

    document.getElementById('jump').addEventListener('input', (event) => {
        jumpForce = parseFloat(event.target.value);
    });

    // Play background music
    backgroundMusic.loop = true;
    backgroundMusic.play();
}

function handleKeyDown(event) {
    const { x, y } = player.velocity;
    switch (event.code) {
        case 'ArrowUp':
            if (canJump) {
                Body.setVelocity(player, { x, y: -jumpForce });
                canJump = false;
                playSound(jumpSounds);
                wasInAir = true;
                deafenCollisionSound = true;
                setTimeout(() => {
                    deafenCollisionSound = false;
                }, 50); // Deafen collision sound for 50 milliseconds when jump to not make them play at same time
            }
            break;
        case 'ArrowLeft':
            Body.setVelocity(player, { x: -playerSpeed, y });
            break;
        case 'ArrowRight':
            Body.setVelocity(player, { x: playerSpeed, y });
            break;
    }
}

function handleKeyUp(event) {
    switch (event.code) {
        case 'ArrowLeft':
        case 'ArrowRight':
            Body.setVelocity(player, { x: 0, y: player.velocity.y });
            break;
    }
}

function updateTimer() {
    if (!isLevelCompleted) {
        const currentTime = Date.now();
        const timeElapsed = (currentTime - startTime) / 1000;
        document.getElementById('timer').innerText = `Time: ${timeElapsed.toFixed(2)}s`;
        requestAnimationFrame(updateTimer);
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 100); // Add a slight delay to trigger the CSS transition
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500); // Wait for the transition to complete before removing the element
    }, 3000);
}

function updateConveyorBelts() {
    conveyorBelts.forEach(belt => {
        const { body, speed } = belt;
        const playerOnBelt = Matter.SAT.collides(player, body).collided;
        if (playerOnBelt) {
            Body.applyForce(player, { x: player.position.x, y: player.position.y }, { x: speed * 0.001, y: 0 });
        }
    });
    requestAnimationFrame(updateConveyorBelts);
}

// Draw start menu
drawStartMenu(document.getElementById('gameCanvas').getContext('2d'));

// Handle canvas click for start menu
document.getElementById('gameCanvas').addEventListener('click', (event) => {
    clickSound.play();
    handleCanvasClick(event, document.getElementById('gameCanvas'), startGame);
});

// Add CSS for toast notifications, no need to rely on toastify this time!
const style = document.createElement('style');
style.innerHTML = `
.toast {
    position: fixed;
    bottom: 20px;
    left: 60%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 16px;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
}
.toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(-10px);
}
`;
document.head.appendChild(style);