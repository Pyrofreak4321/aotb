
var goodTracks = [];
var ready = true;

//rotate left
function left(dir){
  var a = [0,0];
  if(dir[0]==-1 && dir[1]==0){
    a[0] = 0;
    a[1] = -1;
  } else if(dir[0]==0 && dir[1]== -1){
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

//check if slot is open
function posOpen(track){
  var lastpiece = track.pieces[track.pieces.length-1];
  var hit = 1;
  var pos = [lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]];
  for(var i = 0; i < track.pieces.length && hit==1; i++){
    if(track.pieces[i].pos[0] == pos[0] && track.pieces[i].pos[1] == pos[1]){
      hit = 0;
      //check if is start piece
      if((track.pieces[i].type == -1 && track.pieces[i].dir[0] == lastpiece.dir[0] && track.pieces[i].dir[1] == lastpiece.dir[1])){
        hit = -1;
      }
    }
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

//gets char code for piece
function stringify(p){
  var s=' ';
  switch (p.type) {
    case -1:
      s = 's';
      break;
    case 0:
      s = 's';
      break;
    case 1:
      s = 'c';
      break;
    case 2:
      s = 'c';
      break;
  }
  return s;
}

//adds peoce to track
function addPiece(track, type){
  var result = posOpen(track);
  if(result==1){
    var lastpiece = track.pieces[track.pieces.length-1];
    if(type == 0){
      track.pieces.push({
        type:type,
        pos:[lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]],
        dir: [lastpiece.dir[0],lastpiece.dir[1]],
      });
      track.pool[type]--;
    }
    else if(type == 1){
      track.pieces.push({
        type:type,
        pos:[lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]],
        dir: left(lastpiece.dir),
      });
      track.pool[type]--;
      track.pool[type+1]--;
    }
    else if(type == 2){
      track.pieces.push({
        type:type,
        pos:[lastpiece.pos[0]+lastpiece.dir[0],lastpiece.pos[1]+lastpiece.dir[1]],
        dir: right(lastpiece.dir),
      });
      track.pool[type]--;
      track.pool[type-1]--;
    }

    return nextPiece(track,-1);
  }
  else if(result==-1){
    var item = {
      pieces: track.pieces,
      path: track.pieces.map(stringify).join('')
    };

    var good = true;
    var path = item.path+item.path;
    for(var x = 0; x < goodTracks.length; x++){
      if(path.includes(goodTracks[x].path) && goodTracks[x].path.length == item.path.length){
        good = false;
      }
    }

    if (good){
      goodTracks.push(JSON.parse(JSON.stringify(item))); //super simple clone
    }
    return -1;
  }
  else{
    return -1;
  }
}

//remove piece from track
function pop(track){
  var piece = track.pieces.pop();
  track.pool[piece.type]++;
  //acount for corners
  if(piece.type==1){
    track.pool[piece.type+1]++;
  } else if(piece.type == 2){
    track.pool[piece.type-1]++;
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
    do{
      result = pop(track);
    }while(result < 0 && track.pieces.length > 0);
    if(track.pieces.length > 0){
      return result;
    }
  }
  return -1;
}

var doGenRes = 0;

//when the worker gets the pool
onmessage = function(e) {
  goodTracks = [];

  var newTrack = {
    //      S L R r j i s
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
  postMessage(goodTracks);
};
