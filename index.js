var defaultGridSize = 90;
var gridSize = defaultGridSize;
var halfGrid = gridSize/2;
var goodTracks = [];
var currentTrack;

var tracksPerRow = 6;
var tracksPerCol = 5;
var trackIndex = 0;
var trackInterval;

var jumpFlag = false;
var rightClick = false;
var dragging = false;
var pieAddMenuOpen = false;
var pieEditMenuOpen = false;
var drawing = false;

var working = false;
var generatorThread = null;
var filterThread = null;

//changed these to consts and put them in number-order - caused errors, changed back to var
var START = -1;
var RIGHT = 0;
var LEFT = 1;
var STRAIGHT = 2;
var BOOST = 3;
var RAMP = 4;
var INTERSECTION = 5;
var JUMP = 6;

var IMAGES = [document.getElementById("imgStart"),document.getElementById("imgCornerR"), document.getElementById("imgCornerL"), document.getElementById("imgStraight"),
  document.getElementById("imgBoost"), document.getElementById("imgRamp"), document.getElementById("imgIntersection"),
  document.getElementById("imgJumpCatch"), document.getElementById("imgJumpLaunch")];

var ctrlPrefix = ['corner_','corner_','straight_','boost_','ramp_','intersection_','jump_'];

//transform controls
var focusLayer = 0;
var scale = 1;
var panX = 0;
var panY = 0;

// specifically for mouse panning
var startingScale = 1;
var startingWidth = 1;
var startX = null;
var startY = null;
var originX = null;
var originY = null;
var selectedTrackPieceX = null;
var selectedTrackPieceY = null;
var selectedGridPieceX = null;
var selectedGridPieceY = null;
var selectedPieceIndex = -1;
var selectedTrackIndex = -1;

CANTOUCH = ('ontouchstart' in document.documentElement);
function updateTouchEvent(e){
  e.clientX = (e.touches.item(0)||e.changedTouches.item(0)).clientX;
  e.clientY = (e.touches.item(0)||e.changedTouches.item(0)).clientY;
  e.isTouch = true;
}

//initalize
function onload() {
    //handler for when the window's resized
    window.addEventListener('resize', function () {
        drawResize();
    });
    var body = document.getElementById('body');
    var h = body.clientHeight;
    var w = body.clientWidth;
    var canvas = document.getElementById('canvas');
    canvas.height = h;
    canvas.width = w;
    clearTrack();
    if(CANTOUCH){
      //Because !#$%&! apple
      document.addEventListener('touchmove', function (event) {
        if (event.scale && event.scale !== 1) { event.preventDefault(); }
      }, { passive: false });

      canvas.addEventListener('touchstart', doTouch, { passive: false })
    } else {
      canvas.addEventListener("wheel", wheelZoom); // scroll zoom event listener
      canvas.addEventListener("mousedown", doMouseDown);
    }
    document.getElementById('genMenu').addEventListener("click", preventDef);
    document.getElementById('resMenu').addEventListener("click", preventDef);
    document.getElementById('partsList').addEventListener("click", preventDef);
    document.getElementById('helpMenu').addEventListener("click", preventDef);
    document.getElementById('trackContainer').addEventListener("click", selectTrack);
    document.getElementById('trackContainer').addEventListener("wheel", wheelTracks);

    setTimeout(function () {
      if(!localStorage.getItem("firstTime")){
        localStorage.setItem("firstTime", "true");
        showHelpMenu();
      }
    }, 10);

    recover();

    setInterval(function () {
      if(currentTrack!=null){
      localStorage.setItem("currentTrack", JSON.stringify(currentTrack));}
    }, 3000);

    alertify.defaults.glossary.title = 'Track Builder';
    alertify.defaults.theme.cancel = '_red';
    alertify.defaults.theme.ok = '_green';
    alertify.defaults.transition = 'fade';
}
function recover(){
  var recoveredTrack = localStorage.getItem("currentTrack");
  try{
    var parsedTrack = JSON.parse(recoveredTrack);
    if(parsedTrack!=null){
      if(parsedTrack.hasOwnProperty('pieces')){
        currentTrack = parsedTrack;
        drawCurrentTrack();
      }
    }
  }catch(err){
    console.log('Invalid local storage item.');
  }
}


function clearPrompt(){
  alertify.confirm('Are you sure you want to delete this track?', function() {
    clearTrack()
  }).set('reverseButtons', true);
}

function clearTrack() {
    currentTrack = {
        pieces: [
            { type: -1, pos: [0, 0, 0], dir: [0, -1] }
        ]
    };
    resetScale();
    focusLayer = 0;
    drawCurrentTrack();
}

function cleanTrack() {
  for(var i = 0; i < currentTrack.pieces.length; i++){
    currentTrack.pieces[i].bad = false;
    currentTrack.pieces[i].crossed = false;
    switch(currentTrack.pieces[i].type){
      case STRAIGHT:
      case BOOST:
      case RAMP:
        if((0>isSpaceOccupied(currentTrack.pieces[i].pos[0]-currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]-currentTrack.pieces[i].dir[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]-currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]-currentTrack.pieces[i].dir[1],1)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],1))){
          currentTrack.pieces.splice(i,1);
          i--;
        }
        break;
      case RIGHT:
        if((0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+right(currentTrack.pieces[i].dir)[0],currentTrack.pieces[i].pos[1]+right(currentTrack.pieces[i].dir)[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+right(currentTrack.pieces[i].dir)[0],currentTrack.pieces[i].pos[1]+right(currentTrack.pieces[i].dir)[1],1)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],1))){
          currentTrack.pieces.splice(i,1);
          i--;
        }
        break;
      case LEFT:
        if((0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+left(currentTrack.pieces[i].dir)[0],currentTrack.pieces[i].pos[1]+left(currentTrack.pieces[i].dir)[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+left(currentTrack.pieces[i].dir)[0],currentTrack.pieces[i].pos[1]+left(currentTrack.pieces[i].dir)[1],1)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],1))){
          currentTrack.pieces.splice(i,1);
          i--;
        }
        break;
      case JUMP:
        if((0>isSpaceOccupied(currentTrack.pieces[i].pos[0]-(currentTrack.pieces[i].dir[0]*2),currentTrack.pieces[i].pos[1]-(currentTrack.pieces[i].dir[1]*2),0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],0))){
          currentTrack.pieces.splice(i,1);
          i--;
        }
        break;
      case INTERSECTION:
        if((0>isSpaceOccupied(currentTrack.pieces[i].pos[0]-currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+currentTrack.pieces[i].dir[0],currentTrack.pieces[i].pos[1]+currentTrack.pieces[i].dir[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+left(currentTrack.pieces[i].dir)[0],currentTrack.pieces[i].pos[1]+left(currentTrack.pieces[i].dir)[1],0)&&
          0>isSpaceOccupied(currentTrack.pieces[i].pos[0]+right(currentTrack.pieces[i].dir).dir[0],currentTrack.pieces[i].pos[1]+right(currentTrack.pieces[i].dir)[1],0))){
          currentTrack.pieces.splice(i,1);
          i--;
        }
        break;
    }
  }

  function processPiece(lastpiece){
    console.log(lastpiece);
    var flag = false;
    for(var n = 0; n < pieces.length && !flag; n++){
      switch(pieces[n].type){
        case STRAIGHT:
        case BOOST:
          flag = lastpiece.pos[0]+lastpiece.dir[0] == pieces[n].pos[0] &&
            lastpiece.pos[1]+lastpiece.dir[1] == pieces[n].pos[1] &&
            lastpiece.pos[2] == pieces[n].pos[2];
          if(flag && lastpiece.dir[0] == pieces[n].dir[0] && lastpiece.dir[1] == pieces[n].dir[1]){
            flag = true;
          } else if(flag && lastpiece.dir[0] == -pieces[n].dir[0] && lastpiece.dir[1] == -pieces[n].dir[1]){
            pieces[n].dir = lastpiece.dir;
            flag = true;
          } else flag = false;
          break;
        case RAMP:
          flag = lastpiece.pos[0]+lastpiece.dir[0] == pieces[n].pos[0] &&
            lastpiece.pos[1]+lastpiece.dir[1] == pieces[n].pos[1];

            if(flag && lastpiece.dir[0] == pieces[n].dir[0] && lastpiece.dir[1] == pieces[n].dir[1]){
              flag = true;
            } else if(flag && lastpiece.dir[0] == -pieces[n].dir[0] && lastpiece.dir[1] == -pieces[n].dir[1]){
              pieces[n].dir = lastpiece.dir;
              flag = true;
            } else flag = false;
          break;
        case RIGHT:
          flag = lastpiece.pos[0]+lastpiece.dir[0] == pieces[n].pos[0] &&
            lastpiece.pos[1]+lastpiece.dir[1] == pieces[n].pos[1] &&
            lastpiece.pos[2] == pieces[n].pos[2];
          if(flag && lastpiece.dir[0] == -pieces[n].dir[0] && lastpiece.dir[1] == -pieces[n].dir[1]){
            pieces[n].type = LEFT;
            pieces[n].dir = right(pieces[n].dir);
            flag = true;
          }else if(flag && lastpiece.dir[0] == left(pieces[n].dir)[0] && lastpiece.dir[1] == left(pieces[n].dir)[1]){
            flag = true;
          }else flag = false;
          break;
        case LEFT:
          flag = lastpiece.pos[0]+lastpiece.dir[0] == pieces[n].pos[0] &&
            lastpiece.pos[1]+lastpiece.dir[1] == pieces[n].pos[1] &&
            lastpiece.pos[2] == pieces[n].pos[2];
          if(flag && lastpiece.dir[0] == -pieces[n].dir[0] && lastpiece.dir[1] == -pieces[n].dir[1]){
            pieces[n].type = RIGHT;
            pieces[n].dir = left(pieces[n].dir);
            flag = true;
          }else if(flag && lastpiece.dir[0] == right(pieces[n].dir)[0] && lastpiece.dir[1] == right(pieces[n].dir)[1]){
            flag = true;
          }else flag = false;
          break;
        case JUMP:
          flag = lastpiece.pos[0]+(lastpiece.dir[0]*2) == pieces[n].pos[0] &&
            lastpiece.pos[1]+(lastpiece.dir[1]*2) == pieces[n].pos[1] &&
            lastpiece.pos[2] == pieces[n].pos[2];
            if(flag && lastpiece.dir[0] == pieces[n].dir[0] && lastpiece.dir[1] == pieces[n].dir[1]){
              flag = true;
            } else if(flag && lastpiece.dir[0] == -pieces[n].dir[0] && lastpiece.dir[1] == -pieces[n].dir[1]){
              pieces[n].dir = lastpiece.dir;
              flag = true;
            } else flag = false;
          break;
        case INTERSECTION:
          flag = lastpiece.pos[0]+lastpiece.dir[0] == pieces[n].pos[0] &&
            lastpiece.pos[1]+lastpiece.dir[1] == pieces[n].pos[1] &&
            lastpiece.pos[2] == pieces[n].pos[2];
          break;
      }

      if(flag){
        if(pieces[n].type == INTERSECTION){
          pieces[n].dir = lastpiece.dir;
          if(!pieces[n].crossed){
            pieces[n].crossed = true
            processPiece(pieces[n]);
          } else {
            currentTrack.pieces.push(pieces[n]);
            var nextPiece = pieces.splice(n,1)[0];
            processPiece(nextPiece);
          }
        } else {
          currentTrack.pieces.push(pieces[n]);
          var nextPiece = pieces.splice(n,1)[0];
          processPiece(nextPiece);
        }
      }
    }
  }
  var pieces = currentTrack.pieces;
  currentTrack.pieces = [];

  currentTrack.pieces.push(pieces[0]);
  processPiece(pieces.splice(0,1)[0]);

  for(var i = 0; i < pieces.length; i++){
    pieces[i].bad = true;
    currentTrack.pieces.push(pieces[i]);
  }

  drawCurrentTrack();
}



function drawGrid(canvas, size) {
    var h = canvas.height;
    var w = canvas.width;
    //let canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // Enforce global alpha of 1 to prevent ghosting
    context.globalAlpha = 1;

    context.clearRect(0, 0, w, h);

    context.fillStyle = "#FFFFFF";
    context.strokeStyle = "#AAAAAA";

    context.beginPath();
    for (var x = 0; x <= w + size; x += size) {
        // Draw one tile further offscreen to try to stop panning into blank space
        context.moveTo(x + (panX % size), 0);
        context.lineTo(x + (panX % size), h);
    }
    context.stroke();
    context.beginPath();
    for (var y = 0; y <= h + size; y += size) {
        context.moveTo(0, y + (panY % size));
        context.lineTo(w, y + (panY % size));
    }
    context.stroke();
}

function drawResize() {
    var body = document.getElementById('body');
    var h = body.clientHeight;
    var w = body.clientWidth;
    var canvas = document.getElementById('canvas');
    canvas.height = h;
    canvas.width = w;
    drawCurrentTrack();
}

//draw each layer from bottom to top
function draw(track, canvas, size, x, y, layer) {
    var context = canvas.getContext('2d');
    var offsetx = x;
    var offsety = y;
    var curImage;
    var c2 = document.createElement("canvas");
    var ctx2 = c2.getContext("2d");
    c2.width = size;
    c2.height = size;
    //draw each layer from bottom to top
    for (var i = 0; i <= 1; i++) {
        for (var s = 0; s < track.pieces.length; s++) {
            //if this is on the layer currently being drawn
            if (track.pieces[s].pos[2] == i) {
                if (i != layer && layer <= 1 && track.pieces[s].type != RAMP) // Set opacity of image to 20% if not on focused layer
                    context.globalAlpha = 0.5;
                else
                    context.globalAlpha = 1;

                function bufferImage(context, dir, index){
                  var curImage = IMAGES[index];

                  context.clearRect(0, 0, size, size);

                  if (dir[0] == 1 && dir[1] == 0) {
                    context.rotate((Math.PI) / 2);
                    context.drawImage(curImage, 0, -size, size, size);
                    context.rotate(-(Math.PI) / 2);
                  } else if (dir[0] == -1 && dir[1] == 0) {
                    context.rotate(3 * (Math.PI) / 2);
                    context.drawImage(curImage, -size, 0, size, size);
                    context.rotate(-3 * (Math.PI) / 2);
                  } else if (dir[0] == 0 && dir[1] == 1) {
                    context.rotate(Math.PI);
                    context.drawImage(curImage, -size, -size, size, size);
                    context.rotate(-Math.PI);
                  } else {
                    context.drawImage(curImage, 0, 0, size, size);
                  }
                }

                if(track.pieces[s].type == RAMP && track.pieces[s].pos[2]==layer){
                  bufferImage(ctx2, left(left(track.pieces[s].dir)), 1+track.pieces[s].type);
                }else{
                  bufferImage(ctx2, track.pieces[s].dir, 1+track.pieces[s].type);
                }

                context.drawImage(c2, offsetx + (track.pieces[s].pos[0] * size), offsety + (track.pieces[s].pos[1] * size), size, size);

                if(track.pieces[s].type == JUMP){
                  bufferImage(ctx2, track.pieces[s].dir,2+track.pieces[s].type);
                  context.drawImage(c2, offsetx + ((track.pieces[s].pos[0] - track.pieces[s].dir[0]) * size), offsety + ((track.pieces[s].pos[1] - track.pieces[s].dir[1]) * size), size, size);
                }

                if(track.pieces[s].bad){
                  context.globalAlpha = context.globalAlpha * 0.25;
                  context.fillStyle = '#f00';
                  context.fillRect(offsetx + (track.pieces[s].pos[0] * size), offsety + (track.pieces[s].pos[1] * size), size, size);
                }
            }
        }
    }
}
function lineTrack(track, canvas, size, x, y, layer){
  var context = canvas.getContext('2d');
  var offsetx = x;
  var offsety = y;
    context.lineWidth = size/2;
    context.strokeStyle = '#000';
    context.beginPath()
  for (var s = 0; s < track.pieces.length; s++){
    switch(track.pieces[s].type){
      case START:
      case STRAIGHT:
      case RAMP:
        context.moveTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)+(track.pieces[s].dir[0]*(size/2)), offsety+(track.pieces[s].pos[1] * size)+(size/2)+(track.pieces[s].dir[1]*(size/2)));
        context.lineTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)-(track.pieces[s].dir[0]*(size/2)), offsety+(track.pieces[s].pos[1] * size)+(size/2)-(track.pieces[s].dir[1]*(size/2)));
        break;
      case INTERSECTION:
        context.moveTo(offsetx+(track.pieces[s].pos[0] * size)+size, offsety+(track.pieces[s].pos[1] * size)+(size/2));
        context.lineTo(offsetx+(track.pieces[s].pos[0] * size), offsety+(track.pieces[s].pos[1] * size)+(size/2));
        context.moveTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2), offsety+(track.pieces[s].pos[1] * size)+size);
        context.lineTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2), offsety+(track.pieces[s].pos[1] * size));
        break;
      case RIGHT:
        context.moveTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)+(track.pieces[s].dir[0]*(size/2)), offsety+(track.pieces[s].pos[1] * size)+(size/2)+(track.pieces[s].dir[1]*(size/2)));
        context.arcTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2), offsety+(track.pieces[s].pos[1] * size)+(size/2),offsetx+(track.pieces[s].pos[0] * size)+(size/2)+(right(track.pieces[s].dir)[0]*(size/2)), offsety+(track.pieces[s].pos[1] * size)+(size/2)+(right(track.pieces[s].dir)[1]*(size/2)), size/2);
        break;
      case LEFT:
        context.moveTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)+(track.pieces[s].dir[0]*(size/2)), offsety+(track.pieces[s].pos[1] * size)+(size/2)+(track.pieces[s].dir[1]*(size/2)));
        context.arcTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2), offsety+(track.pieces[s].pos[1] * size)+(size/2),offsetx+(track.pieces[s].pos[0] * size)+(size/2)+(left(track.pieces[s].dir)[0]*(size/2)), offsety+(track.pieces[s].pos[1] * size)+(size/2)+(left(track.pieces[s].dir)[1]*(size/2)), size/2);
        break;
      case JUMP:
        context.moveTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)+(track.pieces[s].dir[0]*(size/2)), offsety+(track.pieces[s].pos[1] * size)+(size/2)+(track.pieces[s].dir[1]*(size/2)));
        context.lineTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)-(track.pieces[s].dir[0]*(size/2.5)), offsety+(track.pieces[s].pos[1] * size)+(size/2)-(track.pieces[s].dir[1]*(size/2.5)));
        context.moveTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)-(track.pieces[s].dir[0]*(size)), offsety+(track.pieces[s].pos[1] * size)+(size/2)-(track.pieces[s].dir[1]*(size)));
        context.lineTo(offsetx+(track.pieces[s].pos[0] * size)+(size/2)+(track.pieces[s].dir[0]*(size)), offsety+(track.pieces[s].pos[1] * size)+(size/2)+(track.pieces[s].dir[1]*(size)));
        break;
    }
  }
  context.stroke();
}

function drawCurrentTrack(track) {
    if (!drawing) {
        drawing = true;
        var canvas = document.getElementById('canvas')
        drawGrid(canvas, gridSize);
        var offsetx = (canvas.width / 2);
        var offsety = (canvas.height / 2);
        offsetx = offsetx - (offsetx % gridSize) + panX;
        offsety = offsety - (offsety % gridSize) + panY;
        draw(track||currentTrack, canvas, gridSize, offsetx, offsety, focusLayer);
        drawing = false;
    }
}

function hideMenuButton(e){
  e.style.visibility = "hidden";
  e.style.margin = "0";
  e.style.opacity = "0";
  return e;
}

function showMenuButton(e){
  e.style.left = selectedTrackPieceX - 25  + 'px';
  e.style.top = selectedTrackPieceY - 25 + 'px';
  e.style.visibility = "visible";
  e.style.opacity = "1";
  return e;
}


function displayAddPieMenu(){
  pieAddMenuOpen = true;
  var straightButton = document.getElementById('STRIAGHT_button');
  var rampButton = document.getElementById('RAMP_button');
  var cornerButton = document.getElementById('CORNER_button');
  var intersectionButton = document.getElementById('INTERSECTION_button');
  var boostButton = document.getElementById('BOOST_button');
  var jumpButton = document.getElementById('JUMP_button');

  showMenuButton(straightButton).style.margin = ' 0 50px';
  showMenuButton(rampButton).style.margin = '-50px 30px';
  showMenuButton(cornerButton).style.margin = '-50px -25px';
  showMenuButton(intersectionButton).style.margin = '0 -50px';
  showMenuButton(boostButton).style.margin = '50px -25px';
  showMenuButton(jumpButton).style.margin = '50px 30px';
  if(jumpFlag == true){
    jumpButton.disabled = true;
    jumpButton.style.filter = "grayscale(100%)";
  }
  else {
    jumpButton.disabled = false;
    jumpButton.style.filter = "grayscale(0%)";
  }
}

function clearAddPieMenu(){
  pieAddMenuOpen = false;
  hideMenuButton(document.getElementById('STRIAGHT_button'));
  hideMenuButton(document.getElementById('RAMP_button'));
  hideMenuButton(document.getElementById('CORNER_button'));
  hideMenuButton(document.getElementById('INTERSECTION_button'));
  hideMenuButton(document.getElementById('BOOST_button'));
  hideMenuButton(document.getElementById('JUMP_button'));
  jumpFlag = false;
}

function displayEditPieMenu(pieceType){
  pieEditMenuOpen = true;
  var rotateRightButton = document.getElementById('ROTATERIGHT');
  var rotateLeftButton = document.getElementById('ROTATELEFT');
  var deleteButton = document.getElementById('DELETE');
  var switchButton = document.getElementById('SWITCH');
  showMenuButton(rotateRightButton).style.margin = ' 0 -50px';
  showMenuButton(rotateLeftButton).style.margin = ' 0 50px';
  showMenuButton(deleteButton).style.margin = '-50px 0';
  showMenuButton(switchButton).style.margin = '50px 0';
}

function clearEditPieMenu(){
  pieEditMenuOpen = false;
  hideMenuButton(document.getElementById('ROTATERIGHT'));
  hideMenuButton(document.getElementById('ROTATELEFT'));
  hideMenuButton(document.getElementById('DELETE'));
  hideMenuButton(document.getElementById('SWITCH'));
  document.getElementById('SWITCH').disabled = false;
  document.getElementById('SWITCH').src = "images/straight.png";
  document.getElementById('SWITCH').style.filter = "grayscale(0%)";
}


function addTypeOfTrack(trackPiece){
  if(selectedPieceIndex >= 0){
    currentTrack.pieces.splice(selectedPieceIndex,1);
  }

  var inbound = getInbound(selectedGridPieceX,selectedGridPieceY,focusLayer);

  switch(trackPiece){
    case STRAIGHT:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:inbound.dir,
      });
      break;
    case LEFT:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:left(inbound.dir),
      });
      break;
    case RIGHT:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:right(inbound.dir),
      });
      break;
    case JUMP:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX+inbound.dir[0],selectedGridPieceY+inbound.dir[1],focusLayer],
        dir:inbound.dir,
      });
      break;
    case RAMP:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,(focusLayer+1)%2],
        dir:inbound.dir,
      });
      switchLayer();
      break;
    case INTERSECTION:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:inbound.dir,
      });
      break;
    case BOOST:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:inbound.dir,
      });
      break;
  }
  clearAddPieMenu();
  drawCurrentTrack();
}

function editTrackPiece(trackPiece){
  var hide = false;
  switch(trackPiece){
    case 0:
      currentTrack.pieces.splice(selectedPieceIndex,1);
      hide = true;
      //delete button
      break;
    case 1:
      currentTrack.pieces[selectedPieceIndex].dir = right(currentTrack.pieces[selectedPieceIndex].dir);
      //rotate right
      break;
    case 2:
      currentTrack.pieces[selectedPieceIndex].dir = left(currentTrack.pieces[selectedPieceIndex].dir);
      //rotate left
      break;
    case 3:
      displayAddPieMenu();
      hide = true;
      //switch from ramp to straight or vice versa
      break;
  }
  if(hide)clearEditPieMenu();
  drawCurrentTrack();
}


function getInbound(xCoord,yCoord,zCoord){
  var selectedDir;
  for(var index = 0; index < currentTrack.pieces.length; index++){
    if((currentTrack.pieces[index].pos[0]+currentTrack.pieces[index].dir[0] == xCoord) &&
    (currentTrack.pieces[index].pos[1]+currentTrack.pieces[index].dir[1] == yCoord) &&
    (currentTrack.pieces[index].pos[2] == zCoord)){
      selectedDir = currentTrack.pieces[index].dir;
    }else{
      switch(currentTrack.pieces[index].type){
        case JUMP:
        if((currentTrack.pieces[index].pos[0]-(currentTrack.pieces[index].dir[0]*2) == xCoord) &&
          (currentTrack.pieces[index].pos[1]-(currentTrack.pieces[index].dir[1]*2) == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
          selectedDir = left(left(currentTrack.pieces[index].dir));
        }
        break;
        case RIGHT:
        if((currentTrack.pieces[index].pos[0]-right(currentTrack.pieces[index].dir)[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-right(currentTrack.pieces[index].dir)[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = right(currentTrack.pieces[index].dir);
        }else if((currentTrack.pieces[index].pos[0]-left(currentTrack.pieces[index].dir)[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-left(currentTrack.pieces[index].dir)[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = right(currentTrack.pieces[index].dir);
        }
        break;
        case LEFT:
        if((currentTrack.pieces[index].pos[0]-left(currentTrack.pieces[index].dir)[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-left(currentTrack.pieces[index].dir)[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = left(currentTrack.pieces[index].dir);
        }else if((currentTrack.pieces[index].pos[0]-right(currentTrack.pieces[index].dir)[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-right(currentTrack.pieces[index].dir)[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = left(currentTrack.pieces[index].dir);
        }
        break;
        case INTERSECTION:
        if((currentTrack.pieces[index].pos[0]-left(currentTrack.pieces[index].dir)[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-left(currentTrack.pieces[index].dir)[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = right(currentTrack.pieces[index].dir);
        }else if((currentTrack.pieces[index].pos[0]-right(currentTrack.pieces[index].dir)[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-right(currentTrack.pieces[index].dir)[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = left(currentTrack.pieces[index].dir);
        }else if((currentTrack.pieces[index].pos[0]-currentTrack.pieces[index].dir[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-currentTrack.pieces[index].dir[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = left(left(currentTrack.pieces[index].dir));
        }
        break;
        case BOOST:
        case STRAIGHT:
        case RAMP:
        if((currentTrack.pieces[index].pos[0]-currentTrack.pieces[index].dir[0] == xCoord) &&
          (currentTrack.pieces[index].pos[1]-currentTrack.pieces[index].dir[1] == yCoord) &&
          (currentTrack.pieces[index].pos[2] == zCoord)){
            selectedDir = left(left(currentTrack.pieces[index].dir));
        }
        break;
      }
    }
  }
  return {dir:selectedDir||[0,-1]};
}

function isSpaceOccupied(xCoord,yCoord,zCoord){
  var selectedIndex = -1;
  for(var index = 0; index < currentTrack.pieces.length; index++){
    if((currentTrack.pieces[index].pos[0] == xCoord) && (currentTrack.pieces[index].pos[1] == yCoord) && (currentTrack.pieces[index].pos[2] == zCoord)){
      selectedIndex = index;
    }else if((currentTrack.pieces[index].pos[0]-currentTrack.pieces[index].dir[0] == xCoord) &&
    (currentTrack.pieces[index].pos[1]-currentTrack.pieces[index].dir[1] == yCoord) &&
    (currentTrack.pieces[index].pos[2] == zCoord) && (currentTrack.pieces[index].type == JUMP))
    {
      selectedIndex = index;
    }
  }
  return selectedIndex;
}

function isStartPiece(xCoord,yCoord,zCoord){
  var flag = false;
  if((xCoord == 0) && (yCoord == 0) && (zCoord == 0))
      flag = true;
  return flag;
}

function doTouch(e){
  updateTouchEvent(e)
  if(e.touches.length == 2){
    startingScale = scale;
    startingWidth = Math.sqrt(Math.pow(e.touches.item(0).clientX-e.touches.item(1).clientX,2)+Math.pow(e.touches.item(0).clientY-e.touches.item(1).clientY,2));
  }
  doMouseDown(e);
}
function doMouseDown(e) {
  var canvas = document.getElementById('canvas');
  var widthX = (canvas.width / 2);
  var widthY = (canvas.height / 2);

  if(!dragging && !rightClick){
    selectedTrackPieceX = (e.clientX - ((e.clientX - panX%gridSize)%gridSize)) + (gridSize/2);
    selectedTrackPieceY = (e.clientY - ((e.clientY - panY%gridSize)%gridSize)) + (gridSize/2);
    selectedGridPieceX = Math.floor((e.clientX - (widthX-(widthX%gridSize)) - panX)/gridSize);
    selectedGridPieceY = Math.floor((e.clientY - (widthY-(widthY%gridSize)) - panY)/gridSize);

    startX = e.clientX;
    startY = e.clientY;

    originX = e.clientX;
    originY = e.clientY;
    if(e.button == 2){
      rightClick = true;
      clearAddPieMenu();
      clearEditPieMenu();
    }

    selectedPieceIndex = isSpaceOccupied(selectedGridPieceX,selectedGridPieceY,focusLayer);

    if(e.isTouch){
      canvas.addEventListener('touchmove', touchMoving);
      canvas.addEventListener('touchend', endTouching);
    } else {
      canvas.addEventListener("mousemove", mouseTracking);
      canvas.addEventListener("mouseup", endTracking);
      canvas.addEventListener("mouseleave", endTracking);
    }
  }
}

function endTouching(e){
  updateTouchEvent(e)
  endTracking(e);
}
function endTracking(e) {
    var consumed = false;
    var canvas = document.getElementById('canvas');
    var startCheck = isStartPiece(selectedGridPieceX,selectedGridPieceY,focusLayer);
    if(pieAddMenuOpen == false && pieEditMenuOpen == false && rightClick == false && startCheck == false && dragging == false){
      selectedPieceIndex = isSpaceOccupied(selectedGridPieceX,selectedGridPieceY,focusLayer);
      if((Math.abs(startX-e.clientX) < (gridSize/1.5)) && (Math.abs(startY-e.clientY) < (gridSize/1.5))){
        if(selectedPieceIndex == -1){
          consumed = true;
          displayAddPieMenu();
        }else if (pieEditMenuOpen == false){
          consumed = true;
          displayEditPieMenu(currentTrack.pieces[selectedPieceIndex].type);
        }
      }
    }
    else if(pieAddMenuOpen == true){
      consumed = true;
      clearAddPieMenu();
    }
    else if(pieEditMenuOpen == true){
      consumed = true;
      clearEditPieMenu();
    }
    else if(dragging == true && e.button != 2){
      var widthX = (canvas.width / 2);
      var widthY = (canvas.height / 2);
      selectedGridPieceX = Math.floor((e.clientX - (widthX-(widthX%gridSize)) - panX)/gridSize);
      selectedGridPieceY = Math.floor((e.clientY - (widthY-(widthY%gridSize)) - panY)/gridSize);
      var space = isSpaceOccupied(selectedGridPieceX,selectedGridPieceY,focusLayer);
      if(space == -1){
        addTypeOfTrack(currentTrack.pieces[selectedPieceIndex].type);
        drawCurrentTrack();
      }
      document.getElementById('dragIcon').style.display='none';
      consumed = true;
      dragging = false;
    } else if(rightClick && e.button == 2){
      originX = null;
      originY = null;
      rightClick = false;
      consumed = true;
    }

    if(consumed){
      if(e.isTouch && e.touches.length < 1){
        canvas.removeEventListener("touchmove", touchMoving);
        canvas.removeEventListener("touchend", endTouching);
      } else {
        canvas.removeEventListener("mousemove", mouseTracking);
        canvas.removeEventListener("mouseup", endTracking);
        canvas.removeEventListener("mouseleave", endTracking);
      }
    }
}

function touchMoving(e){
  updateTouchEvent(e)
  if(!dragging && selectedPieceIndex < 1){
    var diffX = e.clientX - originX;
    var diffY = e.clientY - originY;

    if(e.touches.length == 2){
      scale = startingScale * startingWidth / Math.sqrt(Math.pow(e.touches.item(0).clientX-e.touches.item(1).clientX,2)+Math.pow(e.touches.item(0).clientY-e.touches.item(1).clientY,2));
      gridSize = defaultGridSize * scale;
      halfGrid = gridSize/2;
    }

    pan(diffX, diffY);
  }
  mouseTracking(e);
}
function mouseTracking(e) {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var diffX = e.clientX - originX;
    var diffY = e.clientY - originY;
    if(rightClick == true)
      pan(diffX, diffY);
    originX = e.clientX;
    originY = e.clientY;

    if(!rightClick && selectedPieceIndex >= 0 && currentTrack.pieces[selectedPieceIndex].type!=START && !dragging && ((Math.abs(startX-e.clientX) > (gridSize/2.5)) || (Math.abs(startY-e.clientY) > (gridSize/2.5)))){
      var icon =document.getElementById('dragIcon');
      icon.src = IMAGES[currentTrack.pieces[selectedPieceIndex].type+1].src;
      icon.style.display='inline-block';
      icon.style.top = (e.clientY-25)+'px';
      icon.style.left = (e.clientX-25)+'px';
      if(currentTrack.pieces[selectedPieceIndex].dir[0]==1){
        icon.style.transform = 'rotate(90deg)';
      } else if(currentTrack.pieces[selectedPieceIndex].dir[0]==-1){
        icon.style.transform = 'rotate(-90deg)';
      } else if(currentTrack.pieces[selectedPieceIndex].dir[1]==1){
        icon.style.transform = 'rotate(180deg)';
      }
      dragging = true;

      clearAddPieMenu();
      clearEditPieMenu();
    }

    if(dragging){
      var icon = document.getElementById('dragIcon');
      icon.style.top = (e.clientY-25)+'px';
      icon.style.left = (e.clientX-25)+'px';

      var widthX = (canvas.width / 2);
      var widthY = (canvas.height / 2);
      selectedGridPieceX = Math.floor((e.clientX - (widthX-(widthX%gridSize)) - panX)/gridSize);
      selectedGridPieceY = Math.floor((e.clientY - (widthY-(widthY%gridSize)) - panY)/gridSize);
      var space = isSpaceOccupied(selectedGridPieceX,selectedGridPieceY,focusLayer);
      if(space >= 0 && space != selectedPieceIndex){
        icon.style.background = 'red';
      } else {
        icon.style.background = 'transparent';
      }
    }
}


function switchLayer(){
    /*
    * fL 0 = Darken second layer
    * fL 1 = Darken first layer
    */
    focusLayer = ((focusLayer + 1) % 2);
    document.getElementById('layerCap').style.top = focusLayer?'44px':'6px';

    drawCurrentTrack();
}


function pan(x,y){
    panX += x;
    panY += y;
    drawGrid(document.getElementById('canvas'), gridSize);
    drawCurrentTrack();
}

function panButton(num){
    /*
    * Cosine functions return X-axis values, Sine functions return Y-axis values
    * Taking advantage of this, assigning numbers corresponding to unit circle directions to each button
    * allows this one function to pan in each direction
    *
    * The pan is also multiplied by current grid size to take scale into account
    */
    pan(Math.cos((Math.PI/2)*num)*gridSize, Math.sin((Math.PI/2)*num)*gridSize);
}

function modScale(interval){
    if(scale + interval >= 0.2)
        scale += interval;
    else
        scale = 0.2;
    gridSize = defaultGridSize * scale;
    halfGrid = gridSize/2;
    drawCurrentTrack();
}

function resetScale(){
    panX = 0;
    panY = 0;
    modScale(1 - scale);
}

function wheelZoom(e){
    /*
    * e is of type WheelEvent
    * WheelEvent has an attribute deltaY which is vertical scroll
    * Negative deltaY = scroll up
    * Postitive deltaY = scroll down
    */

    if(e.deltaY > 0)
        modScale(-0.1);
    else if(e.deltaY < 0)
        modScale(0.1);
    // No else case just so if something happens to trigger WheelEvent with delta of 0 we don't scale
}


function preventDef(event){
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function showHelpMenu(){
  var menu = document.getElementById('helpMenuBack');
  menu.style.visibility = "visible";
  menu.style.opacity = "1";
}
function hideHelpMenu(){
  var menu = document.getElementById('helpMenuBack');
  menu.style.visibility = "hidden";
  menu.style.opacity = "0";
}

function showPartsList(){
  var bits = [0,0,0,0,0,0,0];
  var overpass = 0;
  for(var i = 1; i < currentTrack.pieces.length; i++){
    bits[currentTrack.pieces[i].type]++;
    if(currentTrack.pieces[i].pos[2] == 1)overpass++;
  }

  document.getElementById('corner_list').innerHTML = bits[LEFT]+bits[RIGHT];
  document.getElementById('straight_list').innerHTML = bits[STRAIGHT]+bits[RAMP];
  document.getElementById('jump_list').innerHTML = bits[JUMP];
  document.getElementById('intersection_list').innerHTML = bits[INTERSECTION];
  document.getElementById('boost_list').innerHTML = bits[BOOST];
  document.getElementById('riser_list').innerHTML = overpass*2;

  var menu = document.getElementById('partsListBack');
  menu.style.visibility = "visible";
  menu.style.opacity = "1";
}
function hidePartsList(){
  var menu = document.getElementById('partsListBack');
  menu.style.visibility = "hidden";
  menu.style.opacity = "0";
}

function showGenMenu(reset){
  if(goodTracks.length > 0 && !reset){
    showResMenu();
    drawGenTracks(trackIndex);
  } else {
    endThread();
    var menu = document.getElementById('genMenuBack');
    menu.style.visibility = "visible";
    menu.style.opacity = "1";
  }
}
function hideGenMenu(){
  var menu = document.getElementById('genMenuBack');
  menu.style.visibility = "hidden";
  menu.style.opacity = "0";
}
function poolSet(type,val){
  var counter = document.getElementById(ctrlPrefix[type]+'counter');
  var count = parseInt(counter.innerHTML)+val;
  if(count < 0) count = 0;
  counter.innerHTML = count;
}
function consecSet(type,val){
  var counter = document.getElementById(ctrlPrefix[type]+'consec');
  var count = parseInt(counter.innerHTML)+val;
  if(count < 1) count = 1;
  counter.innerHTML = count;
}
function toggleGenOptions(){
  var div = document.getElementById('genOptions');
  if(div.style.height=='60px'){
    div.style.height='0';
  } else {
    div.style.height='60px';
  }
}

function showResMenu(){
  document.getElementById('previewCanvas').getContext("2d").clearRect(0,0,1000,1000);
  document.getElementById('trackContainer').getContext("2d").clearRect(0,0,1000,1000);
  var menu = document.getElementById('resMenuBack');
  menu.style.visibility = "visible";
  menu.style.opacity = "1";
  drawSelectedTrack();
}
function hideResMenu(save){
  if(save && goodTracks[selectedTrackIndex]){
    currentTrack = goodTracks[selectedTrackIndex];
  }
  var menu = document.getElementById('resMenuBack');
  menu.style.visibility = "hidden";
  menu.style.opacity = "0";
  drawCurrentTrack();
}

function trackIndexSet(val){
  trackIndex+=val;
  var rows = Math.trunc((goodTracks.length/tracksPerRow)-0.1);
  if(trackIndex > rows) trackIndex = rows;
  if(trackIndex < 0) trackIndex = 0;
  document.getElementById('trackCounter').innerHTML = (selectedTrackIndex+1)+'/'+goodTracks.length;
  drawGenTracks(trackIndex);
}
function wheelTracks(e){
  if(e.deltaY > 0)
    trackIndexSet(1);
  else if(e.deltaY < 0)
    trackIndexSet(-1);
}

function drawGenTracks(index){
  var canvas = document.getElementById('trackContainer');
  var ctx = canvas.getContext("2d");
  var h = canvas.height-6, w = canvas.width-6;
  var xoffset = (w/tracksPerRow)/2;
  var yoffset = (h/tracksPerCol)/2;
  var sizeDim = Math.min((w/tracksPerRow),(h/tracksPerCol))

  ctx.clearRect(0,0,canvas.width,canvas.height);
  var tIndex = 0
  for(var y = 0; y < tracksPerCol && tIndex < goodTracks.length; y++){
    for(var x = 0; x < tracksPerRow && tIndex < goodTracks.length; x++){
      tIndex = ((index+y)*tracksPerRow)+x;
      if(tIndex < goodTracks.length){
        var size = sizeDim/10;
        var width = size*(goodTracks[tIndex].minx+goodTracks[tIndex].maxx+1)/2;
        var height = size*(goodTracks[tIndex].miny+goodTracks[tIndex].maxy+1)/2;
        lineTrack(goodTracks[tIndex], canvas, size, (x*(xoffset*2))+xoffset-width, (y*(yoffset*2))+yoffset-height, 2);
        if(selectedTrackIndex==tIndex){
          var tmp = ctx.strokeStyle
          ctx.strokeStyle = "orange";
          ctx.beginPath();
          ctx.moveTo((x*(xoffset*2))+2,(y*(yoffset*2))+2);
          ctx.lineTo(((x+1)*(xoffset*2))-2,(y*(yoffset*2))+2);
          ctx.lineTo(((x+1)*(xoffset*2))-2,((y+1)*(yoffset*2))-2);
          ctx.lineTo((x*(xoffset*2))+2,((y+1)*(yoffset*2))-2);
          ctx.lineTo((x*(xoffset*2))+2,(y*(yoffset*2))+2);
          ctx.stroke();
          ctx.strokeStyle = tmp;
        }
      }
    }
  }
}

function selectTrack(e){
  var canvas = document.getElementById('trackContainer');
  var sizeX = (canvas.width/tracksPerRow);
  var sizeY = (canvas.height/tracksPerCol);
  var x = Math.trunc(e.offsetX/sizeX);
  var y = Math.trunc(e.offsetY/sizeY);
  var index = ((trackIndex+y)*tracksPerRow)+x;

  if(index < goodTracks.length) selectedTrackIndex = index;
  drawSelectedTrack();
}
function drawSelectedTrack(){
  if(selectedTrackIndex < goodTracks.length && selectedTrackIndex >= 0){
    canvas = document.getElementById('previewCanvas');
    canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
    var size = canvas.width/Math.max(Math.abs(goodTracks[selectedTrackIndex].minx)+goodTracks[selectedTrackIndex].maxx+1,Math.abs(goodTracks[selectedTrackIndex].miny)+goodTracks[selectedTrackIndex].maxy+1);
    var width = size*(goodTracks[selectedTrackIndex].minx+goodTracks[selectedTrackIndex].maxx+1)/2;
    var height = size*(goodTracks[selectedTrackIndex].miny+goodTracks[selectedTrackIndex].maxy+1)/2;
    draw(goodTracks[selectedTrackIndex],canvas, size, (canvas.width/2)-width, (canvas.height/2)-height, 0);
    document.getElementById('trackCounter').innerHTML = (selectedTrackIndex+1)+'/'+goodTracks.length;
    drawGenTracks(trackIndex);
  }
}

function threadGen() {
  var time;
  if (!working) {
    goodTracks = [];
    processingTracks = [];
    working = true;
    trackIndex = 0;
    selectedTrackIndex = -1;
    var hasDrawn = false;

    document.getElementById('trackCounter').innerHTML = (selectedTrackIndex+1)+'/'+goodTracks.length;
    document.getElementById('marquee').setAttribute("class","_marquee _run");
    document.getElementById('workingSpinner').setAttribute("style",'display: inline-block;');

    function loadTracks(tracks){
      for(var i = 0; i < tracks.length; i++){
        var t = tracks[i];
        t.minx = 999;
        t.miny = 999;
        t.maxx = -999;
        t.maxy = -999;
        for(var p = 0; p < t.pieces.length; p++){
          if(t.pieces[p].pos[0]<t.minx)t.minx=t.pieces[p].pos[0];
          if(t.pieces[p].pos[0]>t.maxx)t.maxx=t.pieces[p].pos[0];
          if(t.pieces[p].pos[1]<t.miny)t.miny=t.pieces[p].pos[1];
          if(t.pieces[p].pos[1]>t.maxy)t.maxy=t.pieces[p].pos[1];
        }
        goodTracks.push(t);
      }
      document.getElementById('trackCounter').innerHTML = (selectedTrackIndex+1)+'/'+goodTracks.length;
    }

    time = Date.now();
    if (!generatorThread) {
        generatorThread = new Worker("./generator.js");
    }
    if (!filterThread) {
        filterThread = new Worker("./middleware.js");
    }

    var pool = [];
    var consec = [];
    for(var i = 0; i < 7; i++){
      pool.push(parseInt(document.getElementById(ctrlPrefix[i]+'counter').innerHTML));
      consec.push(parseInt(document.getElementById(ctrlPrefix[i]+'consec').innerHTML));
    }
    generatorThread.onmessage = function (ge) {
      // filterThread.postMessage(ge.data);
      var msg = JSON.parse(ge.data);
      loadTracks(msg.tracks);
      if(!hasDrawn){
        drawGenTracks(trackIndex);
        hasDrawn = goodTracks.length > (tracksPerRow*tracksPerCol);
      }
      if (msg.type == 1) {
        endThread();
      }
    };
    filterThread.onmessage = function(fe) {
      var tracks = JSON.parse(fe.data.tracks);
      loadTracks(tracks);
      if(!hasDrawn){
        drawGenTracks(trackIndex);
        hasDrawn = goodTracks.length > (tracksPerRow*tracksPerCol);
      }
      if (fe.data.type == 1) {
        endThread();
      }
    }
    generatorThread.postMessage([pool,consec]);
  }
}
function endThread(){
  if(generatorThread){
      generatorThread.terminate()
      generatorThread = null;
  }
  if(filterThread){
      filterThread.terminate()
      filterThread = null;
  }
  working = false;
  document.getElementById('marquee').setAttribute("class","_marquee");
  document.getElementById('workingSpinner').style.display='none';
}

function uploadTrack(){
  var fileElem = document.getElementById("fileElem");
  if (fileElem) {
    fileElem.click();
  }
}

function download() {
  alertify.prompt('Name track','new track', function(evt, value) {
    if(value){
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentTrack)));
      element.setAttribute('download', value+'.json');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  }).set('reverseButtons', true);
}

function handleFiles(files) {
  var reader = new FileReader();
  reader.onload = function(){
    var text = reader.result;
    try{
      var data = JSON.parse(text);
      if(data.hasOwnProperty('pieces')){
        currentTrack = data;
        drawCurrentTrack();
        alertify.success('Track Loaded');
      } else {
        throw "hate";
      }
    } catch(err){
      alertify.error('Invalid file selected');
    }
  }
  reader.readAsText(files[0]);
}
