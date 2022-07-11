// Import stylesheets
import './style.css';
import { GridCell } from './GridCell';

const lineW = 2;
// const cellS = 70;
// const cols = 20;
// const rows = 12;
const cellS = Math.floor(window.innerWidth / 30);
const cols = Math.floor((window.innerWidth - cellS) / cellS);
const rows = Math.floor((window.innerHeight - cellS) / cellS);
const maxW = cols * cellS;
const maxH = rows * cellS;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let speed = 1;
let stack = [];
let grid = [];
let startGeneration = false;
let shouldSolveMaze = false;
let solved = false;
const start = [0, 0];
const end = [cols - 1, rows - 1];

let finishedPathArr = [];

let mazeCreated = false;
let next;
let current;

let queue = [];
let solveNext;
let solveCurrent;

let endCurrent;

const getIndex = (coords) => {
  return coords[0] + coords[1] * cols;
};

canvas.width = maxW + lineW * 2;
canvas.height = maxH + lineW * 2;

let xOffset = (canvas.width - maxW) * 0.5;

window.addEventListener('resize', () => {
  canvas.width = maxW + lineW * 2;
  canvas.height = maxH + lineW * 2;
  xOffset = (canvas.width - maxW) * 0.5;
});

const generateMaze = () => {
  stack = [];
  grid = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid.push(
        new GridCell(ctx, grid, cols, rows, col, row, cellS, lineW, xOffset)
      );
    }
  }

  startGeneration = true;
  shouldSolveMaze = false;
};

const drawMaze = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!mazeCreated) {
    current.isVisited = true;

    if (stack.length > 0) {
      current.display('blue');
    }
    next = current.getAdjacent();

    if (next) {
      next.isVisited = true;
      stack.push(current);
      current.destroyWalls(next);
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    }

    if (stack.length) {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'red';
      ctx.moveTo(
        stack[0].col * cellS + cellS * 0.5,
        stack[0].row * cellS + cellS * 0.5
      );
      stack.forEach((rect, key) => {
        if (key > 1) {
          rect.joinLine();
        }
      });
      ctx.stroke();
    }
  }

  grid.forEach((rect) => {
    rect.draw();
  });

  ctx.strokeRect(xOffset, lineW, maxW, maxH);

  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
  //Start
  ctx.fillRect(
    grid[getIndex(start)].col * cellS + lineW * 1.5,
    grid[getIndex(start)].row * cellS + lineW * 1.5,
    cellS - lineW,
    cellS - lineW
  );

  //End
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.fillRect(
    grid[getIndex(end)].col * cellS + lineW * 1.5,
    grid[getIndex(end)].row * cellS + lineW * 1.5,
    cellS - lineW,
    cellS - lineW
  );
  ctx.fill();

  if (shouldSolveMaze && stack.length === 0 && !mazeCreated) {
    grid.forEach((cell) => {
      cell.isVisited = false;
      cell.grid = grid;
    });
    solveCurrent = grid[getIndex(start)];
    solveCurrent.isVisited = true;
    solveCurrent.weight = 1;
    queue.unshift(solveCurrent);
    mazeCreated = true;
  }

  if (shouldSolveMaze && mazeCreated) {
    solveMaze();
  }
};

const drawShell = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.beginPath();
      ctx.lineWidth = lineW;
      ctx.strokeStyle = 'white';
      ctx.lineCap = 'square';
      ctx.strokeRect(xOffset, lineW, maxW, maxH);

      if (row !== rows - 1) {
        //right
        ctx.moveTo(col * cellS + xOffset, row * cellS + cellS + lineW);
        ctx.lineTo((col + 1) * cellS + xOffset, row * cellS + cellS + lineW);
      }

      if (col !== cols - 1) {
        //down
        ctx.moveTo((col + 1) * cellS + xOffset, row * cellS + lineW);
        ctx.lineTo((col + 1) * cellS + xOffset, (row + 1) * cellS + lineW);
      }

      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(canvas.width * 0.5 - 220, cellS * 0.5 - 30, 440, 50);

  ctx.beginPath();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.font = '24px serif';
  ctx.fillText(
    'click to place start, ctrl+click to place end',
    canvas.width * 0.5,
    cellS * 0.5
  );

  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
  ctx.fillRect(start[0] * cellS, start[1] * cellS, cellS, cellS);
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.fillRect(end[0] * cellS, end[1] * cellS, cellS, cellS);
};

const solveMaze = () => {
  ctx.beginPath();
  ctx.strokeStyle = 'green';
  grid
    .filter((el) => el.weight > 0)
    .forEach((cell) => {
      grid
        .filter((el) => el.weight === cell.weight + 1)
        .forEach((el) => {
          if (
            (Math.abs(cell.col - el.col) === 0 ||
              Math.abs(cell.col - el.col) === 1) &&
            (Math.abs(cell.row - el.row) === 0 ||
              Math.abs(cell.row - el.row) === 1)
          ) {
            ctx.moveTo(cell.centerX, cell.centerY);
            ctx.lineTo(el.centerX, el.centerY);
          }
        });
    });
  ctx.stroke();

  if (solved) {
    calculatePath();
  }

  if (!solved) {
    if (solveCurrent.index === getIndex(end)) {
      solved = true;
      endCurrent = grid[getIndex(end)];
      console.log('found end');
      return;
    }

    if (solveCurrent) {
      solveNext = solveCurrent.getAdjacent(false);
    }

    if (solveNext) {
      solveNext.forEach((node) => {
        node.isVisited = true;
        node.weight = solveCurrent.weight + 1;
        queue.unshift(node);
      });
      solveCurrent = solveNext[0];
    }
  }

  if (queue.length) {
    solveCurrent = queue.pop();
  } else if (!solved) {
    solved = true;
    console.log('no exit');
  }
};

const drawPath = (arr) => {
  ctx.beginPath();
  ctx.lineWidth = cellS * 0.2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,0,0,1)';
  arr.forEach((path, key) => {
    if (key > 1) {
      ctx.moveTo(
        arr[key - 1].col * cellS + cellS * 0.5,
        arr[key - 1].row * cellS + cellS * 0.5
      );
      ctx.lineTo(
        path.col * cellS + cellS * 0.5,
        path.row * cellS + cellS * 0.5
      );
    }
  });
  ctx.stroke();
};

const calculatePath = () => {
  if (endCurrent !== grid[getIndex(start)]) {
    const adjecent = endCurrent.getAdjacent(false, true);

    if (adjecent) {
      ctx.beginPath();
      adjecent.forEach((cell) => {
        if (cell.weight + 1 === endCurrent.weight) {
          finishedPathArr.push(endCurrent);
          endCurrent = cell;
        }
      });
      drawPath(finishedPathArr);
    }
  } else {
    drawPath(finishedPathArr);
  }
};

const animate = () => {
  if (startGeneration) {
    for (let i = 0; i < speed; i++) {
      drawMaze();
    }
  } else {
    drawShell();
  }
  requestAnimationFrame(animate);
};
requestAnimationFrame(animate);

const regenerate = () => {
  finishedPathArr = [];

  generateMaze();
  current = grid[getIndex(start)];
  stack.push(current);
  endCurrent = grid[getIndex(end)];

  queue = [];
  mazeCreated = false;
  solved = false;

  grid.forEach((cell) => {
    cell.isVisited = false;
    cell.grid = grid;
  });

  solveCurrent = grid[getIndex(start)];
  solveCurrent.isVisited = true;
  solveCurrent.weight = 1;
  queue.unshift(solveCurrent);
};

const clearBoard = () => {
  startGeneration = false;
};

const solveMazeCallback = () => {
  shouldSolveMaze = true;
};

regenerateBtn.addEventListener('click', regenerate);
clearBtn.addEventListener('click', clearBoard);
solveBtn.addEventListener('click', solveMazeCallback);
// manualFramesBtn.addEventListener('click', (e) => {
//   if (e.ctrlKey) {
//     for (let i = 0; i < 4; i++) {
//       animate();
//     }
//   } else {
//     animate();
//   }
// });

let step = 1;

speedBtn.addEventListener('click', (e) => {
  speed += step;
  if (speed === 4 || speed === 1) {
    step = -step;
  }

  speedBtn.querySelector('span').innerHTML = speed;
});

canvas.addEventListener('click', (e) => {
  if (!startGeneration) {
    const colNo = Math.floor(
      (e.clientX - canvas.getBoundingClientRect().x) / cellS
    );
    const rowNo = Math.floor(
      (e.clientY - canvas.getBoundingClientRect().y) / cellS
    );

    if (e.ctrlKey) {
      end[0] = colNo;
      end[1] = rowNo;
    } else {
      start[0] = colNo;
      start[1] = rowNo;
    }
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!startGeneration) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
});
