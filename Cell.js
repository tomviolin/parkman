class Cell {
    constructor(wall, food, x, y) {
        this.wall = wall;
        this.food = food;
        this.pos = createVector(x, y);
        if (food)
            this.r = cellWidth / 2;
        else this.r = cellWidth / 2;
    }

    shown() {
        if (this.food) {
            fill(255);
            ellipseMode(CENTER);
            ellipse(this.pos.x, this.pos.y, this.r, this.r);
        } else if (this.wall) {
            fill(0, 0, 255);
            noStroke();
            rect(this.pos.x, this.pos.y, cellWidth, cellHeight);
        }
    }

}
