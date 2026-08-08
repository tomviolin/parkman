class Ghost {
    constructor(sx, sy, x, y) {
        this.org_sx = sx;
        this.org_sy = sy;
        this.org_x = x;
        this.org_y = y;
        this.setupGhost();
        this.panicFlag = 0;
    }

    setupGhost() {
        this.r = cellWidth * .5;
        // ghost speed: 1.1 = 10% faster than Pacman's base speed of 1.
        // Ghosts move at a fixed multiple of dir per move() call while
        // Pacman uses speed*dt for frame-rate independence; here we
        // mirror that by reading pacman's speed at the time of the move.
        this.speed = 1.1;
        // timestamp of the last move() call; used to scale motion by
        // the same frame-time normalization Pacman uses (dt = ms/1000*60)
        // so ghost speed can be specified relative to Pacman's
        // per-second speed rather than pixels-per-frame at the game's
        // 120 fps rate, which was ~2x off.
        this.lastmove = 0;
        // when pacman eats a power pellet, ghosts panic and slow down
        // so he can chase them; 0.6 * Pacman baseline makes the afraid
        // (blue) ghosts definitely catchable while Pacman is powered up.
        this.panicSpeed = 0.6;
        this.imgIndex = createVector(this.org_sx, this.org_sy);
        //posizione reale // in english: real position
        this.pos = createVector(this.org_x, this.org_y);
        //posizione nella griglia // in english: position in the grid
        this.currentCell = createVector(Math.floor(this.pos.x / cellWidth), Math.floor(this.pos.y / cellHeight));
        this.virtualPos = createVector(14, 24);
        //direzione // in english: direction
        this.dir = createVector(0, 0);
        this.commands = []
        this.flag = 0;
        this.form = 0;
    	this.paniclevel = 1.17;
        this.warnlevel = 1.12;
    }

    // reset the dt-normalization clock so the next move() computes a
    // small `elapsed` instead of charging forward by the entire pause
    // interval.  Called by game.setState() whenever we (re) enter
    // RUNNING — including the unpause transition — so a long pause
    // doesn't cause ghosts to teleport through walls on resume.
    unfreeze() {
        this.lastmove = Date.now();
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
        let bias = pacman.speed > this.warnlevel?-1:1;
	    //print('pacman.speed='+pacman.speed+'  bias: '+bias);
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
        // frame-rate normalization copied from Pacman: dt is the
        // number of 60fps-equivalent frames elapsed since the last
        // move().  This makes ghost motion scale to wall-clock seconds
        // (a 1.1 multiplier really is 10% faster than Pacman at the
        // same speed), rather than pegging to the 120 fps frame rate,
        // which was making ghosts ~2x as fast as intended.
        let thismove = Date.now();
        if (this.lastmove === 0) this.lastmove = thismove;
        let elapsed = thismove - this.lastmove;
        this.lastmove = thismove;
        let dt = (elapsed / 1000) * 60;
        // when pacman.speed > this.warnlevel (a power pellet has bumped
        // him above baseline), ghosts panic and slow down.  The
        // panicSpeed of 0.6 is plenty slow relative to Pacman at speed=3
        // so he can chase and eat them easily.  While Pacman is at
        // baseline we use this.speed (1.1) so ghosts are 10% faster.
        let isFrightened = pacman.speed > this.warnlevel;
        let speedMult = isFrightened ? this.panicSpeed : this.speed;
        let step = speedMult * Math.max(1, pacman.speed) * dt;
        if (this.pos.x + this.r >= CANVAS_WIDTH && this.dir.x == 1) {
            this.pos.x += this.dir.x * step;
            if (this.pos.x - this.r >= CANVAS_WIDTH) {
                this.pos.x = this.r;
            }
        } else if (this.pos.x - this.r <= 0 && this.dir.x == -1) {
            this.pos.x += this.dir.x * step;
            if (this.pos.x + this.r <= 0)
                this.pos.x = CANVAS_WIDTH - this.r;
        } else {
            let nextCommand;
            if (!this.wall()) {
                this.pos.x += this.dir.x * step;
                this.pos.y += this.dir.y * step;
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
		    xIndex = 0;
		    yIndex = 8;
            this.panicFlag = 2;
	    } else if (pacman.speed > this.warnlevel) {
            if (Date.now() % 1000 > 500) {
                xIndex = 2;
                yIndex = 8;
            } else {
                xIndex = 0;
                yIndex = 8;
            }
            this.panicFlag = 1;
        } else {
            if (this.panicFlag == 1) {
                this.clearCommands();
                this.panicFlag = 0;
                s_power.stop();
                s_retreat.stop();
                s_siren1.stop();
                s_siren2.stop();
                s_siren1.loop();
                s_shaky.loop();
                // when Pacman's power pellet wears off, restart the ghost
                // entry countdown so any still-in-base ghosts come out.
                if (typeof game !== 'undefined' && game.startGhostSpawn) {
                    game.startGhostSpawn();
                }
            }
            this.panicFlag = 0;
        }
        image(sheetImage, this.pos.x, this.pos.y, this.r * 3.5, this.r * 3.5,
            imgWidth * xIndex, imgHeight * yIndex, imgWidth, imgHeight);
    }

}
