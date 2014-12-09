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

var g_last_enemy = null;
var g_bullets = [];

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

function same(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

var old_star = null;
function genDist() {
  if (!old_star || !same(g_star, old_star)) {
    print("Generating dist");
    dist = newDistArray();
    flood(dist, g_star[0], g_star[1], 0);
    old_star = g_star;
  }
}

function resetDist() {
  dist = newDistArray();
  for (var i = 0; i < MAP_W; i++) {
    for (var j = 0; j < MAP_H; j++) {
      dist[i][j] = 0;
    }
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

  for (var i = g_bullets.length - 1; i >= 0; i--) {
    if (sameXYObj(g_bullets[i], x, y)) {
      penalty += 5;
    }
  };

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

function turnTo(dirno) {
  var delta_dir = dirno - g_cur_dirno;
  if (delta_dir == 1 || delta_dir == -3) { g_me.turn("right"); }
  else { g_me.turn("left"); }
}

function sameXYObj(moving_obj, target_x, target_y) {
  var x = moving_obj.x;
  var y = moving_obj.y;
  var dirno = moving_obj.dirno;

  if (x == target_x && ((y < target_y && dirno === D) || (y > target_y && dirno === U))) {
    return "x";
  }
  if (y == target_y && ((x < target_x && dirno === R) || (x > target_x && dirno === L))) {
    return "y";
  }

  return false;
}

function sameXY(moving_obj, target) {
  var x = moving_obj.position[0];
  var y = moving_obj.position[1];
  var dir = moving_obj.direction;

  var target_x = target.position[0];
  var target_y = target.position[1];

  if (x == target_x && ((y < target_y && dir == "down") || (y > target_y && dir == "up"))) {
    var start = y < target_y ? y : target_y;
    var end = y > target_y ? y : target_y;
    for (var i = start + 1; i < end; ++i) {
      if (g_map[x][i] == "x") {
        return false;
      }
    }
    return "x";
  }
  if (y == target_y && ((x < target_x && dir == "right") || (x > target_x && dir == "left"))) {
    var start = x < target_x ? x : target_x;
    var end = x > target_x ? x : target_x;
    for (var i = start + 1; i < end; ++i) {
      if (g_map[i][y] == "x") {
        return false;
      }
    }
    return "y";
  }

  return false;
}

function whichDir(moving_obj, target) {
  var x = moving_obj.position[0];
  var y = moving_obj.position[1];
  var dir = moving_obj.direction;

  var target_x = target.position[0];
  var target_y = target.position[1];

  // TODO: obstacles
  if (x == target_x) {
    return y > target_y ? U : D;
  }
  if (y == target_y) {
    return x < target_x ? R : L;
  }

  return -1;
}

function updateBullet(bullet) {
  if      (bullet.dirno == U) { bullet.y -= 2; }
  else if (bullet.dirno == R) { bullet.x += 2; }
  else if (bullet.dirno == D) { bullet.y += 2; }
  else if (bullet.dirno == L) { bullet.x -= 2; }
}

function validBullet(bullet) {
  if (bullet.x < 0 || bullet.x >= MAP_W || bullet.y < 0 || bullet.y >= MAP_H) {
    return false;
  }
  return true;
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

  // update bullets
  var new_bullets = [];
  print(g_bullets);
  for (var i = g_bullets.length - 1; i >= 0; i--) {
    updateBullet(g_bullets[i]);
    if (validBullet(g_bullets[i])) {
      new_bullets.push(g_bullets[i]);
    }
  }
  g_bullets = new_bullets;

  if (enemy.tank) {
    if (g_last_enemy && g_last_enemy.direction == enemy.tank.direction &&
        same(g_last_enemy.position, enemy.tank.position)) {
      var potential_bullet = {
        x: g_last_enemy.position[0],
        y: g_last_enemy.position[1],
        dirno: DIRS.indexOf(g_last_enemy.direction)
      };
      updateBullet(potential_bullet);
      g_bullets.push(potential_bullet);
    }
    g_last_enemy = enemy.tank;
  }
  else {
    g_last_enemy_pos = null;
  }

  if (enemy.bullet) {
    var sameLine = sameXY(enemy.bullet, g_me.tank);
    if (sameLine) {
      print("Found bullet!");
      g_bullets.push({
        x: enemy.bullet.position[0],
        y: enemy.bullet.position[1],
        dirno: DIRS.indexOf(enemy.bullet.direction)
      });
    }
  }

  if (enemy.tank && !me.bullet) {
    if (sameXY(me.tank, enemy.tank)) {
      me.fire();
      return;
    }

    var enemyDir = whichDir(me.tank, enemy.tank);
    if (enemyDir != -1) {
      turnTo(enemyDir);
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
    if (!me.bullet) { me.fire(); }

    resetDist();

    var penalty = [
      getPenalty(g_x, g_y - 1, 0),
      getPenalty(g_x + 1, g_y, 1),
      getPenalty(g_x, g_y + 1, 2),
      getPenalty(g_x - 1, g_y, 3)
    ];
    
    penalty[(g_cur_dirno + 2) % 4] += 2;
    penalty[(g_cur_dirno + 1) % 4] += 1;
    penalty[(g_cur_dirno + 3) % 4] += 1;
    
    go(penalty.indexOf(Math.min.apply(Math, penalty)));
  }
}

