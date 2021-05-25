import {Universe, Cell, Pattern} from "wasm-game-of-life";
import {memory} from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

let universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ticksPerSecondInput = document.getElementById("ticks-per-second");
ticksPerSecondInput.value = "1";

ticksPerSecondInput.addEventListener("input", (event) => {
    if (parseFloat(ticksPerSecondInput.value) > 1000.0) {
        window.alert("Max is 1000");
        ticksPerSecondInput.value = "1000";
    }
    // console.log("ticksNeeded", ticksPerSecondInput.value);

    renderLoop();
});

const ctx = canvas.getContext('2d');

let animationId = null;
let lastTickTimestamp = null;

const renderLoop = (timestamp) => {
    // debugger;

    // console.log("==== Frame ====");

    if (lastTickTimestamp === null) {
        console.log("" + timestamp + ": Initial");
        lastTickTimestamp = timestamp || 0.0;
        drawGrid();
        drawCells();
        animationId = requestAnimationFrame(renderLoop);
        return;
    }

    const tickPeriodMilliseconds = 1.0 / (parseFloat(ticksPerSecondInput.value) || 1.0) * 1000.0;

    let ticked = false;

    // Simulate time passing, but only update lastTickTimestamp as far as needed.
    while (lastTickTimestamp < timestamp - tickPeriodMilliseconds) {
        // console.log("" + timestamp + ": Tick");
        universe.tick();
        lastTickTimestamp += tickPeriodMilliseconds;
        ticked = true;
    }

    if (ticked) {
        lastTickTimestamp = timestamp;
        drawGrid();
        drawCells();
    }

    animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = cells[idx] === Cell.Dead
                ? DEAD_COLOR
                : ALIVE_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};

const playPauseButton = document.getElementById("play-pause");

const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
};

const pause = () => {
    playPauseButton.textContent = "▶️";
    console.log("Cancelling animation frame: " + animationId);
    cancelAnimationFrame(animationId);
    animationId = null;
};

const resetRandomButton = document.getElementById("reset-random");

resetRandomButton.textContent = "🆕";

const resetRandom = () => {
    universe.reset_random();
    drawGrid();
    drawCells();
};

resetRandomButton.addEventListener("click", event => {
    resetRandom();
    drawGrid();
    drawCells();
});

const resetDeadButton = document.getElementById("reset-dead");

resetDeadButton.textContent = "☠️";

const resetDead = () => {
    universe.clear();
    drawGrid();
    drawCells();
}

resetDeadButton.addEventListener("click", event => {
    resetDead();
});

const isPaused = () => {
    return animationId === null;
};

playPauseButton.addEventListener("click", event => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    if (event.altKey) {
        universe.place_pattern(row, col, Pattern.Glider);
    } else if (event.shiftKey) {
        universe.place_pattern(row, col, Pattern.Pulsar);
    } else {
        universe.toggle_cell(row, col);
    }

    drawGrid();
    drawCells();
});
play();
