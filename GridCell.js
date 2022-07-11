const randomIntFromInterval = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
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
    this.index = this.col + this.row * this.cols;
    this.wallsWidth = lineWidth;
    this.walls = [true, true];
    this.isVisited = false;
    this.weight = 0;
  }

  getIndex(col, row) {
    if (col < 0 || row < 0 || col > this.cols - 1 || row > this.rows - 1) {
      return -1;
    }
    return col + row * this.cols;
  }

  getAdjacent(onlyOne = true, weights = false) {
    const adjecent = [];

    const top = this.grid[this.getIndex(this.col, this.row - 1)];
    const right = this.grid[this.getIndex(this.col + 1, this.row)];
    const bottom = this.grid[this.getIndex(this.col, this.row + 1)];
    const left = this.grid[this.getIndex(this.col - 1, this.row)];

    if (top) {
      if (weights) {
        adjecent.push(top);
      } else if (!top.isVisited && (onlyOne ? true : top.walls[1] === false)) {
        adjecent.push(top);
      }
    }

    if (right) {
      if (weights) {
        adjecent.push(right);
      } else if (
        !right.isVisited &&
        (onlyOne ? true : this.walls[0] === false)
      ) {
        adjecent.push(right);
      }
    }

    if (bottom) {
      if (weights) {
        adjecent.push(bottom);
      } else if (
        !bottom.isVisited &&
        (onlyOne ? true : this.walls[1] === false)
      ) {
        adjecent.push(bottom);
      }
    }

    if (left) {
      if (weights) {
        adjecent.push(left);
      } else if (
        !left.isVisited &&
        (onlyOne ? true : left.walls[0] === false)
      ) {
        adjecent.push(left);
      }
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
    this.ctx.fillText(
      this.weight,
      this.col * this.cellS + this.cellS * 0.5,
      this.row * this.cellS + this.cellS * 0.5 + 8
    );
  }

  joinLine() {
    this.ctx.lineTo(
      this.col * this.cellS + this.cellS * 0.5,
      this.row * this.cellS + this.cellS * 0.5
    );
  }

  display(color) {
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      this.col * this.cellS + this.wallsWidth * 0.5 + this.xOffset,
      this.row * this.cellS + this.wallsWidth * 0.5,
      this.cellS - this.wallsWidth,
      this.cellS - this.wallsWidth
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
