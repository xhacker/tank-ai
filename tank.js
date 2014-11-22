// me.stars
// me.tank
// me.tank.position
// me.tank.direction
// me.bullet

// me.go(steps)
// me.turn(direction)
// me.fire()

// game.map
// game.frames
// game.star

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var MAP_W = 19;
var MAP_H = 15;
var INFINITY = 999;
var DIRS = ["up", "right", "down", "left"];
var U = 0;
var R = 1;
var D = 2;
var L = 3;

function newDistArray(argument) {
  var x = new Array(MAP_W);
  for (var i = 0; i < MAP_W; i++) {
    x[i] = new Array(MAP_H);
    for (var j = 0; j < MAP_H; j++) {
      x[i][j] = INFINITY;
    }
  }
  return x;
}

function flood(dist, x, y, value) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) {
    return;
  }

  if (dist[x][y] <= value) {
    return;
  }

  if (g_map[x][y] == "x") {
    // Stone
    return;
  }

  dist[x][y] = value;
  flood(dist, x - 1, y, value + 1);
  flood(dist, x + 1, y, value + 1);
  flood(dist, x, y - 1, value + 1);
  flood(dist, x, y + 1, value + 1);
}

var old_star = null;
function genDist() {
  if (!old_star || g_star[0] != old_star[0] || g_star[1] != old_star[1]) {
    print("Generating dist");
    dist = newDistArray();
    flood(dist, g_star[0], g_star[1], 0);
    old_star = g_star;
  }
}

function getThreat(x, y) {
  if (!g_enemy.tank) { return null; }

  var sameLine = sameXY(g_enemy.tank, {position: [x, y]});
  if (sameLine == "x") {
    if (g_enemy.tank.position[0] > x) { return L; }
    else { return R; }
  }
  else if (sameLine == "y") {
    if (g_enemy.tank.position[1] > y) { return U; }
    else { return D; }
  }

  return null;
}

function getPenalty(x, y, dirno) {
  var penalty = dist[x][y];

  var threat = getThreat(x, y);
  if (threat === null || threat == (dirno + 2) % 4) {}
  else if (threat == dirno) {
    penalty += 5;
  }
  else {
    penalty += 2;
  }

  return penalty;
}

function go(dirno) {
  if (g_cur_dirno == dirno) {
    g_me.go();
  }
  else {
    var delta_dir = dirno - g_cur_dirno;
    if (delta_dir == 1 || delta_dir == -3) { g_me.turn("right"); }
    else { g_me.turn("left"); }
  }
}

function sameXY(moving_obj, target) {
  var x = moving_obj.position[0];
  var y = moving_obj.position[1];
  var dir = moving_obj.direction;

  var target_x = target.position[0];
  var target_y = target.position[1];

  if (x == target_x && ((y < target_y && dir == "down") || (y > target_y && dir == "up"))) {
    return "x";
  }
  if (y == target_y && ((x < target_x && dir == "right") || (x > target_x && dir == "left"))) {
    return "y";
  }

  return false;
}

function onIdle(me, enemy, game) {
  var dir = me.tank.direction;
  g_x = me.tank.position[0];
  g_y = me.tank.position[1];
  g_star = game.star;
  g_me = me;
  g_enemy = enemy;
  g_cur_dirno = DIRS.indexOf(dir);
  g_map = game.map;

  if (enemy.bullet) {
    var sameLine = sameXY(enemy.bullet, g_me.tank);
    if (sameLine == "x") {
      print("Found bullet X");
      if (dir == "left" || dir == "right") {
        me.go();
      }
      else {
        me.turn("left");
        me.go();
      }
      return;
    }
    else if (sameLine == "y") {
      print("Found bullet Y");
      if (dir == "up" || dir == "down") {
        me.go();
      }
      else {
        me.turn("right");
        me.go();
      }
      return;
    }
  }

  if (enemy.tank && !me.bullet) {
    if (sameXY(me.tank, enemy.tank)) {
      me.fire();
      return;
    }
  }

  if (g_star) {
    print("Found star!");

    genDist();

    var penalty = [
        getPenalty(g_x, g_y - 1, 0),
        getPenalty(g_x + 1, g_y, 1),
        getPenalty(g_x, g_y + 1, 2),
        getPenalty(g_x - 1, g_y, 3)
    ];

    // add penalty for rotation
    penalty[(g_cur_dirno + 2) % 4] += 2;
    penalty[(g_cur_dirno + 1) % 4] += 1;
    penalty[(g_cur_dirno + 3) % 4] += 1;

    go(penalty.indexOf(Math.min.apply(Math, penalty)));
  }
  else {
    // TODO
    if (!me.bullet) { me.fire(); }
    else {
      me.turn("left");
    }
  }
}
