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

  if (map[x][y] == "x") {
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
function gen_dist(star) {
  if (!old_star || star[0] != old_star[0] || star[1] != old_star[1]) {
    print("Generating dist");
    dist = newDistArray();
    flood(dist, star[0], star[1], 0);
    old_star = star;
  }
}

function go(me, dir, cur_dir) {
  if (cur_dir == dir) {
    me.go();
  }
  else {
    var delta_dir = DIRS.indexOf(dir) - DIRS.indexOf(cur_dir);
    if (delta_dir == 1 || delta_dir == -3) { me.turn("right"); }
    else { me.turn("left"); }
  }
}

function try_go(me, dist, cur_dist, x, y, try_dir, cur_dir) {
  print("dir: " + try_dir);
  if (try_dir == "left") {
    if (x > 0 && dist[x - 1][y] < cur_dist) {
      go(me, "left", cur_dir);
      return true;
    }
  }
  else if (try_dir == "right") {
    if (x < MAP_W - 1 && dist[x + 1][y] < cur_dist) {
      go(me, "right", cur_dir);
      return true;
    }
  }
  else if (try_dir == "up") {
    if (y > 0 && dist[x][y - 1] < cur_dist) {
      go(me, "up", cur_dir);
      return true
    }
  }
  else if (try_dir == "down") {
    if (y < MAP_H - 1 && dist[x][y + 1] < cur_dist) {
      go(me, "down", cur_dir);
      return true;
    }
  }
}

function sameXY(moving_obj, target) {
  var x = moving_obj.position[0];
  var y = moving_obj.position[1];
  var dir = moving_obj.direction;

  var target_x = target.position[0];
  var target_y = target.position[1];
  var target_dir = target.direction;

  if (x == target_x && ((y < target_y && dir == "down") || (y > target_y && dir == "up"))) {
    return "x";
  }
  if (y == target_y && ((x < target_x && dir == "right") || (x > target_x && dir == "left"))) {
    return "y";
  }

  return false;
}

function onIdle(me, enemy, game) {
  var x = me.tank.position[0];
  var y = me.tank.position[1]
  var dir = me.tank.direction;
  var star = game.star;
  map = game.map;

  if (enemy.bullet) {
    var sameLine = sameXY(enemy.bullet, me.tank);
    if (sameLine == "x") {
      print("Found bullet X")
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
      print("Found bullet Y")
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

  if (star) {
    print("Found star!");

    gen_dist(star);

    var cur_dist = dist[x][y];
    var dirno = DIRS.indexOf(dir);

    var did_go = try_go(me, dist, cur_dist, x, y, DIRS[dirno], dir);
    if (!did_go) {
      did_go = try_go(me, dist, cur_dist, x, y, DIRS[(dirno + 1) % 4], dir);
    }
    if (!did_go) {
      did_go = try_go(me, dist, cur_dist, x, y, DIRS[(dirno + 3) % 4], dir);
    }
    if (!did_go) {
      did_go = try_go(me, dist, cur_dist, x, y, DIRS[(dirno + 2) % 4], dir);
    }
  }
  else {
    // TODO
    if (!me.bullet) { me.fire(); }
    else {
      me.turn("left");
    }
  }
}
