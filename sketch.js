const cellWidth = 20;
const cellHeight = 20;
//
let CANVAS_WIDTH;
let CANVAS_HEIGHT;
let CANVAS_REAL_HEIGHT;
let CANVAS_PLAYERBAR_HEIGHT = 30;


let bgGraphics;
let defaultCanvas;
//const CANVAS_HEIGHT = 620,
 //   CANVAS_WIDTH = 560,
 //   CANVAS_REAL_HEIGHT = CANVAS_HEIGHT + 30;
//cellWidth = CANVAS_WIDTH / 28,
//    cellHeight = CANVAS_HEIGHT / 31; //cellWidth && cellHeight = 20


// ghosts is still a global because Pacman/Ghost/sketch all read it.  spawn
// and count are now encoded inside the game FSM as game.spawning /
// game.spawnCount.
let ghosts = [];

// sprite sheet
// old
/*
let SheetWidth = 384,
    SheetHeight = 240,
    cols = 16,
    rows = 10,
    imgWidth = Math.floor(SheetWidth / cols),
    imgHeight = Math.floor(SheetHeight / rows);
*/

let SheetWidth = 786,
    SheetHeight = 280,
    imgWidth = 20,
    imgHeight = 20,
    cols = Math.floor(SheetWidth / imgWidth),
    rows = Math.floor(SheetHeight / imgHeight);



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
// All of the game's lifecycle flags have been replaced by game.state in
// game.js.  doLoop, oneLoop, startButton, startButtonCallback,
// startButtonElementParent, didSetup, firstDraw, spawn, count, munch are all
// gone — see game.js for the FSM.

// ---------------------------------------------------------------------
// On-canvas toast button.  showToast()/hideToast() live in game.js.





function stop_all_sounds() {
    for (let sound of allSounds) {
        sound.stop();
    }
}



//
function preload() {
    // load the sprite sheet
    sheetImage = loadImage('spritesheet.png');
    // load the sounds
    allSounds = [
        s_munch1 = loadSound('audios/munch_1.mp3'),
        s_munch2 = loadSound('audios/munch_2.mp3'),
        s_munch12 = loadSound('audios/munch_1_2.mp3'),
        s_death = loadSound('audios/pac_death.mp3'),
        s_power = loadSound('audios/power_pellet.mp3'),
        s_eatghost = loadSound('audios/eat_ghost.mp3'),
        s_retreat = loadSound('audios/retreating.mp3'),
        s_intro = loadSound('audios/game_start.mp3'),
        s_victory = loadSound('audios/victory.mp3'),
        s_siren1 = loadSound('audios/siren_on.mp3'),
        s_siren2 = loadSound('audios/siren_2.mp3'),
        s_shaky = loadSound('audios/shaky.mp3'),
        s_steer_righ = loadSound('audios/steer_righ.mp3'),
        s_steer_left = loadSound('audios/steer_left.mp3'),
        s_steer_up = loadSound('audios/steer_up.mp3'),
        s_steer_down = loadSound('audios/steer_down.mp3')
    ];
    s_power.setVolume(0.5);
    s_intro.setVolume(0.5);
    s_munch12.setVolume(0.5);
    s_eatghost.setVolume(2);
    //s_retreat.setVolume(0.5);
    terrain = new Terrain();
    pacman = new Pacman(terrain.pacmanStart.i, terrain.pacmanStart.j);
    player = new User();
}

function respawnGhosts() {
    // Re-create the 4 ghosts the same way mysetup() does,
    // because die() wipes the ghosts array.
    if (ghosts.length > 0) {
        for (var i = ghosts.length; i > 0; i--) ghosts.pop();
    }
    ghosts = [];
    ghosts.push(new Ghost(0, 4, 12.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(0, 5, 13.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(0, 6, 14.5 * cellWidth, 14.5 * cellHeight));
    ghosts.push(new Ghost(0, 7, 15.5 * cellWidth, 14.5 * cellHeight));
}

// ---------------------------------------------------------------------
// p5 lifecycle hooks (called by the p5 runtime)
// ---------------------------------------------------------------------

let didSetup = false;

// sketch.js only ever creates the canvas/UI once.  Ghosts and Pacman are
// created by the FSM (game.resetActors / respawnGhosts) instead of here,
// because mysetup was being used as a side-channel respawn mechanism.
function mysetup() {
    if (!didSetup) {
        console.log(`screen.width = ${screen.width}, screen.height = ${screen.height}`);
        defaultCanvas = createCanvas(CANVAS_WIDTH, CANVAS_REAL_HEIGHT);
        bgGraphics = createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
        bgGraphics.background(0);
        rb = createButton('restart game');
        rb.position(0, 0);
        rb.mousePressed(() => {
            userStartAudio();
            game.input('restart');
        });
        didSetup = true;
        textAlign(CENTER);
        textSize(40);
        textStyle(BOLD);
        fill(255, 211, 0);
    }
}

function setup() {
    imageMode(CENTER);
    frameRate(120);
    mysetup();
    // Browsers require an AudioContext to be resumed/created inside a user
    // gesture handler.  We can't play s_intro here in setup() (which runs on
    // page load), so we drop into the BOOT state and wait for the user to
    // interact with the "click to start" toast shown by game.startBoot().
    game.startBoot();
}

// ---------------------------------------------------------------------
// Main loop.  Dispatches per state to game logic, so the body never has to
// ask questions like "is pacman dying?" or "is spawn true?".
// ---------------------------------------------------------------------

function draw() {
    background(0);

    switch (game.state) {

        case STATES.BOOT:
            // render the splash background while we wait for the user's first
            // gesture (which unlocks the AudioContext so we can play s_intro).
            terrain.showall();
            player.statusBar();
            pacman.show();
            break;

        case STATES.INTRO:
            // background rendering while the intro jingle plays
            terrain.showall();
            player.statusBar();
            // render pacman frozen at start (no movement yet)
            pacman.show();
            break;

        case STATES.READY:
            terrain.showall();
            player.statusBar();
            pacman.show();
            break;

        case STATES.RUNNING:
            drawRunning();
            break;

        case STATES.PAUSED:
            // render the frozen frame only; no updates
            terrain.showall();
            player.statusBar();
            drawGhostsAndPacman();
            break;

        case STATES.DYING:
            terrain.showall();
            player.statusBar();
            for (let ghost of ghosts) ghost.show();
            pacman.die();   // advances the animation and calls game.finishDeath() once done
            break;

        case STATES.RESPAWN:
            terrain.showall();
            player.statusBar();
            // Show Pacman frozen at his start position so the player can see
            // where he'll begin the next life.  Ghosts are still empty here
            // (cleared in finishDeath()).
            pacman.show();
            break;

        case STATES.GAME_OVER:
            terrain.showall();
            player.statusBar();
            // drawGameOverBanner();   // rem'd out — its 'YOU DIED!' text has
            //                          // been merged into the GAME OVER toast
            //                          // (game.js) to avoid redundant display.
            break;

        case STATES.WON:
            terrain.showall();
            player.statusBar();
            // drawWinBanner();   // rem'd out — its 'YOU HAVE WON!' text is
            //                     // already shown via the toast (game.js:247),
            //                     // so this was a redundant duplicate display.
            break;
    }
}

// draw the maze and move Pacman + ghosts one tick; detects food clearing and
// fatal collisions.
function drawRunning() {
    terrain.showall();
    player.statusBar();

    // advance the ghost-entry countdown (was: count >= 100 etc. blocks in draw())
    game.updateGhostSpawn();

    drawGhostsAndPacman();

    // move actors one tick
    pacman.move();
    for (let ghost of ghosts) ghost.move();

    // collision: ghosts may have reached pacman this tick
    for (let ghost of ghosts) {
        if (pacman.hits(ghost)) {
            if (pacman.speed > ghost.warnlevel) {
                // ghost is eaten by the powered-up pacman
                s_eatghost.play();
                s_retreat.play();
                player.addScore(200);
                pacman.medlevel += 10;
                ghost.setupGhost();
            } else {
                // pacman dies -> FSM will drive the animation + next-life path
                game.beginDeath();
                return;
            }
        }
    }

    // food / power pellet consumption
    if (terrain.foodatpix(pacman.pos.x, pacman.pos.y)) {
        if (terrain.poweratpix(pacman.pos.x, pacman.pos.y)) {
            pacman.medlevel += 66;
            player.addScore(100);
            pacman.speed += 3;
            if (!s_power.isLooping()) s_power.loop();
            s_siren1.stop();
            // s_siren2 intentionally not looping (preserved from old code)
        }
        terrain.setcellatxy(pacman.pos.x, pacman.pos.y, ' ');
        terrain.nFood--;
        player.addScore(10);
        pacman.medlevel += 5;
        s_munch12.play();
    }

    if (terrain.nFood == 0) {
        game.beginWin();
    }
}

// ghosts and pacman are drawn at the same z-order as the old game; we keep
// pacman on top of ghosts so you can always see what you are controlling.
function drawGhostsAndPacman() {
    for (let ghost of ghosts) ghost.show();
    pacman.show();
}

function drawGameOverBanner() {
    // Rem'd out — the 'YOU DIED!' text now lives in the GAME OVER toast
    // (game.js:234) as 'GAME OVER (YOU DIED) - press enter to reset', so the
    // toast is the sole way the message is displayed.
    // textAlign(CENTER);
    // textSize(40);
    // textStyle(BOLD);
    // fill(255, 211, 0);
    // text('YOU DIED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function drawWinBanner() {
    // Rem'd out — the 'YOU HAVE WON!' text is already shown via the toast
    // (game.js:247), so this was a redundant duplicate display on the play
    // surface.  Toasts are now the sole way messages are shown to the user.
    // textAlign(CENTER);
    // textSize(60);
    // textStyle(BOLD);
    // fill(255, 211, 0);
    // text('YOU HAVE WON!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

// ---------------------------------------------------------------------
// Input handling.  Every event source routes through game.input() so the
// transitions can never race against each other.
// ---------------------------------------------------------------------

function keyPressed() {
    userStartAudio();

    if (keyCode === 32) { // SPACE = pause/unpause
        game.input('pause_toggle');
        return;
    }

    if (keyCode === ENTER) {
        game.input('confirm');
        return;
    }

    // movement keys.  only the RUNNING state will actually do anything with
    // them (see game.input 'move'); other states ignore.
    if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D' || key === 'l' || key === 'L') {
        game.input('move', { x: 1, y: 0 });
    } else if (keyCode === LEFT_ARROW || key === 'a' || key === 'A' || key === 'h' || key === 'H') {
        game.input('move', { x: -1, y: 0 });
    } else if (keyCode === UP_ARROW || key === 'w' || key === 'W' || key === 'k' || key === 'K') {
        game.input('move', { x: 0, y: -1 });
    } else if (keyCode === DOWN_ARROW || key === 's' || key === 'S' || key === 'j' || key === 'J') {
        game.input('move', { x: 0, y: 1 });
    }
}

let startX, startY, endX, endY;
function touchStarted() {
    userStartAudio();
    startX = mouseX;
    startY = mouseY;
    // a touch on the canvas while a toast is showing acts as a confirm
    // (lets mobile users tap to dismiss the splash / death / game-over prompt).
    if (game.toast) {
        game.input('confirm');
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

    // tiny taps are not swipes; ignore
    if (abs(deltaX) < 20 && abs(deltaY) < 20) return;

    if (abs(deltaX) > abs(deltaY)) {
        if (deltaX > 0) game.input('move', { x: 1, y: 0 });
        else game.input('move', { x: -1, y: 0 });
    } else {
        if (deltaY > 0) game.input('move', { x: 0, y: 1 });
        else game.input('move', { x: 0, y: -1 });
    }
}

