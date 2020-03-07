var dead, dupe;
var goodTracks = [];
var newTracks = [];
var ready = true;
var consecStraight = 0;
var imAlive = 0;

var STRAIGHT = 2;
var LEFT = 0;
var RIGHT = 1;
var JUMP = 3;
var BOOST = 4;

//rotate left
function left(dir){
  var a = [0,0];
  if(dir[0]==-1 && dir[1]==0){
    a[0] = 0;
    a[1] = -1;
  } else if(dir[0]==0 && dir[1]==-1){
    a[0] = 1;
    a[1] = 0;
  } else if(dir[0]==1 && dir[1]==0){
    a[0] = 0;
    a[1] = 1;
  } else if(dir[0]==0 && dir[1]==1){
    a[0] = -1;
    a[1] = 0;
  }
  return a;
}
//rotate right
function right(dir){
  var a = [0,0];
  if(dir[0]==-1 && dir[1]==0){
    a[0] = 0;
    a[1] = 1;
  } else if(dir[0]==0 && dir[1]== -1){
    a[0] = -1;
    a[1] = 0;
  } else if(dir[0]==1 && dir[1]==0){
    a[0] = 0;
    a[1] = -1;
  } else if(dir[0]==0 && dir[1]==1){
    a[0] = 1;
    a[1] = 0;
  }
  return a;
}

function testDir(track){
  var dir = track.pieces[track.pieces.length-1].dir;
  var result = 1;
  if(dir[0]==-1 && dir[1]==0){
    if(track.pool[1] < 1){
      result = 0;
    }
  } else if(dir[0]==1 && dir[1]==0){
    if(track.pool[1] < 1){
      result = 0;
    }
  } else if(dir[0]==0 && dir[1]==1){
    if(track.pool[1] < 2){
      result = 0;
    }
  }
  return result;
}

function testRange(track){
  var dist = Math.abs(track.pieces[track.pieces.length-1].pos[0])+Math.abs(track.pieces[track.pieces.length-1].pos[1])-1;
  var range = 0;
  for(i = 0; i < track.pool.length; i++){
    if(i == 1 || i==2){
      range += (track.pool[i]/2);
    } else {
      range += track.pool[i];
    }
  }
  if(range < dist){
    return 0;
  } else {
    return 1;
  }
}

function testHit(piece, type, pos, dir){
  var hit = 1;
  if((piece.pos[0] == pos[0] && piece.pos[1] == pos[1]) || (piece.type == JUMP && ((piece.pos[0]-piece.dir[0]) == pos[0] && (piece.pos[1]-piece.dir[1]) == pos[1]))){
    hit = 0;
    if(type != JUMP && (piece.type == -1 && piece.dir[0] == dir[0] && piece.dir[1] == dir[1])){
      hit = -1;
    }
    else if(((piece.type == JUMP && type != JUMP)||(piece.type != JUMP && type == JUMP)) && ((piece.dir[0]==0 && dir[0] != 0)||(piece.dir[1]==0 && dir[1] != 0))){
      hit = 1;
    }
  }
  return hit;
}

//check if slot is open
function posOpen(track, type){
  var lastpiece = track.pieces[track.pieces.length-1];
  var hit = 1;
  var pos = [lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]];

  for(var i = 0; i < track.pieces.length && hit==1; i++){
     hit = testHit(track.pieces[i], type, pos, lastpiece.dir);
  }

  if(type == JUMP && hit == 1){
    pos[0] += lastpiece.dir[0];
    pos[1] += lastpiece.dir[1];
    for(var ii = 0; ii < track.pieces.length && hit==1; ii++){
      hit = testHit(track.pieces[ii], type, pos, lastpiece.dir);
    }
  }

  if(hit == 1){
    hit = testRange(track);
  }

  if(hit == 1){
    hit = testDir(track);
  }

  return hit;
}

//get the next piece type
function nextPiece(track, next){
  var type = next+1;
  while(track.pool[type] <= 0 && type < track.pool.length){
    type++;
  }
  return type;
}

//debug tool
function print(track){
  var s = '';
  for(var i = 0; i < track.pieces.length; i++){
    s+= track.pieces[i].type + ' ';
  }
  return s;
}

function stringify(p){
  var s=' ';
  switch (p.type) {
    case -1:
      s = 's';
      break;
    case STRAIGHT:
      s = 's';
      break;
    case LEFT:
      s = 'c';
      break;
    case RIGHT:
      s = 'c';
      break;
    case JUMP:
      s = 'j';
      break;
    case BOOST:
      s = 'b';
      break;
  }
  return s;
}

function filter(item){
  var good = true;
  var itemPath = '';
  for(var i = 0; i < item.pieces.length; i++){
    itemPath += stringify(item.pieces[i]);
  }
  var path = itemPath+itemPath;
  for(var y = 0; y < goodTracks.length && good; y++){
    if(goodTracks[y].length == itemPath.length && path.includes(goodTracks[y]) ){
      good = false;
    }
  }
  if(good){
    goodTracks.push(itemPath);
    newTracks.push(JSON.stringify({pieces: item.pieces}));
    //postMessage({type: 0, tracks: item});
  }else {
    dupe++;
  }
}

function storeTrack(track){
  filter(track);
  if(newTracks.length >= 1000){
    postMessage({type: 0, tracks: newTracks});
    newTracks = [];
    imAlive = Date.now();
  }
}

//adds peoce to track
function addPiece(track, type){
  var result = posOpen(track,type);
  if(result==1){
    var lastpiece = track.pieces[track.pieces.length-1];
    if(type == STRAIGHT){
      consecStraight++;
      track.pieces.push({
        type:type,
        pos:[lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]],
        dir: [lastpiece.dir[0],lastpiece.dir[1]],
      });
      track.pool[type]--;
    }
    else if(type == LEFT){
      consecStraight = 0;
      track.pieces.push({
        type:type,
        pos:[lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]],
        dir: left(lastpiece.dir),
      });
      track.pool[LEFT]--;
      track.pool[RIGHT]--;
    }
    else if(type == RIGHT){
      consecStraight = 0;
      track.pieces.push({
        type:type,
        pos:[lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]],
        dir: right(lastpiece.dir),
      });
      track.pool[LEFT]--;
      track.pool[RIGHT]--;
    }
    else if(type == JUMP){
      consecStraight = 0;
      track.pieces.push({
        type:type,
        pos:[lastpiece.pos[0]+(lastpiece.dir[0]*2),lastpiece.pos[1]+(lastpiece.dir[1]*2)],
        dir: [lastpiece.dir[0],lastpiece.dir[1]],
      });
      track.pool[type]--;
    }

    if(posOpen(track) == -1){
      storeTrack(track);
      return -1;
    }
    return nextPiece(track,-1);
  }
  else{
    dead++;
    return -1;
  }
}

//remove piece from track
function pop(track){
  var piece = track.pieces.pop();
  track.pool[piece.type]++;
  //acount for corners
  if(piece.type==LEFT){
    track.pool[RIGHT]++;
  } else if(piece.type == RIGHT){
    track.pool[LEFT]++;
  }
  var type = nextPiece(track, piece.type);
  if(type < track.pool.length && track.pool[type] > 0){
    return type;
  }
  else {
    return -1;
  }
}

// main logic loop
function doGen(track,type){
  var result = addPiece(track,type);
  if(result >= 0 && type < track.pool.length && track.pool[result] > 0){
    return result;
  } else {
    if((Date.now() - imAlive) > 30000)
    {
      console.log('i\'m Alive');
      imAlive = Date.now();
    }
    do{
      result = pop(track);
    }while(result < 0 && track.pieces.length > 0);
    if(track.pieces.length > 0){
      //console.log(result);
      return result;
    }
  }
  return -1;
}

var doGenRes = 0;

//when the worker gets the pool
onmessage = function(e) {
  imAlive = Date.now();
  consecStraight = 0;
  goodTracks = [];
  newTracks = [];
  dupe = 0; dead = 0;

  var newTrack = {
    pool : e.data,
    pieces:[{
      type:-1,
      pos:[0,0],
      dir:[0,-1], //north
    }],
  };

  //LOOP
  do{
    doGenRes = doGen(newTrack,doGenRes);
  }while(doGenRes >= 0);

  //send good tracks back
  postMessage({type: 1, tracks: newTracks, dupes:dupe, invalid: dead});
};
