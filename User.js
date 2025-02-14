class User {
    constructor() {
        this.lives = 3;
        this.score = 0;
        this.scoreText = [19, 3, 15, 18, 5]
        this.scoreSeparated = [];
    }

    statusBar() {
        //Shows the number of lives left
        for (let i = 1; i < this.lives + 1; i++) {
            image(sheetImage, i * 20, CANVAS_HEIGHT + (CANVAS_REAL_HEIGHT - CANVAS_HEIGHT) / 2, 15, 15,
                imgWidth * 0, imgHeight * 3, imgWidth, imgHeight);
        }
	text(pacman.medlevel, CANVAS_WIDTH-50,CANVAS_REAL_HEIGHT);
        //Shows the player's score
        for (var i = 0; i < this.scoreText.length; i++) {
            image(sheetImage, CANVAS_WIDTH / 2 + i * 20, CANVAS_HEIGHT + (CANVAS_REAL_HEIGHT - CANVAS_HEIGHT) / 2, 15, 15, (imgWidth / 2) * this.scoreText[i], imgHeight, imgWidth / 2, imgHeight / 2 - 2);
        }
        for (var i = 0; i < this.scoreSeparated.length; i++) {
            image(sheetImage, CANVAS_WIDTH * 8 / 10 + i * 20, CANVAS_HEIGHT + (CANVAS_REAL_HEIGHT - CANVAS_HEIGHT) / 2, 15, 15, (imgWidth / 2) * this.scoreSeparated[i], 0, imgWidth / 2, imgHeight / 2);
            text(this.scoreSeparated[i], CANVAS_WIDTH / 2 + i * 20, CANVAS_HEIGHT + (CANVAS_REAL_HEIGHT - CANVAS_HEIGHT) / 2);
        }

    }

    addScore(dir) {
        this.scoreSeparated = [];
        this.score += dir;
        var sNumber = this.score.toString();

        for (var i = 0, length = sNumber.length; i < length; i += 1) {
            this.scoreSeparated.push(+sNumber.charAt(i));
        }
    }

}
