// new approach:
//  Pacman will only store its position in x,y pixel coordinates
//  the grid position will be calculated from the pixel position
//  on the fly on-demand when needed
//  this will make it easier to do smooth movement
//  the grid position will not be stored in the pacman object
//  The Terrain object will be responsible for maintenance of
//  the cell grid and converting pixel coordinates to cell coordinates
//  and vice versa

class Pacman {
    constructor(i, j) {
        //posizione nel Canvas
        //in english: position in the canvas
        this.speed = 1;

        //this.count = 0;

        //posizione nella griglia // in english: position in the grid
        //indici nell'immagine sheet  in eglish: indices in the image sheet
        this.imgIndex = createVector(4, 3);
        //raggio
        this.r = cellWidth / 2.01;
        this.pos = terrain.cell_ij2pix(i, j);
        this.pos = createVector(this.pos.x + cellWidth / 2, this.pos.y + cellHeight / 2);
        //direzione
        this.dir = createVector(1, 0);
        //variabili per animare la morte di PacMan 
        //   in englsh: variables to animate PacMan's death
        this.open = 0;
        this.death = false;
        this.deathStage = 0;
        //if open is 0, the mouth is fully opened,
        //if it's 2, the mouth is semi closed
        this.medlevel = 250;
        this.lastmedcalc = Date.now();
        //variabili per lo spostamento in english: variables for movement
        this.commands = [];
        this.lastmove = 0;
        this.lastmouth = 0;
    }

    //questo metodo calcola il tremolio di PacMan
    //in english: this method calculates PacMan's tremor       
    trem() {
        let thistime = Date.now();
        let timesince = thistime - this.lastmedcalc;
        let thislevel = this.medlevel * Math.exp(-timesince * 0.0002);
        if (timesince > 1000) {
            this.medlevel = thislevel;
            this.lastmedcalc = thistime;
        }
        //print(thislevel);
        let tremlevel = max(0.003, (26 - thislevel) / 7);// * (random(this.speed) - this.speed / 2);
        //print(tremlevel);
        return max(tremlevel * 1.5, 0.00511);
    }
    //questo metodo mostra PacMan sullo schermo 
    //   in english: this method shows PacMan on the screen
    show() {
        s_shaky.setVolume(this.trem()*0.5);
        let k = exp(-this.trem()*0.09);
        s_siren1.setVolume(k);
        this.changeMouth();
        fill(255);
        if (this.dir.x > 0) {
            this.imgIndex.x = 4 + this.open;
        } else if (this.dir.x < 0) {
            this.imgIndex.x = 0 + this.open;
        } else if (this.dir.y > 0) {
            this.imgIndex.x = 5 + this.open;
        } else if (this.dir.y < 0) {
            this.imgIndex.x = 1 + this.open;
        }
        imageMode(CENTER);
        image(sheetImage, this.pos.x+(random(1)-0.5)*this.trem()*3,//+ cellWidth/2, 
            this.pos.y+(random(1)-0.5) * this.trem()*3,//+ cellHeight/2, 
            this.r * 2.5, this.r * 2.5,
            imgWidth * this.imgIndex.x, imgHeight * this.imgIndex.y, imgWidth, imgHeight);
    }
    unfreeze() {
        this.lastmove = Date.now();
    }
    move() {
        if (!doLoop) return;
        //////console.log("pacman.move()")
        let thismove = Date.now();
        if (this.lastmove === 0) this.lastmove = thismove;
        let elapsed = thismove - this.lastmove;
        this.lastmove = thismove;
        let dt = (elapsed / 1000) * 60;
        this.lastPos = this.pos.copy();
        // governor of speed
        if (this.speed * dt > min(cellWidth, cellHeight) / 2) {
            this.speed = min(cellWidth, cellHeight) / 2 / dt;
        }
        if (this.speed < 1) this.speed = 1;
        ////console.log(this.speed);
        ////console.log(this.dir);
        ////console.log(this.pos);
        //console.log(`${this.count}: pacman.move() speed: ${this.speed} dt: ${dt} pos: [${this.pos.x},${this.pos.y}] dir: [${this.dir.x},${this.dir.y}] `);
        this.count++;   
        // check for warp tunnel
        if (this.pos.x + this.r >= CANVAS_WIDTH && this.dir.x == 1) {
            // handle warp tunnel on right side
            this.pos.x += this.dir.x * dt;
            if (this.pos.x + this.r >= CANVAS_WIDTH) {
                this.pos.x = this.r;
            }
        } else if (this.pos.x - this.r <= 0 && this.dir.x == -1) {  
            // handle warp tunnel on left side
            this.pos.x += this.dir.x * dt;
            if (this.pos.x - this.r <= 0)
                this.pos.x = CANVAS_WIDTH - this.r;
        } else if (this.pos.y + this.r >= CANVAS_HEIGHT && this.dir.y == 1) {
            // handle warp tunnel on bottom side
            this.pos.y += this.dir.y * dt;
            if (this.pos.y + this.r >= CANVAS_WIDTH) {
                this.pos.y = this.r;
            }
        } else if (this.pos.y - this.r <= 0 && this.dir.y == -1) {
            // handle warp tunnel on top side
            this.pos.y += this.dir.y * dt;
            if (this.pos.y - this.r <= 0)
                this.pos.y = CANVAS_HEIGHT - this.r;
        }
        // normal motion (warping already handled)
        let thisCommand = this.dir.copy();
        // if there are commands, then:
        if (this.commands.length != 0) {
            //console.log(`*** RECEIVED COMMAND ${this.commands[0].x},${this.commands[0].y} ***`);
            // take the first command off the queue
            thisCommand = this.commands.shift();
            if (thisCommand.x == -this.dir.x && thisCommand.y == -this.dir.y && (this.dir.x != 0 || this.dir.y != 0)) {
                // *** SPECIAL CASE OF REVERSING COURSE ***
                //console.log('*** REVERSING COURSE ***');
                // if we are reversing course, just do it by reversing the direction
                // and then present next command as if it was the current command
                // first we must check if there is a next command
                if (this.commands.length != 0) {
                    thisCommand = this.commands.shift();
                    //console.log(`*** RECEIVED after-reverse COMMAND ${thisCommand.x},${thisCommand.y} ***`);
                }
                // here we are pretending that we were going the other direction all along, so that
                // the next piece of code will handle the situation.  This mechanism allows
                // "reversing course" to be queued up in the command sequence.
                this.setDir(-this.dir.x, -this.dir.y);
                thisCommand = this.dir.copy();
            }
        } // end of handling commands

        //console.log(`thisCommand: [${thisCommand.x},${thisCommand.y}] this.dir: [${this.dir.x},${this.dir.y}] this.pos: [${this.pos.x},${this.pos.y}]`);
        if ((this.dir.x != 0 || this.dir.y != 0) && thisCommand.x != this.dir.x || thisCommand.y != this.dir.y) {
            // we are turning
            //console.log('turning');
            // we must check if we can turn
            // if we can't turn, we must keep going in the current direction
            // and leave the command in the queue
            // so that we can try it again next time
            // let's see if we can go in the commanded direction
            var commandedSensorPos = createVector(this.pos.x + thisCommand.x * cellWidth/1.9,
                                                  this.pos.y + thisCommand.y * cellHeight/1.9);
            //console.log(`commandedSenorPos: [${commandedSensorPos.x},${commandedSensorPos.y}] thisCommand: [${thisCommand.x},${thisCommand.y}]`);
            //console.log(`cell at [${commandedSensorPos.x},${commandedSensorPos.y}] is ${terrain.cell_pix2ij(commandedSensorPos.x, commandedSensorPos.y)}`); 
            //console.log(`wall at commandedSensorPos [${commandedSensorPos.x},${commandedSensorPos.y}] is ${terrain.wallatpix(commandedSensorPos.x, commandedSensorPos.y)}`);
            
            if (!terrain.wallatpix(commandedSensorPos.x, commandedSensorPos.y)) {
                // all's clear to head in that direction
                //console.log('can turn.');
            } else {
                //console.log('hit wall');
                if (thisCommand.x == 0 && thisCommand.y == 0) {
                    // we must stop
                    thisCommand = createVector(0, 0);
                } else if (this.dir.x != 0 || this.dir.y != 0) {
                    this.commands.unshift(thisCommand);
                    thisCommand = this.dir.copy();
                }
                // we can't go in the current direction either
                // we must stop and wait for a new command
                // we must adjujst the position to the wall
                // and stop
                // we must stop
                //thisCommand = createVector(0, 0);


                // we keep going the same direction and leave the command in the queue
                // so that we can try it again next time
            }
        }
        //console.log(`thisCommand: [${thisCommand.x},${thisCommand.y}] this.dir: [${this.dir.x},${this.dir.y}] this.pos: [${this.pos.x},${this.pos.y}]`);
        // lets see if we can go in the current direction
        var pathSensorPos = createVector(this.pos.x + thisCommand.x * cellWidth/1.9, 
                                   this.pos.y + thisCommand.y * cellHeight/1.9);
        //console.log(`pathSensorPos: [${pathSensorPos.x},${pathSensorPos.y}] thisCommand: [${thisCommand.x},${thisCommand.y}]`);
        if (!terrain.wallatpix(pathSensorPos.x, pathSensorPos.y)) {
            // we can go in the current direction
            //console.log(`can go in current direction ${thisCommand.x},${thisCommand.y}`);
            if (thisCommand.x == 0 && thisCommand.y == 0) {
                // we must stop
                thisCommand = createVector(0, 0);
                this.commabnds = [];
            }
        } else {
            // we can't go in the current direction either
            // we must stop and wait for a new command
            //console.log('hit wall');
            // we must adjujst the position to the wall
            // and stop
            // we must stop
            thisCommand = createVector(0, 0);
        }
        this.setDir(thisCommand.x, thisCommand.y);
        //console.log(`MOVING: thisCommand: [${thisCommand.x},${thisCommand.y}] this.dir: [${this.dir.x},${this.dir.y}] this.pos: [${this.pos.x},${this.pos.y}]`);
        let k = exp(-this.trem()*0.08)*0.8+0.2;
        this.pos.x = this.pos.x + this.dir.x * this.speed * dt * k;
        this.pos.y = this.pos.y + this.dir.y * this.speed * dt*k;
        if (this.dir.x != 0 || this.dir.y == 0) {
            // must center y onto grid
            this.pos.y = Math.floor(this.pos.y / cellHeight) * cellHeight + cellHeight / 2;
        }
        if (this.dir.y != 0 || this.dir.x == 0) {
            // must center x onto grid
            this.pos.x = Math.floor(this.pos.x / cellWidth) * cellWidth + cellWidth / 2;
        }
        this.speed = (this.speed-1)*0.990  + 1;
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
  }

    //questo metodo verifica se PacMan colpisce uno spettro
    //in english: this method checks if PacMan hits a ghost
    hits(object) {
        var dx = this.pos.x - object.pos.x;
        var dy = this.pos.y - object.pos.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.r + object.r) {
            return true;
        }
        return false;

    }

    //Questo metodo gestisce l'animazione della morte
    //in english: this method handles the death animation
    die() {
        if (this.deathStage == 0) {
            stop_all_sounds();
            s_death.setVolume(0.25);
            s_death.play();
            this.deathStage = 1;
        }
        var now = Date.now();
        if (now - this.lastmove > 1000 / 9) {
            this.lastmove = now;
            this.deathStage += 1;
        } else {
            this.imgIndex.y = 7;
            this.imgIndex.x = 4;
            let doffset = this.deathStage;
            if (doffset > 12) doffset = 12;
            let xIndex = this.imgIndex.x + doffset;
            imageMode(CENTER);
            image(sheetImage, this.pos.x + cellWidth / 2 - imgWidth / 2, this.pos.y + cellHeight / 2 - imgHeight / 2, this.r * 2.5, this.r * 2.5,
                imgWidth * xIndex, imgHeight * this.imgIndex.y, imgWidth, imgHeight);
            if (this.deathStage >= 14) {
                doLoop = false;
                stop_all_sounds();
                textAlign(CENTER);
                textSize(40);
                textStyle(BOLD);
                fill(255, 211, 0);
                text('YOU DIED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                player.lives--;
                for (var i = ghosts.length; i > 0; i--) {
                    ghosts.pop();
                }
                ghosts = [];
                textSize(30);
                if (player.lives == 0) {
                    showStartButton('***GAME OVER*** press enter to reset',()=>{document.location.reload();});
                } else if (player.lives == 2) {
                    s_intermission.play();
                    window.setTimeout(() => {
                        s_intermission.stop();
                    }, 10000);
                    showStartButton('press enter for next life',()=>{
                        startButtonElementParent.elt.remove();
                        pacman.unfreeze();
                        count = 0
                        spawn=true;
                        doLoop = true;
                    });
                } else {
                    showStartButton('press enter for next life',()=>{
                        startButtonElementParent.elt.remove();
                        pacman.unfreeze();
                        count = 0
                        spawn=true;
                        doLoop = true;
                    });
                }
            }
        }
    }

    //questo metodo apre e chiude
    //la bocca di PacMan mentre si muove
    //  in english: this method opens and closes
    //     PacMan's mouth as he moves 
    changeMouth() {
        var now = Date.now();
        if (this.lastmouth == 0) this.lastmouth = now;
        if (now - this.lastmouth > 1000 / 10) {
            this.lastmouth = 0;
            //this.openMouth();
            if (this.open == 0) {
                this.open = 2;
            } else {
                this.open = 0;
            }
        }
        //this.lastmove = 0;
    }
}
