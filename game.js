// game.js
//
// Central game-state machine for the Pacman game.  This is the single source
// of truth for the lifecycle of a play session: which screen we are on, what
// the input dispatcher should do, and how update/render should behave.
//
// The states form a directed graph:
//
//   BOOT  --(preload done)--> INTRO  --(intro sound ended)--> READY
//                                                   |
//                                                   v
//   GAME_OVER <--(lives==0)-- DYING --(anim done, lives remain)--> RESPAWN
//       ^                      ^                                         |
//       |                      |                                         v
//    (confirm)               (fatal collision)                          READY
//       |                      |                                         |
//       v                      v                                         v
//   [reload] <-----------  RUNNING                                      RUNNING
//       ^                     /| \                                  (looping)
//       |                    / | \                                       |
//       +----(confirm)------/  |  \-----(nFood==0)--> WON ----------(confirm)
//                              v
//                            PAUSED --(confirm)--> RUNNING
//
// Input is funneled through game.input(action, payload) so every event source
// (keyPressed, mousePressed, touchStarted, on-screen button) goes through the
// same transition table and there are no parallel code paths that can race.

const STATES = Object.freeze({
    BOOT: 'BOOT',
    INTRO: 'INTRO',
    READY: 'READY',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    DYING: 'DYING',
    RESPAWN: 'RESPAWN',
    GAME_OVER: 'GAME_OVER',
    WON: 'WON',
});

// The game object.  Everything else in sketch.js should ask this object for
// permission before mutating globals (ghosts, spawn, count, etc.).
const game = {
    state: STATES.BOOT,
    // frame counter for the spawn-gate animation (ghosts entering the maze).
    // Equivalent to the old `count` global, scoped now to the spawn sequence.
    spawnCount: 0,
    spawning: false,
    // p5 button element for the current toast/prompt.  Only one is ever shown
    // at a time; lifecycle managed by showToast()/hideToast().
    toast: null,
    // Whether the INTRO state should wait for an explicit user confirm (Press
    // ENTER to begin / Press enter for next life) before entering gameplay
    // after the intro jingle.  Set per-round by startIntro()/startIntermission().
    awaitConfirmAfterIntro: false,
    // Text to show on the toast if awaitConfirmAfterIntro is true.  Different
    // for round 1 ("Press ENTER to begin") vs respawn ("Press enter for next
    // life").
    awaitToastText: "Press ENTER to begin",
    // The SoundFile currently playing as intro/intermission music (if any),
    // so that an early user confirm can stop it.  Reset on each play and
    // nulled when the round starts.
    currentMusic: null,

    // ---------------------------------------------------------------------
    // State transitions

    setState(newState) {
        if (newState === this.state) return;
        console.log(`[game] ${this.state} -> ${newState}`);
        this.state = newState;
        // reset any per-state bookkeeping that's not persistent
        if (newState !== STATES.RUNNING) {
            this.spawning = false;
        }
        if (newState === STATES.RUNNING) {
            pacman.unfreeze();
            // reset each ghost's move clock too — ghosts compute their
            // per-frame step as `step = speedMult * max(1, pacman.speed)
            // * dt` where dt is `(now - this.lastmove)/1000*60`.  Without
            // a reset on (re)entry to RUNNING, the first post-pause move()
            // sees a huge dt (the entire pause duration) and the ghosts
            // lurch forward by hundreds of pixels in a single frame —
            // embedding them in walls and skipping whole corridors.
            for (let ghost of ghosts) ghost.unfreeze();
            // restore the looping background ambience.  This entry fires for
            // every RUNNING transition — including unpause after the user
            // pressed SPACE — so the siren resumes consistently.  We were
            // previously only restarting siren/shaky in beginRound() (which
            // runs at round start), so an unpause left the gameplay silent
            // even though everything else continued.
            if (!s_siren1.isLooping()) s_siren1.loop();
            if (!s_shaky.isLooping()) s_shaky.loop();
        }
    },

    // ---------------------------------------------------------------------
    // Lifecycle helpers used by sketch.js.  Each function performs the work
    // of the equivalent ad-hoc state transition in the old code, but through
    // the FSM so nothing is hidden.

    // Called once after p5 preload + setup.  The AudioContext is suspended
    // until a user gesture, so we drop a "click to start" toast and wait.
    // The first click/keypress on the toast fires game.input('confirm')
    // (inside the gesture handler) which transitions BOOT -> INTRO.
    startBoot() {
        showToast("click to start");
        this.state = STATES.BOOT;
    },

    // Plays s_intro, then either:
    //   - auto-starts gameplay when the music ends (awaitConfirm === false),
    //     used for round 1 where the user has already clicked to unlock audio
    //     and we don't want to make them click again;
    //   -OR- drops a "Press ENTER to begin" toast and waits for the user to
    //     confirm (awaitConfirm === true), used for subsequent rounds where
    //     the AudioContext is already alive but the player should resume play
    //     with an explicit press.
    startIntro(awaitConfirm) {
        this.startMusicRound(s_intro, awaitConfirm, "Press ENTER to begin");
    },

    // After a Pacman death (when the player still has lives remaining), drop
    // the "Press enter for next life" toast immediately and wait for the
    // player's confirm.  No intermission music plays here anymore — the former
    // intermission tune has been repurposed as the victory sound and is now
    // played only on win (see beginWin()).  Click/Enter on the toast starts
    // gameplay immediately — no second "Press ENTER to begin" prompt.
    startRespawnWait() {
        hideToast();
        stop_all_sounds();
        // move Pacman back to the start so the splash frame while the player
        // waits for the next life doesn't show him where he died last round.
        let start = terrain.pacmanStart;
        pacman.respawn(start.i, start.j);
        showToast("Press enter for next life");
        this.currentMusic = null;
        this.setState(STATES.RESPAWN);
    },

    // Shared helper: play a music track while showing the maze splash, then
    // either auto-start gameplay (awaitConfirm===false) or wait for the user
    // to press Enter on a toast (awaitConfirm===true).  When awaiting confirm,
    // `toastText` is the message shown after the music ends.
    startMusicRound(sound, awaitConfirm, toastText) {
        this.awaitConfirmAfterIntro = !!awaitConfirm;
        this.awaitToastText = toastText || "Press ENTER to begin";
        this.currentMusic = sound;
        hideToast();
        stop_all_sounds();
        // move Pacman back to the start so the splash frame during the
        // intro/intermission jingle doesn't show him where he died last round.
        let start = terrain.pacmanStart;
        pacman.respawn(start.i, start.j);
        sound.stop();
        sound.onended(() => {
            sound.onended(null);
            if (this.state !== STATES.INTRO) return;
            if (this.awaitConfirmAfterIntro) {
                showToast(this.awaitToastText);
                this.setState(STATES.RESPAWN);
            } else {
                // round 1: jump straight into gameplay after the jingle
                this.resetActors();
                this.beginRound();
            }
        });
        sound.play();
        this.setState(STATES.INTRO);
    },

    // Begin a fresh round.  Used from READY once the player confirms, or from
    // RESPAWN once the player confirms.  Caller may pass `withIntro` to also
    // replay s_intro.
    beginRound() {
        hideToast();
        stop_all_sounds();
        // reset Pacman's medication capsule BEFORE trem() is queried so the
        // initial sound levels reflect the fresh-round state.
        pacman.medlevel = 100;
        // also reset the timer so the decay clock starts cleanly from this
        // round rather than carrying forward elapsed time from the splash.
        pacman.lastmedcalc = Date.now();
        // drop the reference to the intro/intermission sound so a later
        // confirm doesn't try to stop a track that's already done.
        this.currentMusic = null;
        s_siren1.loop();
        s_shaky.setVolume(pacman.trem() * 0.3);
        s_shaky.loop();
        // The ghost entry countdown runs in the RUNNING update.
        this.startGhostSpawn();
        this.setState(STATES.RUNNING);
    },

    // Reset Pacman + ghosts for the start of a round (first round, or after a
    // respawn).
    resetActors() {
        respawnGhosts();
        let start = terrain.pacmanStart;
        pacman.respawn(start.i, start.j);
    },

    // Re-initialise the spawn countdown so ghosts enter the maze one-by-one.
    startGhostSpawn() {
        this.spawnCount = 0;
        this.spawning = true;
    },

    // Enemy entry: positions each ghost inside the maze as the spawn counter
    // passes certain thresholds.  Roughly equivalent to the old count gating.
    updateGhostSpawn() {
        if (!this.spawning) return;
        this.spawnCount++;
        if (this.spawnCount > 100 && this.spawnCount < 150) {
            ghosts[0].setPos(9 * cellWidth + cellWidth / 2, 11 * cellHeight + cellHeight / 2);
        } else if (this.spawnCount > 200 && this.spawnCount < 250) {
            ghosts[1].setPos(18 * cellWidth + cellWidth / 2, 17 * cellHeight + cellHeight / 2);
        } else if (this.spawnCount > 300 && this.spawnCount < 350) {
            ghosts[2].setPos(18 * cellWidth + cellWidth / 2, 11 * cellHeight + cellHeight / 2);
        } else if (this.spawnCount > 400 && this.spawnCount < 450) {
            ghosts[3].setPos(9 * cellWidth + cellWidth / 2, 17 * cellHeight + cellHeight / 2);
            this.spawning = false;
        }
    },

    // Called from the collision code when Pacman loses a life.
    beginDeath() {
        stop_all_sounds();
        pacman.death = true;
        pacman.deathStage = 0;
        pacman.deathDone = false;
        this.setState(STATES.DYING);
    },

    // Called from Pacman.die() once the animation finishes; transitions to
    // either RESPAWN (lives remain) or GAME_OVER (lives==0).
    finishDeath() {
        player.lives--;
        // wipe ghosts so they're not painted on top of the prompt
        for (var i = ghosts.length; i > 0; i--) ghosts.pop();
        ghosts = [];
        if (player.lives <= 0) {
            showToast("GAME OVER (YOU DIED) - press enter to reset");
            this.setState(STATES.GAME_OVER);
        } else {
            // play the intermission jingle; when it ends, a "Press enter for
            // next life" toast is shown and we wait for the user's confirm.
            // Gameplay resumes immediately after they confirm.
            this.startIntermission();
        }
    },

    // Called from the collision code when the player clears the maze.
    beginWin() {
        stop_all_sounds();
        // The victory tune (formerly the intermission jingle) plays only here.
        s_victory.stop();
        s_victory.play();
        showToast("YOU HAVE WON!");
        this.setState(STATES.WON);
    },

    // ---------------------------------------------------------------------
    // Input dispatcher.  Every event source routes here, so the transition
    // logic is concentrated in exactly one place and cannot race.

    input(action, payload) {
        switch (action) {

            case 'confirm': {
                switch (this.state) {
                    case STATES.BOOT:
                        // user just clicked/pressed ENTER on the "click to
                        // start" toast.  The toast handler already called
                        // userStartAudio() so the AudioContext is now live
                        // and we can play s_intro.  Round 1 skips the
                        // "Press ENTER to begin" prompt after the jingle.
                        this.startIntro(false);
                        break;
                    case STATES.INTRO:
                        // player pressed Enter to skip the jingle.  Honour
                        // the per-round promise made by startMusicRound():
                        // for round 1 (s_intro, awaitConfirm===false) we jump
                        // straight into gameplay; for respawn (s_intermission,
                        // awaitConfirm===true) we drop the "Press enter for
                        // next life" toast and wait for the user's confirm.
                        if (this.currentMusic) this.currentMusic.stop();
                        if (this.awaitConfirmAfterIntro) {
                            showToast(this.awaitToastText);
                            this.setState(STATES.RESPAWN);
                        } else {
                            this.resetActors();
                            this.beginRound();
                        }
                        break;
                    case STATES.READY:
                        this.resetActors();
                        this.beginRound();
                        break;
                    case STATES.PAUSED:
                        // Tapping the toast button is a "confirm" action.
                        // SPACE is reserved for pause/resume (handled in
                        // the pause_toggle input); ENTER and toast-click
                        // both flow through here, and we hide the toast
                        // so the resume transition is clean.
                        hideToast();
                        this.setState(STATES.RUNNING);
                        break;
                    case STATES.RESPAWN:
                        // music already played, "Press enter for next life"
                        // toast was already shown — start the new life now.
                        this.resetActors();
                        this.beginRound();
                        break;
                    case STATES.GAME_OVER:
                    case STATES.WON:
                        document.location.reload();
                        break;
                    // RUNNING/DYING ignore confirm
                }
                break;
            }

            case 'pause_toggle': {
                if (this.state === STATES.RUNNING) {
                    stop_all_sounds();
                    showToast("Press SPACE to continue");
                    this.setState(STATES.PAUSED);
                } else if (this.state === STATES.PAUSED) {
                    hideToast();
                    this.setState(STATES.RUNNING);
                }
                break;
            }

            case 'move': {
                // direction commands only matter while the loop is running;
                // queueing during PAUSED/INTRO/etc would just cause weird
                // behaviour when the round resumes.
                if (this.state === STATES.RUNNING && payload) {
                    pacman.addInstruction(payload.x, payload.y);
                    // optional steering sound feedback for touch swipes
                    if (payload.x === 1) s_steer_righ.play();
                    else if (payload.x === -1) s_steer_left.play();
                    else if (payload.y === 1) s_steer_down.play();
                    else if (payload.y === -1) s_steer_up.play();
                }
                break;
            }

            case 'restart':
                document.location.reload();
                break;
        }
    },
};

// ---------------------------------------------------------------------
// Toast (on-canvas button / prompt) management.
//
// Only one toast may be shown at a time.  A click on the toast button always
// means "confirm" — never movement or pause.  Keyboard SPACE/ENTER confirm
// inputs also call game.input('confirm'); there's nothing to race against.

function showToast(text) {
    if (game.toast) hideToast();
    let btn = createButton(text);
    btn.elt.setAttribute("class", "hot");
    btn.elt.focus();
    btn.elt.addEventListener('click', (e) => {
        userStartAudio();
        e.preventDefault();
        e.stopPropagation();
        game.input('confirm');
        return false;
    });
    // swallow ENTER so p5's global keyPressed() doesn't also get it.
    // SPACE is intentionally NOT swallowed here: during PAUSED, SPACE
    // must reach the global keyPressed() so it routes to pause_toggle
    // (which hides the toast and resumes gameplay).  If we swallowed
    // SPACE on the toast, the user's "press SPACE to continue" would
    // arrive as a 'confirm' action instead — that worked for the
    // RUNNING transition but never hid the toast, leaving the
    // "Press SPACE to continue" prompt stuck on screen.
    //
    // We DO need to preventDefault on SPACE keydown: by native browser
    // convention a focused <button> fires a synthetic `click` on
    // SPACE-keyup.  If that click fired it would call game.input('confirm')
    // (on top of the pause_toggle that keyPressed() already dispatched
    // on keydown), giving us a double transition (RUNNING -> PAUSED
    // -> RUNNING via confirm).  preventDefault here cancels the click.
    btn.elt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            userStartAudio();
            e.preventDefault();
            e.stopPropagation();
            game.input('confirm');
            return false;
        }
        if (e.key === ' ') {
            e.preventDefault();
            // do NOT stopPropagation — let p5's keyPressed() pick it up
            // and route to game.input('pause_toggle').
        }
    });
    game.toast = btn;
}

function hideToast() {
    if (game.toast) {
        game.toast.elt.remove();
        game.toast = null;
    }
}
