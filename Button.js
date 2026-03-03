class Button {
  constructor(src, x, y) {
    // image source path
    this.src = src;

    // load image once per button instance
    // using p5 loadImage so it works with draw loop
    this.img = loadImage(this.src);

    // button center position on canvas
    this.x = x;
    this.y = y;

    // scale factor for click animation (pressed → slightly smaller)
    this.sclFac = 1;

    // general size multiplier (used to create visual hierarchy between buttons)
    this.size = 1;

    // button identifier used in global event system
    this.name = "NAN";

    // tracks whether mouse was pressed inside button
    // prevents triggering when pressing outside and releasing inside
    this.pressedInside = false;

    // bind 'this' to event handlers so they keep correct context
    this.mousePress = this.mousePress.bind(this);
    this.mouseUp = this.mouseUp.bind(this);

    // activate event listeners immediately after creation
    this.enable();
  }

  display() {
    // do not attempt to draw until image is loaded
    if (!this.img) return;

    push();
    imageMode(CENTER);

    // move origin to button center for easier scaling
    translate(this.x, this.y);

    // combine click animation scale + general size multiplier
    scale(this.sclFac * this.size);

    image(this.img, 0, 0);
    pop();
  }

  enable() {
    // use native window events instead of p5 mousePressed()
    // allows multiple buttons without manual state handling
    window.addEventListener("mousedown", this.mousePress);
    window.addEventListener("mouseup", this.mouseUp);
  }

  disable() {
    // removes listeners when button is not needed (scene change etc.)
    window.removeEventListener("mousedown", this.mousePress);
    window.removeEventListener("mouseup", this.mouseUp);
  }

  setName(val) {
    // name is used to identify which button was clicked
    // main sketch listens to BUTTON_PRESSED and checks this value
    this.name = val;
  }

  hit(mx, my) {
    if (!this.img) return false;

    // half width/height scaled by size multiplier
    // ensures visual size and clickable area stay consistent
    const hw = this.img.width * 0.5 * this.size;
    const hh = this.img.height * 0.5 * this.size;

    // simple AABB hit detection
    return mx > this.x - hw &&
           mx < this.x + hw &&
           my > this.y - hh &&
           my < this.y + hh;
  }

  mousePress(e) {
    // use p5 mouseX/mouseY for canvas-relative coordinates
    if (this.hit(mouseX, mouseY)) {
      // apply press animation
      this.sclFac = 0.9;

      // mark that press started inside button
      this.pressedInside = true;
    } else {
      this.pressedInside = false;
    }
  }

  mouseUp(e) {
    // trigger only if press AND release both happened inside
    if (this.pressedInside && this.hit(mouseX, mouseY)) {
      // custom global event → keeps UI decoupled from game logic
      const event = new CustomEvent("BUTTON_PRESSED");
      event.name = this.name;
      dispatchEvent(event);
    }

    // reset state and animation
    this.pressedInside = false;
    this.sclFac = 1;
  }
}