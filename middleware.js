var goodTracks = [];
var newTracks = [];

//changed these to consts and put them in number-order - caused errors, changed back to var
var START = -1;
var RIGHT = 0;
var LEFT = 1;
var STRAIGHT = 2;
var BOOST = 3;
var RAMP = 4;
var INTERSECTION = 5;
var JUMP = 6;


function stringify(p){
  var s=' ';
  switch (p.type) {
    case START:
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
    case RAMP:
      s = 's';
      break;
    case INTERSECTION:
      s = 'x';
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
    newTracks.push({pieces: item.pieces, path:itemPath});
    //postMessage({type: 0, tracks: item});
  }
}

onmessage = function(e) {
  var tracks = JSON.parse(e.data.tracks);
  for(i = 0; i < tracks.length; i++){
    filter(tracks[i]);
  }

  postMessage({type: e.data.type, tracks: JSON.stringify(newTracks)});
  newTracks = [];
}
