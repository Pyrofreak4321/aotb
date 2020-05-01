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
      s = 'l';
      break;
    case RIGHT:
      s = 'r';
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

function weigh(item){
  item.weight = 1;
  var lastType = -99;
  item.tpath = '';
  for(var i = 0; i < item.pieces.length; i++){
    switch (item.pieces[i].type) {
      // case STRAIGHT:
      case LEFT:
      case RIGHT:
        item.weight++;
        break;
      case RAMP:
        item.weight+=1;
        break;
      case INTERSECTION:
      case JUMP:
        item.weight+=4;
        break;
    }
    // if(item.pieces[i].type == lastType && lastType != STRAIGHT){
    //   item.weight++;
    // }
    for(var c = 0; c < item.pieces.length; c++){
      if(i!=c && item.pieces[i].pos[0]==item.pieces[c].pos[0] &&
                  item.pieces[i].pos[1]==item.pieces[c].pos[1] &&
                  (item.pieces[i].type!=STRAIGHT ||
                  (item.pieces[i].pos[0]==0 && item.pieces[c].pos[0]!=0)||
                  (item.pieces[i].pos[1]==0 && item.pieces[c].pos[1]!=0))){
        item.weight+=1;
      }
    }
    item.tpath += stringify(item.pieces[i]);
  }
  //item.tpath+=item.tpath;

  var res = item.tpath.match(/l(s|u)ll(s|u)l/gi);
  if(res)item.weight += res.length*2;
  res = item.tpath.match(/r(s|u)rr(s|u)r/gi);
  if(res)item.weight += res.length*2;
  res = item.tpath.match(/(llrr|rrll)/gi);
  if(res)item.weight += res.length*2;
  res = item.tpath.match(/(rrr|lll)/gi);
  if(res)item.weight += res.length*3;

}

onmessage = function(e) {
  var newTracks = [];
  var msg = JSON.parse(e.data);
  for(i = 0; i < msg.tracks.length; i++){
    weigh(msg.tracks[i]);
    msg.tracks[i].diff = 1;
  }
  msg.tracks.sort(function(a,b){
    return (b.weight/b.diff)-(a.weight/a.diff)
  });
  postMessage(JSON.stringify({type: 1, tracks: msg.tracks}));
}
