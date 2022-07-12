// Import stylesheets
import './style.css';
import { GridCell } from './GridCell';

const drawTarget = (ctx, color, size, lineW, col, row) => {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.fillRect(
    col * size + lineW * 1.5,
    row * size + lineW * 1.5,
    size - lineW,
    size - lineW
  );
};

const isMobile = window.matchMedia('(max-width: 600px)').matches;
const lineW = isMobile ? 2 : 4;
let numberOfCellsHor = isMobile ? 10 : 42;

// const cellS = 40;
// const cols = 45;
// const rows = 22;
const cellS = Math.floor(window.innerWidth / numberOfCellsHor);
const cols = Math.floor((window.innerWidth - cellS) / cellS);
const rows = Math.floor((window.innerHeight - cellS) / cellS);
const maxW = cols * cellS;
const maxH = rows * cellS;
const canvas = document.querySelector('.main-canvas');
const ctx = canvas.getContext('2d');
const bgcCanvas = document.querySelector('.bgc-canvas');
const bgcCtx = bgcCanvas.getContext('2d');

let speed = 1;
let stack = [];
let grid = [];
let startGeneration = false;
let shouldSolveMaze = false;
let solved = false;
let helperLineOp = 1;
let mainPathOp = 1;
const start = [0, 0];
const end = [cols - 1, rows - 1];
let manualControls = false;

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

canvas.width = bgcCanvas.width = maxW + lineW * 2;
canvas.height = bgcCanvas.height = maxH + lineW * 2;

let xOffset = (canvas.width - maxW) * 0.5;

window.addEventListener('resize', () => {
  canvas.width = bgcCanvas.width = maxW + lineW * 2;
  canvas.height = bgcCanvas.height = maxH + lineW * 2;
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

    if (current.index !== getIndex(start) && stack.length > 0) {
      current.display('orange');
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
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'orange';
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

    grid.forEach((rect) => {
      rect.draw();
    });
    ctx.strokeRect(xOffset, lineW, maxW, maxH);

    //start
    const targetStartCell = grid[getIndex(start)];
    drawTarget(
      ctx,
      'rgba(0, 255, 0, 0.3)',
      cellS,
      lineW,
      targetStartCell.col,
      targetStartCell.row
    );

    //end
    const targetEndCell = grid[getIndex(end)];
    drawTarget(
      ctx,
      'rgba(255, 0, 0, 0.3)',
      cellS,
      lineW,
      targetEndCell.col,
      targetEndCell.row
    );
  }

  if (stack.length === 0 && !mazeCreated) {
    mazeCreated = true;
    grid.forEach((cell) => {
      cell.isVisited = false;
    });
    solveCurrent = grid[getIndex(start)];
    solveCurrent.isVisited = true;
    solveCurrent.weight = 1;
    queue.unshift(solveCurrent);
    bgcCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
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

  drawTarget(ctx, 'rgba(0, 255, 0, 0.3)', cellS, lineW, start[0], start[1]);
  drawTarget(ctx, 'rgba(255, 0, 0, 0.3)', cellS, lineW, end[0], end[1]);
};

const solveMaze = () => {
  if (helperLineOp > 0) {
    grid
      .filter((el) => el.weight > 0)
      .forEach((el) => {
        el.display(`rgba(230, 200, 250, ${helperLineOp * 0.5})`);
      });

    // ctx.beginPath();
    // ctx.lineWidth = 1;
    // ctx.strokeStyle = `rgba(240, 230, 20, ${helperLineOp})`;
    // grid
    //   .filter((el) => el.weight > 0)
    //   .forEach((cell) => {
    //     grid
    //       .filter((el) => el.weight === cell.weight + 1)
    //       .forEach((el) => {
    //         if (
    //           (Math.abs(cell.col - el.col) === 0 ||
    //             Math.abs(cell.col - el.col) === 1) &&
    //           (Math.abs(cell.row - el.row) === 0 ||
    //             Math.abs(cell.row - el.row) === 1)
    //         ) {
    //           ctx.moveTo(cell.centerX, cell.centerY);
    //           ctx.lineTo(el.centerX, el.centerY);
    //         }
    //       });
    //   });
    // ctx.stroke();
  }

  if (solved) {
    calculatePath();
    if (helperLineOp < 0.05) {
      helperLineOp = 0;
    } else {
      helperLineOp *= 0.97;
    }
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
    }
  }

  if (queue.length) {
    // pop to go to each branch interchangeably
    solveCurrent = queue.pop();

    // shift to go with one branch as long as posible before changing to new branch
    // solveCurrent = queue.shift();
  } else if (!solved) {
    solved = true;
    console.log('no exit');
  }
};

const drawPath = (arr) => {
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(0,255,0,${mainPathOp})`;
  arr.forEach((path, key) => {
    if (key > 1) {
      ctx.moveTo(
        arr[key - 1].col * cellS + cellS * 0.5 + lineW * 0.5,
        arr[key - 1].row * cellS + cellS * 0.5 + lineW * 0.5
      );
      ctx.lineTo(
        path.col * cellS + cellS * 0.5 + lineW * 0.5,
        path.row * cellS + cellS * 0.5 + lineW * 0.5
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
  if (!manualControls) {
    requestAnimationFrame(animate);
  }
};
requestAnimationFrame(animate);

const regenerate = () => {
  bgcCtx.clearRect(0, 0, canvas.width, canvas.height);
  helperLineOp = 1;
  finishedPathArr = [];

  generateMaze();
  current = grid[getIndex(start)];
  stack.push(current);
  endCurrent = grid[getIndex(end)];

  queue = [];
  mazeCreated = false;
  solved = false;

  solveCurrent = grid[getIndex(start)];
  solveCurrent.isVisited = true;
  solveCurrent.weight = 1;
  queue.unshift(solveCurrent);
};

const clearBoard = () => {
  bgcCtx.clearRect(0, 0, canvas.width, canvas.height);
  startGeneration = false;
};

const solveMazeCallback = () => {
  // queue = [];
  // solved = false;
  // helperLineOp = 1;
  // finishedPathArr = [];

  // grid.forEach((cell) => {
  //   cell.weight = 0;
  // });

  // solveCurrent = grid[getIndex(start)];
  // solveCurrent.isVisited = true;
  // solveCurrent.weight = 1;
  // queue.unshift(solveCurrent);
  shouldSolveMaze = true;
};

regenerateBtn.addEventListener('click', regenerate);
clearBtn.addEventListener('click', clearBoard);
solveBtn.addEventListener('click', solveMazeCallback);
manualFramesBtn.addEventListener('click', (e) => {
  if (e.ctrlKey) {
    for (let i = 0; i < 4; i++) {
      animate();
    }
  } else {
    animate();
  }
});

let step = 1;

speedBtn.addEventListener('click', (e) => {
  // speed += step;
  // if (speed === 4 || speed === 1) {
  //   step = -step;
  // }

  speed += step;
  if (speed === 5) {
    speed = 1;
  }

  speedBtn.querySelector('span').innerHTML = speed;
});

manualFramesCheckbox.addEventListener('change', (e) => {
  if (manualFramesCheckbox.checked) {
    manualControls = true;
    manualFramesBtn.removeAttribute('disabled');
  } else {
    manualControls = false;
    animate();
    manualFramesBtn.setAttribute('disabled', true);
  }
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
