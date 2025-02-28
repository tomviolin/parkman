const cellWidth = 20;
const cellHeight = 20;

let CANVAS_WIDTH;
let CANVAS_HEIGHT;
let CANVAS_REAL_HEIGHT;
let CANVAS_PLAYERBAR_HEIGHT = 30;



//const CANVAS_HEIGHT = 620,
 //   CANVAS_WIDTH = 560,
 //   CANVAS_REAL_HEIGHT = CANVAS_HEIGHT + 30;
//cellWidth = CANVAS_WIDTH / 28,
//    cellHeight = CANVAS_HEIGHT / 31; //cellWidth && cellHeight = 20


let ghosts = [],
    spawn, count;

// sprite sheet
let SheetWidth = 384,
    SheetHeight = 240,
    cols = 16,
    rows = 10,
    imgWidth = Math.floor(SheetWidth / cols),
    imgHeight = Math.floor(SheetHeight / rows);

// this facilitates setting individual cells in the terrain
String.prototype.replaceAt = function (index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

document.addEventListener('touchstart', {});

let s_munch1 = null,
    s_munch2 = null,
    s_munch12 = null,
    s_death = null,
    s_power = null,
    s_eatghost = null,
    s_retreat = null,
    s_intro = null,
    s_siren1 = null,
    s_siren2 = null,
    s_shaky = null;
    s_steer_righ = null,
    s_steer_left = null,
    s_steer_up = null,
    s_steer_down = null;



let pacman, terrain, player, rb;
let doLoop = false;
let oneLoop = false;
let startButton = false;
let startButtonCallback = startButtonCallbackStub;
let startButtonElementParent = null;
/*
function showStartButton(message, callback) {
    buttonCallback = callback;
    const htmlString = `
    <button style='
        z-index: 100;
        background-color: #4CAF50;
        border: none;
        color: white;
        font-size: 50px; 
        font-weight: bold; 
        white-space: nowrap; 
        position: absolute; 
        bottom:50%; 
        left:50%; 
        transform: translate(-50%,-50%);' 
        onclick='buttonPressedCallback()'>
        ${message}
    </button>`;
    var ddiv = document.createElement("div");
    ddiv.innerHTML = htmlString;
    startButton = ddiv.firstElementChild;
    //console.log(startButton);
    // Create a button to restart the game
    document.body.appendChild(startButton);
    startButton.focus();

   } */
function showStartButton(text, callback) {
    startButton = true;
    startButtonElementParent = createButton(text);
    //console.log(startButtonElementParent);
    //sb.position(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2);
    startButtonElementParent.elt.addEventListener('click', () => {
        console.log("startButtonElementParent clicked");
        userStartAudio();
        callback();
    });
    startButtonElementParent.elt.addEventListener('keydown', (e) => { 
        console.log(`startButtonElementParent keydown ${e.key}`);
        userStartAudio();
        callback();
        return false;
    });
    startButtonElementParent.mousePressed(() => {
        userStartAudio();
        callback();
    });
    startButtonElementParent.touchStarted(() => {
        userStartAudio();
        callback();
    });

    startButtonCallback = () => {
        //console.log("startButtonCallback() called!");
        userStartAudio();
        callback();
    }
    startButtonElementParent.elt.setAttribute("class","hot");
    //sb.center();        
    startButtonElementParent.elt.focus();
    startButtonElementParent.elt.class="startButton";
}


function startButtonCallbackStub() {
    //console.log("startButtonCallback stub");
}





function stop_all_sounds() {
    for (let sound of allSounds) {
        sound.stop();
    }
}



//
function preload() {
    // load the sprite sheet
    sheetImage = loadImage('PacManSheet.png');
    // load the sounds
    allSounds = [
        s_munch1 = loadSound('audios/munch_1.mp3'),
        s_munch2 = loadSound('audios/munch_2.mp3'),
        s_munch12 = loadSound('audios/munch_1_2.mp3'),
        s_death = loadSound('audios/pacman_death4.mp3'),
        s_power = loadSound('audios/power_pellet.mp3'),
        s_eatghost = loadSound('audios/eat_ghost.mp3'),
        s_retreat = loadSound('audios/retreating.mp3'),
        s_intro = loadSound('audios/game_start.mp3'),
        s_intermission = loadSound('audios/intermission.mp3'),
        s_siren1 = loadSound('audios/siren_1.mp3'),
        s_siren2 = loadSound('audios/siren_2.mp3'),
        s_shaky = loadSound('audios/shaky.mp3'),
        s_steer_righ = loadSound('audios/steer_righ.mp3'),
        s_steer_left = loadSound('audios/steer_left.mp3'),
        s_steer_up = loadSound('audios/steer_up.mp3'),
        s_steer_down = loadSound('audios/steer_down.mp3')
    ];
    terrain = new Terrain();
    pacman = new Pacman(terrain.pacmanStart.i, terrain.pacmanStart.j);
    player = new User();
}
let didSetup = false;

function mysetup() {
    let didDidSetup = didSetup;
    if (!didSetup) {
        console.log(`screen.width = ${screen.width}, screen.height = ${screen.height}`);
        //createCanvas(screen.width, screen.height);
        createCanvas(CANVAS_WIDTH, CANVAS_REAL_HEIGHT);
        rb = createButton('restart game');
        rb.position(0, 0);
        rb.mousePressed(() => {
            userStartAudio();
            document.location.reload();
        });

        didSetup = true;
    }
    ghosts.push(new Ghost(0, 6, 12.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(0, 8, 13.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(8, 8, 14.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(0, 9, 15.5 * cellWidth, 14.5 * cellHeight));
    pacman = new Pacman(23, 14);
    spawn = false;
    count = 0;
    doLoop = true;
    textAlign(CENTER);
    textSize(40);
    textStyle(BOLD);
    fill(255, 211, 0);
    //text('YOU DIED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    //doLoop = false;
}
function setup() {
    imageMode(CENTER);
    frameRate(120);
    mysetup();
}
let munch = 1;

let firstDraw = true;

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
        stop_all_sounds();
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
        if (!firstDraw) {
            pacman.move();
        }
        for (let ghost of ghosts) {
            if (!firstDraw) {
                ghost.move();
            }
            ghost.show();
            if (pacman.hits(ghost)) {
                if (pacman.speed > ghost.warnlevel) {
                    // Ghost dies
                    //console.log("ghost");
                    s_eatghost.play();
                    s_retreat.play();
                    player.addScore(200);
                    pacman.medlevel += 10;
                    ghost.setupGhost();
                } else {
                    // pacman dies
                    // stop all sounds
                    stop_all_sounds();
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
                if (!s_power.isLooping()) {
                    s_power.loop();
                }
                s_siren1.stop();
                if (!s_siren2.isLooping()) {
                    //s_siren2.loop();
                }
            }
            // terrain.terrain[i][j] = new Cell(false, false, element.x, element.y);
            terrain.setcellatxy(pacman.pos.x, pacman.pos.y, ' ');
            terrain.nFood--;
            player.addScore(10);
            pacman.medlevel += 5;
            s_munch12.play();
            //s_munch2.play();
            //if (munch==1) { s_munch1.play(); s_munch2.play(); munch=2; } else { s_munch2.play(); munch=1; }

            //s_munch1.play();
            //if (s_munch1.isPlaying()) {
            //  s_munch2.play();
            //} else {
            //    s_munch1.play();
            ///}
            //terrain.showall();//(i,j);
        }


        //terrain.showall();//(i,j);
        if (oneLoop) {
            oneLoop = false;
            doLoop = false;
        }
        if (firstDraw) {
            firstDraw = false;
            if (startButton) return;
            hhh();
            doLoop = false;
            oneLoop = false;
        }

    }


}



function hhh() {
    doLoop = false;
    oneLoop = false;
    showStartButton("Press ENTER to begin",
        () => {
            if (startButtonElementParent) {
                startButtonElementParent.elt.remove()
                startButtonElementParent = null;
            };
            doLoop = false;
            s_intro.stop();
            s_intro.onended(() => {
                s_intro.clearCues();
                doLoop = true;
                count = 0;
                spawn = true;
                if (startButtonElementParent) {
                    startButtonElementParent.elt.remove()
                    startButtonElementParent = null;
                };
                stop_all_sounds();
                s_siren1.loop();
                s_shaky.setVolume(pacman.trem());
                s_shaky.loop();

                startButton = false;
                startButtonCallback = startButtonCallbackStub;
                pacman.medlevel = 100;
                pacman.unfreeze();
                doLoop =  true;
                count=0;

                //console.log("startButtonCallback = startButtonCallbackStub;");
            });
            doLoop=false;
            s_intro.play();

        }
    );
}



function keyPressed() {
    userStartAudio();
    //console.log(keyCode);
    if (keyCode == 32) {
        if (startButton && !doLoop) {
            return;
        }
        doLoop = !doLoop;
        if (!doLoop) {
            stop_all_sounds();
            showStartButton("Press SPACE to continue",
                () => {
                    doLoop = false;
                    if (startButtonElementParent) {
                        startButtonElementParent.elt.remove()
                        startButtonElementParent = null;
                    }
                }
            );
        } else {
            if (startButtonElementParent) {
                startButtonElementParent.elt.remove()
                startButtonElementParent = null;
            }
            pacman.unfreeze();
        }
    }
    if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D' || key === 'l' || key === 'L') {
        pacman.addInstruction(1, 0);
    } else if (keyCode === LEFT_ARROW || key === 'a' || key === 'A' || key === 'h' || key === 'H') {
        pacman.addInstruction(-1, 0);
    } else if (keyCode === UP_ARROW || key === 'w' || key === 'W' || key === 'k' || key === 'K') {
        pacman.addInstruction(0, -1);
    } else if (keyCode === DOWN_ARROW || key === 's' || key === 'S' || key === 'j' || key === 'J') {
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

let startX, startY, endX, endY;
function touchStarted() {
    userStartAudio();
    startX = mouseX;
    startY = mouseY;
    if (startButton) {
        //console.log("startButtonCallback();");
        startButtonCallback();
    }
    return false; // Prevent default behavior
}

function touchEnded() {
    userStartAudio();
    endX = mouseX;
    endY = mouseY;
    handleSwipe();
    return false; // Prevent default behavior
}

function handleSwipe() {
    let deltaX = endX - startX;
    let deltaY = endY - startY;

    if (abs(deltaX) > abs(deltaY)) {
        if (deltaX > 0) {
            //console.log("Swiped Right");
            s_steer_righ.play();
            pacman.addInstruction(1, 0);
        } else {
            //console.log("Swiped Left");
            s_steer_left.play();
            pacman.addInstruction(-1, 0);
        }
    } else {
        if (deltaY > 0) {
            //console.log("Swiped Down");
            s_steer_down.play();
            pacman.addInstruction(0, 1);
        } else {
            s_steer_up.play();
            pacman.addInstruction(0, -1);
            //console.log("Swiped Up");
        }
    }
}

