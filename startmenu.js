function drawStartMenu(ctx) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '40px "Orbitron"';
    ctx.textAlign = 'center';
    ctx.fillText('SuperSquare', canvas.width / 2, 200);

    ctx.fillStyle = '#ff0';
    ctx.font = '30px "Orbitron"';
    ctx.fillText('Start Game', canvas.width / 2, 330);

    // Add hover effeasdasdasdasdct
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x >= 325 && x <= 475 && y >= 300 && y <= 350) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'default';
    }
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x >= 325 && x <= 475 && y >= 300 && y <= 350) { // Adjusted button size
        startGame();
    }
}

// Initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Draw start menu
drawStartMenu(ctx);