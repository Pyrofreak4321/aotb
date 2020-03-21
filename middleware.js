var goodTracks;
var newTracks;
var dead, dupe;

var STRAIGHT = 2;
var LEFT = 1;
var RIGHT = 0;
var JUMP = 3;
var RAMP = 4;
var INTERSECTION = 5;
var BOOST = 6;

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
  var itemPath = item.path;
  // for(var i = 0; i < item.pieces.length; i++){
  //   itemPath += stringify(item.pieces[i]);
  // }
  var path = itemPath+itemPath;
  for(var y = 0; y < goodTracks.length && good; y++){
    if(goodTracks[y].length == itemPath.length && path.includes(goodTracks[y]) ){
      good = false;
    }
  }
  if(good){
    goodTracks.push(itemPath);
    newTracks.push(JSON.stringify({pieces: item.pieces, path:itemPath}));
    //postMessage({type: 0, tracks: item});
  }else {
    dupe++;
  }
}

var w;
var working = false;
onmessage = function(e) {
  if(!working){
    goodTracks = [];
    newTracks = [];
    working = true;
    if (typeof(w) == "undefined") {
        w = new Worker("./generator.js");
    }
    w.postMessage(e.data);

    w.onmessage = function(event){
      if(event.data.type == 0){
        for(i = 0; i < event.data.tracks.length; i++){
          filter(JSON.parse(event.data.tracks[i]));
        }
        if(newTracks.length >= 500){
          postMessage({type: 0, tracks: newTracks});
          newTracks = [];
        }
        //trackIndex = goodTracks.length-1;
        // goodTracks = goodTracks.concat(event.data.tracks);
        console.log('tracks :' + goodTracks.length);
      }
      else if(event.data.type == 1){
        for(i = 0; i < event.data.tracks.length; i++){
          filter(event.data.tracks[i]);
        }
        postMessage({type: 1, tracks: newTracks});
        newTracks = [];
        working = false;
      }
    };
  }
};
