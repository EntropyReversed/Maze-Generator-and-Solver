const randomIntFromInterval = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getIndexC = (col, row, cols, rows) => {
  if (col < 0 || row < 0 || col > cols - 1 || row > rows - 1) {
    return -1;
  }
  return col + row * cols;
};

class GridCell {
  constructor(ctx, grid, cols, rows, col, row, cellS, lineWidth, xOffset) {
    this.ctx = ctx;
    this.grid = grid;
    this.cols = cols;
    this.rows = rows;
    this.cellS = cellS;
    this.xOffset = xOffset;
    this.col = col;
    this.row = row;
    this.centerX = this.col * this.cellS + this.cellS * 0.5;
    this.centerY = this.row * this.cellS + this.cellS * 0.5;
    this.index = this.col + this.row * this.cols;
    this.wallsWidth = lineWidth;
    this.walls = [true, true];
    this.isVisited = false;
    this.top;
    this.right;
    this.bottom;
    this.left;
    this.weight = 0;
  }

  setAdjecent() {
    this.top =
      this.grid[getIndexC(this.col, this.row - 1, this.cols, this.rows)];
    this.right =
      this.grid[getIndexC(this.col + 1, this.row, this.cols, this.rows)];
    this.bottom =
      this.grid[getIndexC(this.col, this.row + 1, this.cols, this.rows)];
    this.left =
      this.grid[getIndexC(this.col - 1, this.row, this.cols, this.rows)];
  }

  getAdjacent(onlyOne = true, weights = false) {
    const adjecent = [];

    if (
      this.top &&
      (weights ||
        (!this.top.isVisited && (onlyOne ? true : this.top.walls[1] === false)))
    ) {
      adjecent.push(this.top);
    }

    if (
      this.right &&
      (weights ||
        (!this.right.isVisited && (onlyOne ? true : this.walls[0] === false)))
    ) {
      adjecent.push(this.right);
    }

    if (
      this.bottom &&
      (weights ||
        (!this.bottom.isVisited && (onlyOne ? true : this.walls[1] === false)))
    ) {
      adjecent.push(this.bottom);
    }

    if (
      this.left &&
      (weights ||
        (!this.left.isVisited &&
          (onlyOne ? true : this.left.walls[0] === false)))
    ) {
      adjecent.push(this.left);
    }

    if (adjecent.length > 0) {
      return onlyOne
        ? adjecent[randomIntFromInterval(0, adjecent.length - 1)]
        : adjecent;
    } else {
      return undefined;
    }
  }

  printWeight() {
    this.ctx.beginPath();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px serif';
    this.ctx.fillText(this.weight, this.centerX, this.centerY + 8);
  }

  joinLine() {
    this.ctx.lineTo(this.centerX, this.centerY);
  }

  display(color, inset = false) {
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      this.col * this.cellS + this.wallsWidth * (inset ? 0.5 : 1.5),
      this.row * this.cellS + this.wallsWidth * (inset ? 0.5 : 1.5),
      this.cellS - (inset ? 0 : this.wallsWidth),
      this.cellS - (inset ? 0 : this.wallsWidth)
    );
  }

  destroyWalls(next) {
    if (this.col === next.col) {
      if (this.row < next.row) {
        // down
        this.walls[1] = false;
        return;
      }
      // up
      next.walls[1] = false;
      return;
    }

    if (this.row === next.row) {
      if (this.col < next.col) {
        // right
        this.walls[0] = false;
        return;
      }
      // left
      next.walls[0] = false;
    }
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.wallsWidth;
    this.ctx.strokeStyle = 'white';
    this.ctx.lineCap = 'square';

    if (this.row !== this.rows - 1 && this.walls[1]) {
      //right
      this.ctx.moveTo(
        this.col * this.cellS + this.xOffset,
        this.row * this.cellS + this.cellS + this.wallsWidth
      );
      this.ctx.lineTo(
        (this.col + 1) * this.cellS + this.xOffset,
        this.row * this.cellS + this.cellS + this.wallsWidth
      );
    }

    if (this.col !== this.cols - 1 && this.walls[0]) {
      //down
      this.ctx.moveTo(
        (this.col + 1) * this.cellS + this.xOffset,
        this.row * this.cellS + this.wallsWidth
      );
      this.ctx.lineTo(
        (this.col + 1) * this.cellS + this.xOffset,
        (this.row + 1) * this.cellS + this.wallsWidth
      );
    }

    this.ctx.stroke();
  }
}

export { GridCell };
