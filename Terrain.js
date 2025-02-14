


class Terrain {
  constructor() {
    this.wba={
      0b0000: "",
      0b0001: "line(0,0,0,-1);",
      0b0010: "line(0,0,1,0);",
      0b0100: "line(0,0,0,1);",
      0b1000: "line(0,0,-1,0);",

      0b0011: "arc( 1,-1, 2,2,TAU/4,   TAU/4*2);",
      0b0110: "arc( 1, 1, 2,2,TAU/4*2, TAU/4*3);",
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

    
    
    this.cba={
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
      "#...##................##...#",
      "###.##.##.########.##.##.###",
      "###.##.##.########.##.##.###",
      "#......##....##....##......#",
      "#o##########.##.##########o#",
      "#.##########.##.##########.#",
      "#..........................#",
      "############################",
    ];
    this.xmin = 0;
    this.ymin = 0;
    this.xmax = this.cells[0].length-1;
    this.ymax = this.cells.length-1;

    this.nFood = 0;

    for (let i = 0; i < this.cells.length; i++) {
      for (let j = 0; j < this.cells[i].length; j++) {
        if (this.food(i,j)) {
          this.nFood++;
        }
      }
    }
  }

  wall(i, j) {
    let x=j;
    let y=i;
    if (y < this.ymin) y=this.ymax;
    if (y > this.ymax) y=this.ymin;
    if (x > this.xmax) x=this.xmin;
    if (x < this.xmin) x=this.xmax;
    return this.cells[y][x] == "#";
  }
  food(i, j) {
    return this.power(i,j) || this.cells[i][j] == ".";
  }
  power(i,j) {
    return this.cells[i][j] == 'o';
  }
  r(i, j) {
    if (this.food(i, j)) {
      if (this.power(i,j)) {
        return cellWidth / 1.2;
      }
      return cellWidth / 4;
    } else {
      return cellWidth / 2;
    }
  }
  pos(i, j) {
    return {
      x: Math.floor(j / cellWidth),
      y: Math.floor(i / cellHeight),
    };
  }
  show(y, x) {
    if (this.food(y, x)) {
      fill(255,255,120);
      ellipseMode(CENTER);
      let thispos = this.objectAt(y, x).pos;
      ellipse(
        thispos.x * cellWidth + cellWidth / 2,
        thispos.y * cellHeight + cellHeight / 2,
        this.r(y, x),
        this.r(y, x)
      );
    } else if (this.wall(y, x)) {
      let wallbits = 0;
      //    1
      //   8T2
      //    4
      let cornbits = 0;
      //   8 1
      //    T
      //   4 2

      // which adjoining faces are on?
      if (this.wall(y - 1, x)) wallbits += 1;
      if (this.wall(y, x - 1)) wallbits += 8;
      if (this.wall(y + 1, x)) wallbits += 4;
      if (this.wall(y, x + 1)) wallbits += 2;

      // which corners are on?
      if (this.wall(y-1,x-1)) cornbits += 8;
      if (this.wall(y-1,x+1)) cornbits += 1;
      if (this.wall(y+1,x+1)) cornbits += 2;
      if (this.wall(y+1,x-1)) cornbits += 4;
      
      fill(0, 0, 255);
      noStroke();
      let thispos = this.objectAt(y, x).pos;
      push();
      translate(
        thispos.x * cellWidth + cellWidth / 2,
        thispos.y * cellHeight + cellHeight / 2-1
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
      stroke(0,108,255);
      strokeWeight(cellWidth*0.03);
      eval(doit);
      //rect(0,0,2,2);
            //console.log(doit);

        pop();

      }
  }
  showall() {
    for (let i = 0; i < this.cells.length; i++) {
      for (let j = 0; j < this.cells[i].length; j++) {
        this.show(i, j);
      }
    }
  }

  objectAt(i, j) {
    return {
      food: this.food(i, j),
      wall: this.wall(i, j),
      pos: { x: j, y: i },
    };
  }
}
