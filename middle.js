var goodTracks, newTracks, garbage;
var time;
var working;

function filter(track){
  var good = true;
  var path = track.path+track.path;
  for(var y = 0; y < goodTracks.length && good; y++){
    if(path.includes(goodTracks[y].path) && goodTracks[y].path.length == track.path.length){
      good = false;
    }
  }
  if(good) {
    goodTracks.push({path:track.path});
    newTracks.push(JSON.stringify(track));
  } else {
    garbage++;
  }
}
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
      case 4:
        s = 'j';
        break;
      case 6:
        s = 'b';
        break;
  }
  return s;
}


onmessage = function(e) {
  if(!working){
    var passtimer = Date.now();
    var delay = 1000;
    garbage = 0;
    goodTracks = [];
    newTracks = [];
    working = true;

    time = Date.now();
    if (typeof(w) == "undefined") {
        w = new Worker("./generator.js");
    }

    // tell worker piece pool
    console.log('start');
    w.postMessage(e.data);

    w.onmessage = function(event){
      if(event.data.type == 0){
        for(var i = 0; i < event.data.track.pieces.length; i++){
          event.data.track.path += stringify(event.data.track.pieces[i]);
        }
        filter(event.data.track);
        if((Date.now()-passtimer) > delay){
            postMessage({type: 0, tracks: newTracks});
            console.log('trash :'+garbage);
            newTracks = [];
            garbage = 0;
            passtimer = Date.now();
            delay=5000;
        }
      }
      else if(event.data.type == 1){
        console.log('stop');
        // goodTracks = event.data.tracks;
        console.log('time :' + (Date.now()-time));
        console.log('tracks :' + goodTracks.length);

        postMessage({type: 1,});// tracks: goodTracks});

        working = false;
      }
    };
  }
};
