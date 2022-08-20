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

let cellS;
let cols;
let rows;
let maxW;
let maxH;
let start;
let end;
const canvas = document.querySelector('.main-canvas');
const ctx = canvas.getContext('2d');
const bgcCanvas = document.querySelector('.bgc-canvas');
const bgcCtx = bgcCanvas.getContext('2d');
const colors = {
  maze: 'white',
  start: 'rgba(0, 255, 0, 0.3)',
  end: 'rgba(255, 0, 0, 0.3)',
  solver: '230, 200, 250',
  solved: '0, 255, 0',
  solverRay: 'red',
};

const setUpSizes = (cellSize, c, r) => {
  cellS = cellSize;
  cols = c;
  rows = r;
  maxW = cols * cellS;
  maxH = rows * cellS;
  start = [0, 0];
  end = [cols - 1, rows - 1];

  cellSizeInput.value = cellS;
  colsInput.value = cols;
  rowsInput.value = rows;
};

setUpSizes(60, 10, 10);

let speed = 1;
let stack = [];
let grid = [];
let startGeneration = false;
let shouldSolveMaze = false;
let solved = false;
let solverLineOp = 1;
let mainPathOp = 1;
let manualControls = false;

let finishedPathArr = [];

let mazeCreated = false;
let next;
let current;

let solveCurrent;

let endCurrent;
let mazeImage = new Image();

const getIndex = (coords) => {
  return coords[0] + coords[1] * cols;
};

canvas.width = bgcCanvas.width = maxW + lineW * 2;
canvas.height = bgcCanvas.height = maxH + lineW * 2;

let xOffset = (canvas.width - maxW) * 0.5;

const reinitMaze = () => {
  canvas.width = bgcCanvas.width = maxW + lineW * 2;
  canvas.height = bgcCanvas.height = maxH + lineW * 2;
  xOffset = (canvas.width - maxW) * 0.5;

  if (mazeImage) {
    bgcCtx.clearRect(0, 0, canvas.width, canvas.height);
    bgcCtx.drawImage(mazeImage, 0, 0, canvas.width, canvas.height);

    if (grid[getIndex(start)]) {
      // start
      const targetStartCell = grid[getIndex(start)];
      drawTarget(
        bgcCtx,
        colors.start,
        cellS,
        lineW,
        targetStartCell.col,
        targetStartCell.row
      );
    }

    if (grid[getIndex(end)]) {
      //end
      const targetEndCell = grid[getIndex(end)];
      drawTarget(
        bgcCtx,
        colors.end,
        cellS,
        lineW,
        targetEndCell.col,
        targetEndCell.row
      );
    }
  }
};

const initiateMaze = () => {
  stack = [];
  grid = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid.push(
        new GridCell(ctx, grid, cols, rows, col, row, cellS, lineW, xOffset)
      );
    }
  }

  grid.forEach((cell) => {
    cell.setAdjecent();
  });

  startGeneration = true;
  shouldSolveMaze = false;
};

const drawMaze = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!mazeCreated) {
    bgcCtx.clearRect(0, 0, canvas.width, canvas.height);
    current.isVisited = true;

    if (current.index !== getIndex(start) && stack.length > 0) {
      current.display('orange');
    }

    if (stack.length) {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'orange';
      ctx.moveTo(stack[0].centerX, stack[0].centerY);
      stack.forEach((rect, key) => {
        rect.joinLine();
      });
      ctx.lineTo(current.centerX, current.centerY);
      ctx.stroke();
    }

    grid.forEach((rect) => {
      rect.draw();
    });

    next = current.getAdjacent();

    if (next) {
      next.isVisited = true;
      stack.push(current);
      current.destroyWalls(next);
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    }

    ctx.strokeRect(xOffset, lineW, maxW, maxH);

    //start
    const targetStartCell = grid[getIndex(start)];

    drawTarget(
      bgcCtx,
      colors.start,
      cellS,
      lineW,
      targetStartCell.col,
      targetStartCell.row
    );

    //end
    const targetEndCell = grid[getIndex(end)];
    drawTarget(
      bgcCtx,
      colors.end,
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
    mazeImage.src = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    bgcCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  }

  if (shouldSolveMaze && mazeCreated) {
    solveMaze();
  }
};

const drawShell = () => {
  bgcCtx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      bgcCtx.beginPath();
      bgcCtx.lineWidth = lineW;
      bgcCtx.strokeStyle = 'white';
      bgcCtx.lineCap = 'square';
      bgcCtx.strokeRect(xOffset, lineW, maxW, maxH);

      if (row !== rows - 1) {
        //right
        bgcCtx.moveTo(col * cellS + xOffset, row * cellS + cellS + lineW);
        bgcCtx.lineTo((col + 1) * cellS + xOffset, row * cellS + cellS + lineW);
      }

      if (col !== cols - 1) {
        //down
        bgcCtx.moveTo((col + 1) * cellS + xOffset, row * cellS + lineW);
        bgcCtx.lineTo((col + 1) * cellS + xOffset, (row + 1) * cellS + lineW);
      }

      bgcCtx.stroke();
    }
  }
  bgcCtx.beginPath();
  bgcCtx.fillStyle = 'rgba(0,0,0,0.5)';
  bgcCtx.fillRect(canvas.width * 0.5 - 220, cellS * 0.5 - 30, 440, 50);

  bgcCtx.beginPath();
  bgcCtx.textAlign = 'center';
  bgcCtx.fillStyle = 'white';
  bgcCtx.font = '24px serif';
  bgcCtx.fillText(
    'click to place start, ctrl+click to place end',
    canvas.width * 0.5,
    cellS * 0.5
  );

  drawTarget(bgcCtx, colors.start, cellS, lineW, start[0], start[1]);
  drawTarget(bgcCtx, colors.end, cellS, lineW, end[0], end[1]);
};

const solveMaze = () => {
  if (solverLineOp > 0) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${colors.solver}, ${solverLineOp})`;
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
        ctx.stroke();
        cell.display(`rgba(${colors.solver}, ${solverLineOp * 0.2})`, true);
        // cell.printWeight()
      });
  }

  if (solved) {
    calculatePath();
    if (solverLineOp < 0.05) {
      solverLineOp = 0;
    } else {
      solverLineOp *= 0.97;
    }
  }

  if (!solved) {
    const arr = [];
    grid.forEach((cell) => {
      if (cell.weight > 0) {
        const adjecent = cell.getAdjacent(false);
        if (adjecent) {
          adjecent.forEach((adj) => {
            if (adj.index === getIndex(end)) {
              solved = true;
              endCurrent = grid[getIndex(end)];
              console.log('found end');
            }
            if (!adj.isVisited) {
              arr.push([adj, cell]);
            }
          });
        }
      }
    });
    if (arr) {
      arr.forEach((adj) => {
        adj[0].weight = adj[1].weight + 1;
        adj[0].isVisited = true;
      });
    }
  }
};

const drawPath = (arr) => {
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${colors.solved},${mainPathOp})`;
  arr.forEach((path, key) => {
    if (key > 0) {
      ctx.moveTo(arr[key - 1].centerX, arr[key - 1].centerY);
      ctx.lineTo(path.centerX, path.centerY);
    }
  });

  ctx.stroke();
  if (arr.length + 1 !== grid[getIndex(end)].weight) {
    ctx.beginPath();
    ctx.fillStyle = colors.solverRay;
    ctx.arc(
      arr[arr.length - 1].centerX,
      arr[arr.length - 1].centerY,
      cellS * 0.1,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = colors.solverRay;
  } else {
    ctx.strokeStyle = `rgb(${colors.solved})`;
  }
  ctx.beginPath();
  ctx.moveTo(arr[arr.length - 1].centerX, arr[arr.length - 1].centerY);
  ctx.lineTo(grid[getIndex(start)].centerX, grid[getIndex(start)].centerY);
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

window.addEventListener('resize', reinitMaze);

// on user input
const regenerateCallback = () => {
  bgcCtx.clearRect(0, 0, canvas.width, canvas.height);
  solverLineOp = 1;
  finishedPathArr = [];

  initiateMaze();
  current = grid[getIndex(start)];
  stack.push(current);
  endCurrent = grid[getIndex(end)];

  mazeCreated = false;
  solved = false;

  solveCurrent = grid[getIndex(start)];
  solveCurrent.isVisited = true;
  solveCurrent.weight = 1;
  if (manualControls && speed === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animate();
  }
};

const clearBoardCallback = () => {
  bgcCtx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startGeneration = false;
};

const solveMazeCallback = () => {
  if (mazeCreated) {
    solved = false;
    solverLineOp = 1;
    finishedPathArr = [];

    grid.forEach((cell) => {
      cell.weight = 0;
      cell.isVisited = false;
    });

    solveCurrent = grid[getIndex(start)];
    solveCurrent.isVisited = true;
    solveCurrent.weight = 1;
  }
  shouldSolveMaze = true;
};

const manualFramesCallback = (e) => {
  if (e.ctrlKey) {
    for (let i = 0; i < 4; i++) {
      animate();
    }
  } else {
    animate();
  }
};

const submitGridInfoCallback = (e) => {
  e.preventDefault();
  setUpSizes(+cellSizeInput.value, +colsInput.value, +rowsInput.value);
  reinitMaze();
  bgcCtx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startGeneration = false;
};

const speedRangeCallback = () => {
  speed = +speedRange.value;
  speedRange.setAttribute('data-value', speedRange.value);
};

const manualFramesCheckboxCallback = () => {
  if (manualFramesCheckbox.checked) {
    manualControls = true;
    manualFramesBtn.removeAttribute('disabled');
    speedRange.setAttribute('disabled', true);
    speedRange.value = 1;
    speed = speedRange.value;
  } else {
    manualControls = false;
    speedRange.value = +speedRange.dataset.value;
    speed = speedRange.value;
    manualFramesBtn.setAttribute('disabled', true);
    speedRange.removeAttribute('disabled');
    animate();
  }
};

const setStartEndCallback = (e) => {
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
};

regenerateBtn.addEventListener('click', regenerateCallback);
clearBtn.addEventListener('click', clearBoardCallback);
solveBtn.addEventListener('click', solveMazeCallback);
speedRange.addEventListener('input', speedRangeCallback);
manualFramesCheckbox.addEventListener('change', manualFramesCheckboxCallback);

manualFramesBtn.addEventListener('click', (e) => {
  manualFramesCallback(e);
});

submitGridInfo.addEventListener('click', (e) => {
  submitGridInfoCallback(e);
});

canvas.addEventListener('click', (e) => {
  setStartEndCallback(e);
});

canvas.addEventListener('mousemove', (e) => {
  if (!startGeneration) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
});
