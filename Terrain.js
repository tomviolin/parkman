
class Terrain {
  constructor() {
    this.wba = {
      0b0000: "",
      0b0001: "line(0,0,0,-1);",
      0b0010: "line(0,0,1,0);",
      0b0100: "line(0,0,0,1);",
      0b1000: "line(0,0,-1,0);",

      0b0011: "arc( 1,-1, 2,2, TAU/4*1, TAU/4*2);",
      0b0110: "arc( 1, 1, 2,2, TAU/4*2, TAU/4*3);",
      0b1100: "arc(-1, 1, 2,2, TAU/4*3, TAU/4*4);",
      0b1001: "arc(-1,-1, 2,2, 0,       TAU/4);",

      0b0111: "line(0,-1,0,1);",
      0b1110: "line(-1,0,1,0);",
      0b1101: "line(0,-1,0,1);",
      0b1011: "line(-1,0,1,0);",

      0b0101: "line(0,-1,0,1);",
      0b1010: "line(-1,0,1,0);",

      0b1111: "",//rect(0,0,2,2);"

    }
    this.cba = {
      0b1110: "arc( 1,-1, 2,2, TAU/4*1, TAU/4*2);",
      0b0111: "arc(-1,-1, 2,2, TAU/4*0, TAU/4*1);",
      0b1011: "arc(-1, 1  ,2,2, TAU/4*3, TAU/4*0);",
      0b1101: "arc( 1, 1, 2,2,  TAU/4*2, TAU/4*3);",
    }
    /*
    
      XX
     XTX  0b0111   
     XXX
     
     XX
     XTX  0b1110  
     XXX
    
     XXX
     XTX  0b1101
     XX
    
     XXX
     XTX  0b1011
      XX
    
*/

    // characters:
    //  # = wall
    //  * = food
    //  o = power pellet
    //    = open
    this.cells = [
      "############################",
      "#............##............#",
      "#.####.#####.##.#####.####.#",
      "#o####.#####.##.#####.####o#",
      "#.####.#####.##.#####.####.#",
      "#..........................#",
      "#.####.##.########.##.####.#",
      "#.####.##.########.##.####.#",
      "#......##....##....##......#",
      "#.####.##### ## #####.######",
      "#......##### ## #####.######",
      "######.##          ##.######",
      "######.## ######## ##.######",
      "######.## #      # ##.######",
      "      .   #      #   .      ",
      "###.##.## #      # ##.###.##",
      "###.##.## ######## ##.###.##",
      "###....##          ##.....##",
      "###.##.## ######## ##.###.##",
      "###.##.## ######## ##.###.##",
      "#..........................#",
      "#.####.#####.##.#...#.####.#",
      "#o####.#####.##.##.##.####o#",
      "#...##........>.......##...#",
      "###.##.##.########.##.##.###",
      "###.##.##.########.##.##.###",
      "#......##....##....##......#",
      "#o##########.##.##########o#",
      "#.##########.##.##########.#",
      "#..........................#",
      "############################",
    ];
    this.jmin = 0;
    this.imin = 0;
    this.jmax = this.cells[0].length - 1;
    this.imax = this.cells.length - 1;

    CANVAS_WIDTH = (this.jmax + 1) * cellWidth;
    CANVAS_HEIGHT = (this.imax + 1) * cellHeight;
    CANVAS_REAL_HEIGHT = CANVAS_HEIGHT + CANVAS_PLAYERBAR_HEIGHT;
    console.log(`CANVAS_WIDTH=${CANVAS_WIDTH}, CANVAS_HEIGHT=${CANVAS_HEIGHT}, CANVAS_REAL_HEIGHT=${CANVAS_REAL_HEIGHT}`);
    this.nFood = 0;
    this.pacmanStart = { i: 0, j: 0 };
    for (let i = this.imin; i < this.imax; i++) {
      for (let j = this.jmin; j < this.jmax; j++) {
        if (this.foodatcell(i, j)) {
          this.nFood++;
        } else if (this.charAtCell(i, j) == '>') {
          this.pacmanStart = { i: i, j: j };
        }
      }
    }
  }

  wallatcell(ip, jp) {
    let i = (ip - this.imin) % (this.imax - this.imin + 1) + this.imin;
    let j = (jp - this.jmin) % (this.jmax - this.jmin + 1) + this.jmin;
    try {
      return this.cells[i][j] == "#";
    } catch (e) {
      return false;
    }
  }
  wall(ip, jp) {
    let i = (ip - this.imin) % (this.imax - this.imin + 1) + this.imin;
    let j = (jp - this.jmin) % (this.jmax - this.jmin + 1) + this.jmin;
    return this.wallatcell(i, j);
  }
  wallatpix(x, y) {
    var cellpos = this.cell_pix2ij(x, y);
    return this.wallatcell(cellpos.i, cellpos.j);
  }
  foodatcell(ip, jp) {
    //console.log(`foodatcell(${ip},${jp})`);
    let i = (ip - this.imin) % (this.imax - this.imin + 1) + this.imin;
    let j = (jp - this.jmin) % (this.jmax - this.jmin + 1) + this.jmin;
    return this.cells[i][j] == '.' || this.poweratcell(i, j);
  }
  foodatpix(x, y) {
    let cc = this.cell_pix2ij(x, y);
    return this.foodatcell(cc.i, cc.j);
  }
  poweratcell(ip, jp) {
    let i = (ip - this.imin) % (this.imax - this.imin + 1) + this.imin;
    let j = (jp - this.jmin) % (this.jmax - this.jmin + 1) + this.jmin;
    return this.cells[i][j] == 'o';
  }
  poweratpix(x, y) {
    let cc = this.cell_pix2ij(x, y);
    return this.poweratcell(cc.i, cc.j);
  }

  charAtCell(ip, jp) {
    let i = (ip - this.imin) % (this.imax - this.imin + 1) + this.imin;
    let j = (jp - this.jmin) % (this.jmax - this.jmin + 1) + this.jmin;
    return this.cells[i][j];
  }

  radiusatcell(ip, jp) {
    let i = (ip - this.imin) % (this.imax - this.imin + 1) + this.imin;
    let j = (jp - this.jmin) % (this.jmax - this.jmin + 1) + this.jmin;
    if (this.poweratcell(i, j)) {
      return cellWidth / 1.3;
    } else if (this.foodatcell(i, j)) {
      return cellWidth / 4;
    } else {
      return cellWidth / 4;
    }
  }
  radiusatpix(x, y) {
    return this.radiusatcell(Math.floor((y / cellHeight), Math.floor(x / cellWidth)));
  }

  cell_ij2pix(i, j) {
    return createVector(j * cellWidth, i * cellHeight);
  }

  cell_pix2ij(x, y) {
    return { i: Math.floor((y / cellHeight)), j: Math.floor(x / cellWidth) };
  }

  showcellij(ip, jp) {
    let i = (ip - this.imin) % (this.imax - this.imin + 1) + this.imin;
    let j = (jp - this.jmin) % (this.jmax - this.jmin + 1) + this.jmin;

    if (this.foodatcell(i, j)) {
      // drawing food
      fill(255, 255, 250); // off-white yellow
      ellipseMode(CENTER);
      let thisxypos = this.cell_ij2pix(i, j);
      if (!this.poweratcell(i, j)) {
        // regular food - carbidopa/levadopa (Sinemet) pill
        push();
        translate(
          thisxypos.x + cellWidth / 2,
          thisxypos.y + cellHeight / 2
        );
        scale(this.radiusatcell(i, j));
        rotate(PI / 3);
        ellipse(0, 0, 1.9, 1.9);
        stroke(200, 200, 200);
        strokeWeight(.2);
        line(0, -0.8, 0, 0.8);
        pop();
      } else {
        // power pellet - Rytary capsule, two colors: cyan and off-white yellow
        fill(0, 255, 255); // cyan
        push();
        translate(
          thisxypos.x + cellWidth / 2,
          thisxypos.y + cellHeight / 2
        );
        scale(this.radiusatcell(i, j));
        let rotangle = Date.now() / 2000;
        rotangle -= floor(rotangle);
        rotangle *= TAU;
        rotate(rotangle);
        arc(-0.45, 0, 0.6, 0.6, PI / 2, 3 * PI / 2);
        rectMode(CENTER);
        noStroke();
        strokeWeight(0);
        rect(-0.25, 0, 0.51, 0.6);
        rotate(PI);
        fill(255, 255, 250); // off-white yellow
        arc(-0.45, 0, 0.6, 0.6, PI / 2, 3 * PI / 2);
        rectMode(CENTER);
        noStroke();
        strokeWeight(0);
        rect(-0.25, 0, 0.51, 0.6);
        pop();
      }
    } else if (this.wall(i, j)) {
      let wallbits = 0;
      //    1
      //   8T2
      //    4
      let cornbits = 0;
      //   8 1
      //    T
      //   4 2

      // which adjoining faces are on?
      if (this.wall(i - 1, j)) wallbits += 1;
      if (this.wall(i, j - 1)) wallbits += 8;
      if (this.wall(i + 1, j)) wallbits += 4;
      if (this.wall(i, j + 1)) wallbits += 2;

      // which corners are on?
      if (this.wall(i - 1, j - 1)) cornbits += 8;
      if (this.wall(i - 1, j + 1)) cornbits += 1;
      if (this.wall(i + 1, j + 1)) cornbits += 2;
      if (this.wall(i + 1, j - 1)) cornbits += 4;

      fill(0, 0, 255);
      noStroke();
      let thisxypos = this.cell_ij2pix(i, j);
      push();
      translate(
        thisxypos.x + cellWidth / 2,
        thisxypos.y + cellHeight / 2 - 1
      );
      scale(cellWidth / 2, cellHeight / 2);
      rectMode(CENTER);

      //rect(0,0,2,2);

      /*
          
          
            if (wallbits == 0b0001) 
            pop();
              
            T  0b0000  

            X         
            T  0b0001      TX  0b0010      T  0b0100   XT  0b1000    
                                           X
            X                                              X
            TX 0b0011         TX  0b0110     XT  0b1100   XT  0b1001
                              X               X            
          
            X                                 X            X
            TX 0b0111        XTX  0b1110     XT   0b1101  XTX  0b1011
            X                 X               X
            
            X
            T  0b0101        XTX  0b1010
            X
            
            X
           XTX 0b1111
            X
            
            */
      let doit;
      if (wallbits == 0b1111) {
        // now we care about corners
        doit = this.cba[cornbits];
        //doit="arc(0,0,2,2,0,0);textSize(1);text('"+(cornbits)+"',-0.5,0.5)";
      } else {
        doit = this.wba[wallbits];
      }
      noFill();
      stroke(0, 108, 255);
      strokeWeight(cellWidth * 0.03);
      eval(doit);
      //rect(0,0,2,2);
      //console.log(doit);

      pop();

    }
  }
  showall() {
    console.log(`this.cells.length=${this.cells.length}, this.cells[0].length=${this.cells[0].length}`);
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = 0; j < this.cells[i].length; j++) {
        this.showcellij(i, j);
      }
    }
  }
  showpos(x, y) {
    let i = Math.floor(y / cellHeight);
    let j = Math.floor(x / cellWidth);
    this.showcellij(i, j);
  }

  setcellatxy(x, y, achar) {
    let cc = this.cell_pix2ij(x, y);
    //console.log(`setcellatxy(${x},${y},${achar}) => cell_ij2pix(${cc.i},${cc.j})`);
    this.cells[cc.i] = this.cells[cc.i].substring(0, cc.j) + achar + this.cells[cc.i].substring(cc.j + 1);
  }

}