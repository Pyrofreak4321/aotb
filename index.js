var gridSize = 30;
var halfGrid = gridSize/2;
var goodTracks = [];
var trackIndex = 0;
var trackInterval;

var drawing = false;
var working = false;

//initalize
function onload(){
  var body = document.getElementById('body');
  var h = body.clientHeight;
  var w = body.clientWidth;
  var canvas = document.getElementById('canvas');
  canvas.height = h;
  canvas.width = w;
  drawgrid();
}

//draw grid
function drawgrid(){
  var body = document.getElementById('body');
  var h = body.clientHeight;
  var w = body.clientWidth;
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  context.fillStyle = "#FFFFFF";

  context.strokeStyle = "#AAAAAA";

  context.fillRect(0,0,w,h);

  context.beginPath();
  for(var x = 0; x < w; x+=gridSize){
    context.moveTo(x,0);
    context.lineTo(x,h);
  }
  context.stroke();
  context.beginPath();
  for(var y = 0; y < h; y+=gridSize){
    context.moveTo(0,y);
    context.lineTo(w,y);
  }
  context.stroke();
}

//draw track
function draw(track){
  var body = document.getElementById('body');
  var h = body.clientHeight;
  var w = body.clientWidth;
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  drawgrid();
  offsetx = (canvas.width/2);
  offsety = (canvas.height/2);
  offsetx -= offsetx%gridSize;
  offsety -= offsety%gridSize;
  context.beginPath();
  for(var i = 0; i < track.pieces.length; i++){
    if(track.pieces[i].type == -1){
      context.fillStyle = "#00FF00";
    } else if(track.pieces[i].type == 0){
      context.fillStyle = "#FFFFFF";
    } else if(track.pieces[i].type == 1){
      context.fillStyle = "#ffa0a0";
    } else if(track.pieces[i].type == 2){
      context.fillStyle = "#ff5a5a";
    } else if(track.pieces[i].type == 4){
      context.fillStyle = "#FF00FF";
    } else if(track.pieces[i].type == 6){
      context.fillStyle = "#FFFF00";
    } else {
      context.fillStyle = "#FFFFFF";
    }

    context.strokeStyle = "rgb(0,0,0)";

    context.fillRect(offsetx+(track.pieces[i].pos[0]*gridSize),offsety+(track.pieces[i].pos[1]*gridSize),gridSize,gridSize);
    if(track.pieces[i].type == 4){
      context.fillRect(offsetx+((track.pieces[i].pos[0]-track.pieces[i].dir[0])*gridSize),offsety+((track.pieces[i].pos[1]-track.pieces[i].dir[1])*gridSize),gridSize,gridSize);
    }
    context.moveTo(offsetx+(track.pieces[i].pos[0]*gridSize)+halfGrid,offsety+(track.pieces[i].pos[1]*gridSize)+halfGrid);
    context.lineTo(offsetx+(track.pieces[i].pos[0]*gridSize)+((track.pieces[i].dir[0]*halfGrid)+halfGrid),offsety+(track.pieces[i].pos[1]*gridSize)+((track.pieces[i].dir[1]*halfGrid))+halfGrid);
  }
  context.stroke();

}

function drawGoodTracks(){
  if(!drawing){
    if(trackIndex < 0){
      trackIndex = 0;
    }
    drawing = true;
    if(trackIndex < goodTracks.length) draw(JSON.parse(goodTracks[trackIndex]));
    trackIndex++;
    if(trackIndex >= goodTracks.length){
      trackIndex = 0;
    }
    drawing = false;
  }
}

//run track generation
function threadGen(){
  var time;
  if(!working){
    goodTracks = [];
    working = true;
    if(trackInterval)clearInterval(trackInterval);
    trackInterval = setInterval(drawGoodTracks, 200);

    time = Date.now();
    if (typeof(w) == "undefined") {
        w = new Worker("./generator.js");
    }

    // tell worker piece pool
    console.log('start');
    //             S  L  R  r j i s
    w.postMessage([6,10,10,0,2,0,0]);

    w.onmessage = function(event){
      if(event.data.type == 0){
        trackIndex = goodTracks.length-1;
        goodTracks = goodTracks.concat(event.data.tracks);
        console.log('tracks :' + goodTracks.length);
      }
      else if(event.data.type == 1){
        goodTracks = goodTracks.concat(event.data.tracks);
        console.log('stop');
        console.log('time :' + (Date.now()-time));
        console.log('tracks :' + goodTracks.length);

        working = false;
        //loop drawing good tracks
        if(trackInterval)clearInterval(trackInterval);
        trackInterval = setInterval(drawGoodTracks, 100);
      }
    };
  }
}
