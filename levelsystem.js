//manages core game mechanics
let currentLevelIndex = 0;
let levels = [];

fetch('levels.json')
    .then(response => response.json())
    .then(data => {
        levels = data.levels;
        loadLevel(currentLevelIndex);
    })
    .catch(error => console.error('Error loading levels:', error));

function loadLevel(index) {
    if (index < 0 || index >= levels.length) {
        console.error('Invalid level index:', index);
        return;
    }
    const level = levels[index];
    setupLevel(level);
}

function nextLevel() {
    currentLevelIndex++;
    if (currentLevelIndex >= levels.length) {
        currentLevelIndex = 0; // Loop back to the first level when done with all levels
    }
    loadLevel(currentLevelIndex);
}

function restartLevel() {
    loadLevel(currentLevelIndex);
}

function setupLevel(level) {
    isLevelCompleted = false;
    goalReached = false;
    World.clear(engine.world);
    Engine.clear(engine);

    const width = 800; // Width for the platformer
    const height = 600; // Height for the platformer

    // Set background color
    document.getElementById('gameCanvas').style.backgroundColor = level.backgroundColor || '#1a1a1a';

    // Create ground
    const ground = Bodies.rectangle(width / 2, height - 25, width, 50, { isStatic: true, render: { fillStyle: level.groundColor || '#555' } });
    World.add(engine.world, ground);

    // Create invisible boundaries (excluding ceiling)
    const leftBoundary = Bodies.rectangle(-25, height / 2, 50, height, { isStatic: true, render: { visible: false } });
    const rightBoundary = Bodies.rectangle(width + 25, height / 2, 50, height, { isStatic: true, render: { visible: false } });
    const bottomBoundary = Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true, render: { visible: false } });
    World.add(engine.world, [leftBoundary, rightBoundary, bottomBoundary]);

    // Create platforms
    level.platforms.forEach(platform => {
        const body = Bodies.rectangle(platform.x, platform.y, platform.width, platform.height, { 
            isStatic: true, 
            render: { fillStyle: platform.color },
            collisionFilter: {
                mask: platform.collidable === false ? 0 : 0xFFFFFFFF // Make non-collidable if collidable is false
            }
        });
        Body.setAngle(body, platform.rotation * (Math.PI / 180)); // Convert degrees to radians
        World.add(engine.world, body);
    });

    // Create conveyor belts
    conveyorBelts = [];
    level.conveyorBelts.forEach(belt => {
        const body = Bodies.rectangle(belt.x, belt.y, belt.width, belt.height, { 
            isStatic: true, 
            render: { fillStyle: belt.color }
        });
        World.add(engine.world, body);
        conveyorBelts.push({
            body,
            speed: belt.speed
        });
    });

    // Create goal
    goal = Bodies.rectangle(level.goal.x, level.goal.y, level.goal.width, level.goal.height, { isStatic: true, render: { fillStyle: level.goal.color } });
    World.add(engine.world, goal);

    // Create buttons
    buttons = [];
    level.buttons.forEach(button => {
        const body = Bodies.rectangle(button.x, button.y, button.width, button.height, { isStatic: true, render: { fillStyle: button.color } });
        body.isButton = true;
        buttons.push(body);
        World.add(engine.world, body);
    });

    // Create doors
    doors = [];
    level.doors.forEach(door => {
        const body = Bodies.rectangle(door.x, door.y, door.width, door.height, { 
            isStatic: true, 
            render: { fillStyle: door.color },
            collisionFilter: {
                mask: door.collidable === false ? 0 : 0xFFFFFFFF // Make non-collidable if collidable is false
            }
        });
        body.isDoor = true;
        doors.push(body);
        World.add(engine.world, body);
    });

    // Create movable objects
    level.movables.forEach(movable => {
        const body = Bodies.rectangle(movable.x, movable.y, movable.width, movable.height, { 
            isStatic: movable.anchor, 
            render: { fillStyle: movable.color },
            collisionFilter: {
                mask: movable.collidable === false ? 0 : 0xFFFFFFFF // Make non-collidable if collidable is false
            }
        });
        World.add(engine.world, body);
    });

    // Create player (neon yellow square)
    const playerSpawn = level.playerSpawn || { x: 50, y: 50 };
    player = Bodies.rectangle(playerSpawn.x, playerSpawn.y, 40, 40, { render: { fillStyle: '#ff0' } });
    World.add(engine.world, player);

    // Display lore
    if (level.lore) {
        showToast(level.lore);
    }

    // Reset timer
    startTime = Date.now();
    requestAnimationFrame(updateTimer);

    // Add controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Check for level completion
    Events.on(engine, 'collisionStart', event => {
        const pairs = event.pairs;
        pairs.forEach(pair => {
            if (!goalReached && ((pair.bodyA === player && pair.bodyB === goal) || (pair.bodyA === goal && pair.bodyB === player))) {
                goalReached = true;
                isLevelCompleted = true;
                const timeTaken = (Date.now() - startTime) / 1000;
                showToast(`Level Completed in ${timeTaken.toFixed(2)} seconds`);
                document.getElementById('timer').innerText = `Time: ${timeTaken.toFixed(2)}s`;
                goalSound.play();
                setTimeout(() => {
                    nextLevel();
                }, 2000); // Transition to the next level after 2 seconds
            }
        });
    });

    // Reset jump ability on collision with ground or platforms
    Events.on(engine, 'collisionActive', event => {
        const pairs = event.pairs;
        pairs.forEach(pair => {
            if ((pair.bodyA === player && pair.bodyB.isStatic) || (pair.bodyB === player && pair.bodyA.isStatic)) {
                canJump = true;
            }
        });
    });

    // Play collision sound on landing
    Events.on(engine, 'collisionEnd', event => {
        const pairs = event.pairs;
        pairs.forEach(pair => {
            if ((pair.bodyA === player && pair.bodyB.isStatic) || (pair.bodyB === player && pair.bodyA.isStatic)) {
                if (wasInAir && !deafenCollisionSound) {
                    playSound(collisionSounds);
                    wasInAir = false;
                }
            }
        });
    });

    // Handle button press
    Events.on(engine, 'collisionStart', event => {
        const pairs = event.pairs;
        pairs.forEach(pair => {
            if ((pair.bodyA === player && pair.bodyB.isButton) || (pair.bodyA.isButton && pair.bodyB === player)) {
                const button = pair.bodyA.isButton ? pair.bodyA : pair.bodyB;
                button.render.fillStyle = '#f00'; // Change button color to red
                doors.forEach(door => {
                    door.render.fillStyle = '#0f0'; // Change door color to green
                    World.remove(engine.world, door); // Make door non-collidable
                });
            }
        });
    });

    // Start updating conveyor belts
    requestAnimationFrame(updateConveyorBelts);
}