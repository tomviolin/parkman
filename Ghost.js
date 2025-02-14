class Ghost {
    constructor(sx, sy, x, y) {
        this.r = cellWidth * .5;
        this.imgIndex = createVector(sx, sy);
        //posizione reale
        this.pos = createVector(x, y);
        //posizione nella griglia
        this.currentCell = createVector(Math.floor(this.pos.x / cellWidth), Math.floor(this.pos.y / cellHeight));
        this.virtualPos = createVector(14, 24);
        //direzione
        this.dir = createVector(0, 0);
        this.commands = []
        this.flag = 0;
        this.form = 0;
	this.paniclevel = 1.14;
    }

    changeForm() {
        this.flag = 0;
        this.form = ((this.form + 1) % 7);
    }

    randomDir() {
        let temp = (int)(random(4));
        if (temp == 0) this.addInstruction(-1, 0);
        else if (temp == 1) this.addInstruction(1, 0);
        else if (temp == 2) this.addInstruction(0, -1);
        else if (temp == 3) this.addInstruction(0, 1);
    }

    chooseDir() {
        let bias = pacman.speed > this.paniclevel?-1:1;
	print('pacman.speed='+pacman.speed+'  bias: '+bias);
        if (this.pos.x == pacman.pos.x) {
            if (pacman.pos.y > this.pos.y &&
                !terrain.wall(this.currentCell.y + 1*bias,this.currentCell.x)) {
                this.setDir(0, 1*bias);
            } else if (pacman.pos.y < this.pos.y &&
                !terrain.wall(this.currentCell.y - 1*bias,this.currentCell.x)) {
                this.setDir(0, -1*bias)
            } else this.randomDir();
        } else if (this.pos.y == pacman.pos.y) {
            if (pacman.pos.x > this.pos.x &&
                !terrain.wall(this.currentCell.y,this.currentCell.x + 1*bias)) {
                this.setDir(1*bias, 0);
            } else if (pacman.pos.x < this.pos.x &&
                !terrain.wall(this.currentCell.y,this.currentCell.x - 1*bias)) {
                this.setDir(-1*bias, 0);
            } else this.randomDir();
        } else this.randomDir();
    }

    move() {
        this.chooseDir();
        if (this.pos.x + this.r >= CANVAS_WIDTH && this.dir.x == 1) {
            this.pos.x += this.dir.x;
            if (this.pos.x - this.r >= CANVAS_WIDTH) {
                this.pos.x = this.r;
            }
        } else if (this.pos.x - this.r <= 0 && this.dir.x == -1) {
            this.pos.x += this.dir.x;
            if (this.pos.x + this.r <= 0)
                this.pos.x = CANVAS_WIDTH - this.r;
        } else {
            let nextCommand;
            if (!this.wall()) {
                this.pos.x += this.dir.x;
                this.pos.y += this.dir.y;
            } else {
                if (this.commands.length != 0)
                    nextCommand = this.commands.pop();
                else {
                    nextCommand = createVector(0, 0);
                }
                this.setDir(nextCommand.x, nextCommand.y);
                this.pos.x = this.currentCell.x * cellWidth + cellWidth / 2;
                this.pos.y = this.currentCell.y * cellHeight + cellHeight / 2;
            }
        }
    }
    setPos(x, y) {
        this.pos.x = x;
        this.pos.y = y;
        this.currentCell.x = Math.floor(this.pos.x / cellWidth);
        this.currentCell.y = Math.floor(this.pos.y / cellHeight);
    }
    wall() {
        if (this.dir.x == 1) {
            this.virtualPos.x = Math.floor((this.pos.x + this.r) / cellWidth);
            this.virtualPos.y = Math.floor((this.pos.y - this.r) / cellHeight);
            this.pos.y = this.currentCell.y * cellHeight + cellHeight / 2;
        } else if (this.dir.x == -1) {
            this.virtualPos.x = Math.floor((this.pos.x - this.r) / cellWidth);
            this.virtualPos.y = Math.floor((this.pos.y - this.r) / cellHeight);
            this.pos.y = this.currentCell.y * cellHeight + cellHeight / 2;
        } else if (this.dir.y == 1) {
            this.virtualPos.y = Math.floor((this.pos.y + this.r) / cellHeight);
            this.virtualPos.x = Math.floor((this.pos.x - this.r) / cellWidth);
            this.pos.x = this.currentCell.x * cellWidth + cellWidth / 2;
        } else if (this.dir.y == -1) {
            this.virtualPos.y = Math.floor((this.pos.y - this.r) / cellHeight);
            this.virtualPos.x = Math.floor((this.pos.x - this.r) / cellWidth);
            this.pos.x = this.currentCell.x * cellWidth + cellWidth / 2;
        }
        if (terrain.wall(this.virtualPos.y,this.virtualPos.x)) {
            return true;
        }
        return false;

    }

    addInstruction(xdir, ydir) {
        this.commands.push(createVector(xdir, ydir));
    }

    clearCommands() {
        if (this.commands.length != 0)
            for (let i = this.commands.length; i > 0; i--)
                this.commands.pop();
    }

    setDir(xdir, ydir) {
        this.dir.x = xdir;
        this.dir.y = ydir;

        if (xdir == 0 && ydir == 0) {
            this.clearCommands();
        }
    }

    show() {
        this.currentCell.x = Math.floor(this.pos.x / cellWidth);
        this.currentCell.y = Math.floor(this.pos.y / cellHeight);
        this.flag++;
        if (this.flag == 10)
            this.changeForm();
        let xIndex = this.imgIndex.x + this.form;
	let yIndex = this.imgIndex.y;
        imageMode(CENTER);
	if (pacman.speed > this.paniclevel) {
		xIndex = 8;
		yIndex = 9;
	}
        image(sheetImage, this.pos.x, this.pos.y, this.r * 2.5, this.r * 2.5,
            imgWidth * xIndex, imgHeight * yIndex, imgWidth, imgHeight);
    }

}
