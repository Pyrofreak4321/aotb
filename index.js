var gridSize = 30;
var halfGrid = gridSize/2;
var goodTracks = [];
var trackIndex = 0;
var trackInterval;

var drawing = false;
var working = false;

var STRAIGHT = 2;
var LEFT = 1;
var RIGHT = 0;
var JUMP = 3;
var RAMP = 4;
var INTERSECTION = 5;
var BOOST = 6;

var focusLayer = 0;

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

  context.globalAlpha = 1;
  
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

  for (var i = 0; i <= 1; i++) {
    context.lineWidth = 5;
    context.lineCap = "round";
    //context.globalAlpha = 0.5;
    for(var s = 0; s < track.pieces.length; s++){
      if(track.pieces[s].pos[2]==i){
        if(i == (focusLayer - 1)) 
          context.globalAlpha = 0.125;
        else
          context.globalAlpha = 0.5;
        if(track.pieces[s].type == -1){
          context.fillStyle = "#00FF00";
        } else if(track.pieces[s].type == STRAIGHT){
          context.fillStyle = "#FFFFFF";
        } else if(track.pieces[s].type == LEFT){
          context.fillStyle = "#ffa0a0";
        } else if(track.pieces[s].type == RIGHT){
          context.fillStyle = "#ff5a5a";
        } else if(track.pieces[s].type == JUMP){
          context.fillStyle = "#FF00FF";
        } else if(track.pieces[s].type == RAMP){
          context.fillStyle = "#0000FF";
        } else if(track.pieces[s].type == BOOST){
          context.fillStyle = "#FFFF00";
        } else if(track.pieces[s].type == INTERSECTION){
          context.fillStyle = "#606060";
        } else {
          context.fillStyle = "#FFFFFF";
        }

        context.fillRect(offsetx+(track.pieces[s].pos[0]*gridSize),offsety+(track.pieces[s].pos[1]*gridSize),gridSize,gridSize);
        if(track.pieces[s].type == JUMP){
          context.fillRect(offsetx+((track.pieces[s].pos[0]-track.pieces[s].dir[0])*gridSize),offsety+((track.pieces[s].pos[1]-track.pieces[s].dir[1])*gridSize),gridSize,gridSize);
        }
      }
    }
    context.globalAlpha = 1;
    for(var l = 0; l < track.pieces.length; l++){
      if(track.pieces[l].pos[2]==i){
        if(i == (focusLayer - 1)) 
          context.globalAlpha = 0.25;
        else
          context.globalAlpha = 1;
        context.beginPath();
        if(track.pieces[l].pos[2]==1){
          context.strokeStyle = "#0000af";
        } else {
          context.strokeStyle = "#000000";
        }
        context.moveTo(offsetx+(track.pieces[l].pos[0]*gridSize)+halfGrid,offsety+(track.pieces[l].pos[1]*gridSize)+halfGrid);
        context.lineTo(offsetx+(track.pieces[l].pos[0]*gridSize)+((track.pieces[l].dir[0]*gridSize)+halfGrid),offsety+(track.pieces[l].pos[1]*gridSize)+((track.pieces[l].dir[1]*gridSize))+halfGrid);
        context.stroke();
      }
    }
    context.lineWidth = 1;
  }
}

function drawGoodTracks(){
  if(!drawing){
    drawing = true;
    if(trackIndex < 0){
      trackIndex = 0;
    }
    if(trackIndex >= goodTracks.length){
      trackIndex = 0;
    }
    if(trackIndex < goodTracks.length) draw(JSON.parse(goodTracks[trackIndex]));
    drawing = false;
  }
}

function switchLayer(){
	/* 
	* fL 0 = No focused layer
	* fL 1 = Darken first layer
	* fL 2 = Darken second layer
	* 
  * Adding 2 and using modulus to make button order:
	* First press = first layer focus
	* Second press = second layer focus
	* Third press = no focus
  * Repeat
	*/
	focusLayer = (focusLayer + 2) % 3;
}

//run track generation
function threadGen(){
  var time;
  if(!working){
    goodTracks = [];
    working = true;
    trackIndex = 0;

    if(trackInterval)clearInterval(trackInterval);
    trackInterval = setInterval(function(){drawGoodTracks(); trackIndex++;}, 100);

    time = Date.now();
    if (typeof(w) == "undefined") {
        w = new Worker("./generator.js");
    }

    // tell worker piece pool
    console.log('start');
    w.postMessage([10,10,10,2,4,2,0]);
    //             L R S J R X B

    w.onmessage = function(event){
      if(event.data.type == 0){
        //trackIndex = goodTracks.length-1;
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
        // if(trackInterval)clearInterval(trackInterval);
        // trackInterval = setInterval(drawGoodTracks, 500);
      }
    };
  }
}

function shift(event){
  var x = event.keyCode;
  if(x == 37){
    if(trackInterval){
      clearInterval(trackInterval);
      trackInterval = null;
    }
    trackIndex--;
    drawGoodTracks();
  } else if (x == 39){
    if(trackInterval){
      clearInterval(trackInterval);
      trackInterval = null;
    }
    trackIndex++;
    drawGoodTracks();
  } else if (x == 32){
    if(trackInterval){
      clearInterval(trackInterval);
      trackInterval = null;
    }
    else
      trackInterval = setInterval(function(){drawGoodTracks(); trackIndex++;}, 100);
  }
}
