class Joint {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.bones = [];
  }
  
  updateVel() {
    for (let i = 0; i < this.bones.length; i += 1) {
      let bone = this.bones[i];
      let d = dist(this.x, this.y, bone.j.x, bone.j.y);
      let u = Joint.unitVec(this, bone.j);
      this.dx += u[0] * bone.interp(d - bone.eqLen);
      this.dy += u[1] * bone.interp(d - bone.eqLen);
    }
  }

  updatePos() {
    this.x += this.dx;
    this.y += this.dy;
  }
  
  render() {
    noStroke()
    fill(0)
    circle(this.x, this.y, 30)
    for (let i = 0; i < this.bones.length; i += 1) {
      stroke(0)
      strokeWeight(4)
      line(this.x, this.y, this.bones[i].j.x, this.bones[i].j.y)
    }
  }

  static unitVec(j0, j1) {
    return [j1.x - j0.x, j1.y - j0.y];
  }
  
  static connect(j0, j1, eqLen, interp) {
    j0.bones.push(new Bone(j1, eqLen, interp))
    j1.bones.push(new Bone(j0, eqLen, interp))
  }
}

class Bone {
  constructor(j, eqLen, interp) {
    this.j = j;
    this.eqLen = eqLen;
    this.interp = interp;
  }
}

function createBall(x, y, dx, dy, r, n, interp) {
  let joints = [new Joint(x, y, dx, dy)];
  for (let i = 0; i < n; i += 1) {
    angleMode(DEGREES);
    joints.push(new Joint(x + r * cos(360 * i / n), y + r * sin(360 * i / n), dx, dy));
    Joint.connect(joints[0], joints[i + 1], r, interp);
  }
  for (let i = 1; i < n; i += 1) {
    Joint.connect(joints[i], joints[i + 1], 2 * r * sin(180 / n), interp)
  }
  Joint.connect(joints[n], joints[1], 2 * r * sin(180 / n), interp)
  return joints
}

var g_joints = []

function gravityUpdate(g) {
  for (let i = 0; i < g_joints.length; i += 1) {
    g_joints[i].dy += g
  }
}

function floorUpdate(floorLevel) {
  for (let i = 0; i < g_joints.length; i += 1) {
    if (g_joints[i].y > floorLevel) {
      g_joints[i].y = floorLevel;
      g_joints[i].dy = 0;
    }
  }
}

function leftWallUpdate(wallLevel) {
  for (let i = 0; i < g_joints.length; i += 1) {
    if (g_joints[i].x < wallLevel) {
      g_joints[i].x = wallLevel;
      g_joints[i].dx = 0;
    }
  }
}

function rightWallUpdate(wallLevel) {
  for (let i = 0; i < g_joints.length; i += 1) {
    if (g_joints[i].x > wallLevel) {
      g_joints[i].x = wallLevel;
      g_joints[i].dx = 0;
    }
  }
}

function linearInterp(k) {
  return function(x) {
    return k * x
  }
}

function cubilinearInterp(k, scale) {
  return function(x) {
    let cubic = k * (x / scale) ** 3
    let linear = k * x
    if (abs(linear) > abs(cubic)) {
      return cubic
    }
    return linear
  }
}

var g_n = 7
var g_window = 9
var ball_points_hist = []

function setup() {
  createCanvas(1000, 1000);
  /*
  g_joints.push(new Joint(width / 2, height / 2, 0, 0))
  g_joints.push(new Joint(width / 2, height / 2 + 100, 0, 0))
  Joint.connect(g_joints[0], g_joints[1], 100, linearInterp(.01))
  */
  // g_joints.push(...createBall(width / 2, height / 2, 10, 20, 200, 7, cubilinearInterp(0.001, 10)))
  ball = createBall(width / 2, -200, 10, 20, 200, g_n, linearInterp(0.002))
  g_joints.push(...ball)
}

function draw() {
  background(255);
  for (let i = 0; i < g_joints.length; i += 1) {
    g_joints[i].updateVel();
  }
  for (let i = 0; i < g_joints.length; i += 1) {
    g_joints[i].updatePos();
  }
  gravityUpdate(0.3);
  floorUpdate(height - 30);
  leftWallUpdate(30);
  rightWallUpdate(width - 30);
  for (let i = 0; i < g_joints.length; i += 1) {
    // g_joints[i].render();
  }
  let new_ball_points = [];
  for (let i = 1; i < 1 + g_n; i += 1) {
    new_ball_points.push([ball[i].x, ball[i].y]);
  }
  if (ball_points_hist.length == 0) {
    for (let i = 0; i < g_window; i += 1) {
      ball_points_hist.push(new_ball_points);
    }
  } else {
    ball_points_hist.splice(0, 1);
    ball_points_hist.push(new_ball_points);
  }

  let ball_points = []
  for (let i = 0; i < g_n; i += 1) {
    let x = 0;
    let y = 0;
    for (let j = 0; j < g_window; j += 1) {
      x += ball_points_hist[j][i][0];
      y += ball_points_hist[j][i][1];
    }
    x /= g_window;
    y /= g_window;
    ball_points.push([x, y])
  }
  for (let i = 0; i < g_n; i += 1) {
    stroke(0);
    strokeWeight(10);
    curve(ball_points[i][0], ball_points[i][1], ball_points[(i + 1) % g_n][0], ball_points[(i + 1) % g_n][1], ball_points[(i + 2) % g_n][0], ball_points[(i + 2) % g_n][1], ball_points[(i + 3) % g_n][0], ball_points[(i + 3) % g_n][1],)
  }
}