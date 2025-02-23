const CANVAS_HEIGHT = 620,
    CANVAS_WIDTH = 560,
    CANVAS_REAL_HEIGHT = CANVAS_HEIGHT + 30;
cellWidth = CANVAS_WIDTH / 28,
    cellHeight = CANVAS_HEIGHT / 31; //cellWidth && cellHeight = 20
let ghosts = [],
    spawn, count;

let SheetWidth = 384,
    SheetHeight = 240,
    cols = 16,
    rows = 10,
    imgWidth = Math.floor(SheetWidth / cols),
    imgHeight = Math.floor(SheetHeight / rows);

String.prototype.replaceAt = function (index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}


function preload() {
    sheetImage = loadImage('PacManSheet.png');
    player = new User();
}
let didSetup = false;

function mysetup() {
    let didDidSetup = didSetup;
    if (!didSetup) {
        createCanvas(CANVAS_WIDTH, CANVAS_REAL_HEIGHT);
        terrain = new Terrain();
        rb = createButton('restart game');
        rb.position(0,0);
        rb.mousePressed(() => {
            document.location.reload();
        });
    
        didSetup = true;
    }
    ghosts.push(new Ghost(0, 6, 12.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(0, 8, 13.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(8, 8, 14.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(0, 9, 15.5 * cellWidth, 14.5 * cellHeight));
    pacman = new Pacman(23,14);
    spawn = false;
    count = 0;
    doLoop = true;
    textAlign(CENTER);
    textSize(40);
    textStyle(BOLD);
    fill(255, 211, 0);
    text('YOU DIED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    //doLoop = false;
}
function setup() {
    imageMode(CENTER);
    frameRate(48);
    mysetup();
}

function draw() {
    if (!doLoop) {
        return;
    };
    background(0);
    if (pacman.death)
        pacman.die();
    terrain.showall();
    player.statusBar();
    if (spawn) count++;
    fill(255);
    if (pacman.death)
        pacman.die();
    //(13 * cellWidth, 12 * cellHeight, cellWidth * 2, cellHeight);
    noFill();
    if (pacman.death)
        pacman.die();
    else if (terrain.nFood == 0) {
        doLoop = false;
        textAlign(CENTER);
        textSize(60);
        textStyle(BOLD);
        fill(255, 211, 0);
        text('YOU HAVE WON!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else {

        if (spawn) {
            if (count > 100 && count < 150) {
                ghosts[0].setPos(9 * cellWidth + cellWidth / 2, 11 * cellHeight + cellHeight / 2);
            } else if (count > 200 && count < 250) {
                ghosts[1].setPos(18 * cellWidth + cellWidth / 2, 17 * cellHeight + cellHeight / 2);
            } else if (count > 300 && count < 350) {
                ghosts[2].setPos(18 * cellWidth + cellWidth / 2, 11 * cellHeight + cellHeight / 2);
            } else if (count > 400 && count < 450) {
                ghosts[3].setPos(9 * cellWidth + cellWidth / 2, 17 * cellHeight + cellHeight / 2);
                spawn = false;
            }
        }
        if (pacman.death)
            pacman.die();
        else
            pacman.show();
        pacman.move();
        for (let ghost of ghosts) {
            ghost.move();
            ghost.show();
            if (pacman.hits(ghost)) {
                if (pacman.speed > ghost.warnlevel) {
                    // Ghost dies
                    //console.log("ghost");
                    ghost.setupGhost();
                } else {
                    // pacman dies
                    pacman.death = true;
                    pacman.die();
                }
            }
        }
        //return;
        let pmij = terrain.cell_pix2ij(pacman.pos.x, pacman.pos.y);
        //console.log(`food? ${pmij} '${terrain.cells[pmij.i][pmij.j]}'`);     
        if (terrain.foodatpix(pacman.pos.x, pacman.pos.y)) {
            //console.log("food!!!");
            if (terrain.poweratpix(pacman.pos.x, pacman.pos.y)) {
                pacman.medlevel += 6;
                player.addScore(100);
                pacman.speed += 2;
            }
            // terrain.terrain[i][j] = new Cell(false, false, element.x, element.y);
            terrain.setcellatxy(pacman.pos.x, pacman.pos.y, ' ');
            terrain.nFood--;
            player.addScore(10);
            pacman.medlevel += 10;
            //terrain.showall();//(i,j);
        }


        //terrain.showall();//(i,j);

        if (count == 0) {
            if (startButton) return;
            textAlign(CENTER);
            textSize(60);
            textStyle(BOLD);
            fill(255, 211, 0);
            //console.log("showing start");
            showStartButton("Press ENTER to begin",
                () => {
                    //setup();
                    doLoop = true;
                    count = 0;
                    spawn = true;
                    removeElements();
                }
            );
            doLoop = false;
        }


    }


}

function keyPressed() {
    //console.log(keyCode);
    if (keyCode == 32) {
        doLoop = !doLoop;
        if (!doLoop) {
            showStartButton("Press SPACE to continue",
                () => {
                    doLoop = true;
                    removeElements();
                }
            );
        } else {
            removeElements();
            pacman.unfreeze();
        }
    }
    if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D' || key === 'l' || key === 'L') {
        pacman.addInstruction(1, 0);
    } else if (keyCode === LEFT_ARROW || key === 'a' || key === 'A' || key === 'h' || key === 'H') {
        pacman.addInstruction(-1, 0);
    } else if (keyCode === UP_ARROW || key === 'w' || key === 'W' || key === 'k' || key === 'K') { 
        pacman.addInstruction(0, -1);
    } else if (keyCode === DOWN_ARROW || key === 's' || key === 'S'  || key === 'j' || key === 'J') { 
        pacman.addInstruction(0, 1);
    } else if (keyCode === ENTER && pacman.death && player.lives >= 0) {
        setup();
        doLoop = true;
    } else if (keyCode === ENTER && pacman.death && didSetup) {
        document.locatioon.reload();
    } else if (keyCode === ENTER && !pacman.death && spawn == false && count == 0) {
        spawn = true;
        count = 1;
        pacman.medlevel = 100;
    }
}
