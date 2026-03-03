// Eda Erginoglu - Assignment 03

// Core idea: player controls a dog character, collects pink orbs for score,
// avoids red hazards, survives until the timer ends.
// I got help from ChatGPT

// SCENE STATE 
// currentScene controls which screen is active.
// intro → start screen
// game  → main gameplay loop
// end   → score screen after death or time finish
let currentScene = "intro";

// background images for each scene
let imgIntro, imgGame, imgEnd;

// sprite images for falling objects
let imgOrb, imgX;

// UI BUTTONS 
// custom Button class handles hover + click internally.
// we only listen to BUTTON_PRESSED events here.
let startBtn;
let tryBtn;

// GAME STATE VARIABLES
// score increases when collecting orbs
let score = 0;

// total play time in seconds
let timeLimit = 20;

// used to calculate remaining time with millis()
let startTime = 0;

// died flag helps distinguish hazard death vs time end
let died = false;

// FALLING OBJECT ARRAYS 
// orbs = collectible objects
// hazards = deadly objects
let orbs = [];
let hazards = [];

// number of orbs spawned at reset
let orbCount = 10;

// PLAYER (DOG) PHYSICS 
// simple platform physics: position + velocity + ground check
let dog = { x: 90, y: 0, vx: 0, vy: 0, r: 22, onGround: true };

// ground Y position for collision clamp
let groundY = 610;

// movement tuning values
let moveSpeed = 8;
let jumpPower = 14;
let gravity = 0.85;

// DOG DRAWING PROPORTIONS 
// these are fixed so the character scales consistently
let bodyW = 192, bodyH = 144, headR = 84, legW = 30, legH = 84, earW = 30, earH = 72;

// color palette for the dog
let furC, collarC;

function preload() {
  imgIntro = loadImage("Intro.jpg");
  imgGame  = loadImage("game.jpg");
  imgEnd   = loadImage("end.jpg");

  imgOrb   = loadImage("orb.png");
  imgX     = loadImage("x.png");
}

function setup() {
  createCanvas(800, 800);
  textAlign(CENTER, CENTER);
  noStroke();

  furC = color(180, 120, 70);
  collarC = color(235, 90, 150);

  startBtn = new Button("button.png", width / 2, height * 0.80);
  startBtn.setName("START");
  startBtn.size = 1;

  tryBtn = new Button("tryagainbutton.png", width / 2, height * 0.86);
  tryBtn.setName("TRY");
  tryBtn.size = 2;

  addEventListener("BUTTON_PRESSED", (e) => {
    if (e.name === "START" && currentScene === "intro") startGame();
    if (e.name === "TRY" && currentScene === "end") startGame();
  });

  resetGame();
}

function draw() {
  background(0);

  if (currentScene === "intro") drawIntro();
  else if (currentScene === "game") { updateGame(); drawGame(); }
  else if (currentScene === "end") drawEnd();
}

function mousePressed() {}

function keyPressed() {
  if (currentScene === "game") {
    if ((keyCode === UP_ARROW || key === " " || key === "w" || key === "W") && dog.onGround) {
      dog.vy = -jumpPower;
      dog.onGround = false;
    }
  }

  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || key === " ") {
    return false;
  }
}

function drawIntro() {
  image(imgIntro, 0, 0, width, height);
  startBtn.display();
}

function startGame() {
  resetGame();
  startTime = millis();
  died = false;
  currentScene = "game";
}

function drawEnd() {
  image(imgEnd, 0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(64);
  text(score, width / 2, 590);

  tryBtn.display();
}

function updateGame() {
  let elapsed = (millis() - startTime) / 1000;
  let timeLeft = timeLimit - elapsed;

  if (timeLeft <= 0) {
    died = false;
    currentScene = "end";
    return;
  }

  dog.vx = 0;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) dog.vx = -moveSpeed;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) dog.vx = moveSpeed;

  dog.x += dog.vx;
  dog.x = constrain(dog.x, dog.r, width - dog.r);

  dog.vy += gravity;
  dog.y += dog.vy;

  if (dog.y >= groundY) {
    dog.y = groundY;
    dog.vy = 0;
    dog.onGround = true;
  }

  for (let o of orbs) {
    o.y += o.vy;
    if (o.y > groundY + 30) respawnOrb(o);
  }

  for (let h of hazards) {
    h.y += h.vy;
    if (h.y > groundY + 30) respawnHazard(h);
  }

  let dx = dog.x;
  let dy = dog.y - (legH + bodyH * 0.6);

  for (let o of orbs) {
    if (dist(dx, dy, o.x, o.y) < dog.r + o.r) {
      score++;
      respawnOrb(o);
    }
  }

  for (let h of hazards) {
    if (dist(dx, dy, h.x, h.y) < dog.r + h.r) {
      died = true;
      currentScene = "end";
      return;
    }
  }
}

function drawGame() {
  image(imgGame, 0, 0, width, height);

  push();
  imageMode(CENTER);
  for (let o of orbs) image(imgOrb, o.x, o.y, o.r * 2, o.r * 2);
  for (let h of hazards) image(imgX, h.x, h.y, h.r * 2, h.r * 2);
  pop();

  // draw player
  // visual scale reduced → dog appears smaller, physics & hitbox unchanged
  drawDog(dog.x, dog.y, 0.40);

  let elapsed = (millis() - startTime) / 1000;
  let timeLeft = max(0, timeLimit - elapsed);

  push();
  fill(220);
  textSize(18);
  textAlign(RIGHT, TOP);
  text(nf(timeLeft, 2, 2), width - 40, 20);
  pop();

  push();
  fill(220);
  textSize(18);
  textAlign(LEFT, TOP);
  text(score, 40, 20);
  pop();
}

function resetGame() {
  score = 0;

  dog.x = 90;
  dog.y = groundY;
  dog.vx = 0;
  dog.vy = 0;
  dog.onGround = true;

  orbs = [];
  hazards = [];

  for (let i = 0; i < orbCount; i++) orbs.push(makeOrb());
  for (let i = 0; i < 4; i++) hazards.push(makeHazard());
}

function makeOrb() {
  return {
    x: random(120, 740),
    y: random(-650, 520),
    r: random(14, 20),
    vy: random(1.2, 3.5)
  };
}

function makeHazard() {
  return {
    x: random(140, 740),
    y: random(-750, 420),
    r: random(18, 28),
    vy: random(1.5, 4.0)
  };
}

function respawnOrb(o) {
  o.y = random(-600, -80);
  o.x = random(120, 740);
  o.vy = random(1.2, 3.5);
  o.r = random(14, 20);
}

function respawnHazard(h) {
  h.y = random(-700, -90);
  h.x = random(140, 740);
  h.vy = random(1.5, 4.0);
  h.r = random(18, 28);
}

function drawDog(x, y, s = 1) {
  push();
  translate(x, y);
  scale(s);

  stroke(255, 80);
  fill(furC);
  rectMode(CENTER);
  rect(0, -legH - bodyH / 2, bodyW, bodyH);

  noStroke();
  fill(furC);
  rectMode(CORNER);
  rect(-bodyW * 0.22, -legH, legW, legH);
  rect(bodyW * 0.06, -legH, legW, legH);

  stroke(255, 80);
  fill(furC);
  let headCY = -legH - bodyH - headR;
  ellipse(0, headCY, headR * 2, headR * 2);

  noStroke();
  fill(255);
  ellipse(-headR * 0.3, headCY - headR * 0.1, 6, 6);
  ellipse(headR * 0.3, headCY - headR * 0.1, 6, 6);

  fill(0);
  ellipse(0, headCY + headR * 0.2, 8, 8);

  fill(furC);
  rectMode(CORNER);
  rect(-headR - earW, headCY - earH * 0.5, earW, earH);
  rect(headR, headCY - earH * 0.5, earW, earH);

  fill(collarC);
  rectMode(CENTER);
  rect(0, -legH - bodyH + 10, headR * 2, 12);

  pop();
}