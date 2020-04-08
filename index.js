var defaultGridSize = 50;
var gridSize = defaultGridSize;
var halfGrid = gridSize/2;
var goodTracks = [];
var trackIndex = 0;
var trackInterval;
var currentTrack;

var rightClick = false;
var pieAddMenuOpen = false;
var pieEditMenuOpen = false;
var drawing = false;
var working = false;


//changed these to consts and put them in number-order - caused errors, changed back to var
var START = -1;
var RIGHT = 0;
var LEFT = 1;
var STRAIGHT = 2;
var BOOST = 3;
var RAMP = 4;
var INTERSECTION = 5;
var JUMP = 6;

//transform controls
var focusLayer = 0;
var scale = 1;
var panX = 0;
var panY = 0;

// specifically for mouse panning
var startX = null;
var startY = null;
var originX = null;
var originY = null;
var selectedTrackPieceX = null;
var selectedTrackPieceY = null;
var selectedGridPieceX = null;
var selectedGridPieceY = null;
var selectedTrackIndex = 0;

//image locations
var  IMAGES = [document.getElementById("imgStart"),document.getElementById("imgCornerR"), document.getElementById("imgCornerL"), document.getElementById("imgStraight"),
document.getElementById("imgBoost"), document.getElementById("imgRamp"), document.getElementById("imgIntersection"),
document.getElementById("imgJumpCatch"), document.getElementById("imgJumpLaunch"), ];

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
    canvas.addEventListener("wheel", wheelZoom); // scroll zoom event listener
    canvas.addEventListener("mousedown", doMouseDown);
}

function clearTrack() {
    currentTrack = {
        pieces: [
            { type: -1, pos: [0, 0, 0], dir: [0, -1] }
        ]
    };
    resetScale();
    drawCurrentTrack();
}


function drawGrid(canvas, size) {
    var body = document.getElementById('body');
    var h = body.clientHeight;
    var w = body.clientWidth;
    //let canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    // Enforce global alpha of 1 to prevent ghosting
    context.globalAlpha = 1;

    context.fillStyle = "#FFFFFF";
    context.strokeStyle = "#AAAAAA";
    context.fillRect(0, 0, w, h);

    context.beginPath();
    for (var x = 0; x <= w + size; x += size) {
        // Draw one tile further offscreen to try to stop panning into blank space
        context.moveTo(x + (panX % size), 0 + (panY % size) - size);
        context.lineTo(x + (panX % size), h + (panY % size) + size);
    }
    context.stroke();
    context.beginPath();
    for (var y = 0; y <= h + size; y += size) {
        context.moveTo(0 + (panX % size) - size, y + (panY % size));
        context.lineTo(w + (panX % size) + size, y + (panY % size));
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
    var offsetx = (canvas.width / 2);
    var offsety = (canvas.height / 2);
    offsetx = offsetx - (offsetx % size) + x;
    offsety = offsety - (offsety % size) + y;
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
                if (i != layer && layer <= 1) // Set opacity of image to 20% if not on focused layer
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

                if(track.pieces[s].type == JUMP){
                  bufferImage(ctx2, track.pieces[s].dir,2+track.pieces[s].type);
                  context.drawImage(c2, offsetx + ((track.pieces[s].pos[0] - track.pieces[s].dir[0]) * size), offsety + ((track.pieces[s].pos[1] - track.pieces[s].dir[1]) * size), size, size);
                }

                bufferImage(ctx2, track.pieces[s].dir, 1+track.pieces[s].type);

                context.drawImage(c2, offsetx + (track.pieces[s].pos[0] * size), offsety + (track.pieces[s].pos[1] * size), size, size);
            }
        }
    }
}

function drawCurrentTrack(track) {
    if (!drawing) {
        drawing = true;
        drawGrid(document.getElementById('canvas'), gridSize);
        draw(track||currentTrack, document.getElementById('canvas'), gridSize, panX, panY, focusLayer);
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
}

function clearAddPieMenu(){
  pieAddMenuOpen = false;
  hideMenuButton(document.getElementById('STRIAGHT_button'));
  hideMenuButton(document.getElementById('RAMP_button'));
  hideMenuButton(document.getElementById('CORNER_button'));
  hideMenuButton(document.getElementById('INTERSECTION_button'));
  hideMenuButton(document.getElementById('BOOST_button'));
  hideMenuButton(document.getElementById('JUMP_button'));
}

function displayEditPieMenu(pieceType){

  pieEditMenuOpen = true;
  var rotateRightButton = document.getElementById('ROTATERIGHT');
  var rotateLeftButton = document.getElementById('ROTATELEFT');
  var deleteButton = document.getElementById('DELETE');
  var straightToRampButton = document.getElementById('SWITCH');
  showMenuButton(rotateRightButton).style.margin = ' 0 -50px';
  showMenuButton(rotateLeftButton).style.margin = ' 0 50px';
  showMenuButton(deleteButton).style.margin = '-50px 0';
  showMenuButton(straightToRampButton).style.margin = '50px 0';
  if(pieceType == 2 || pieceType == 4){
    if(pieceType == 2)
      straightToRampButton.src = "images/ramp.png";
  }
  else{
    straightToRampButton.style.filter = "grayscale(100%)";
    straightToRampButton.disabled = true;
  }
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
  inbound = getAdjacent(selectedGridPieceX,selectedGridPieceY,focusLayer)||{dir:[0,-1]};
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
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:inbound.dir,
      });
      break;
    case RAMP:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
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
      currentTrack.pieces.splice(selectedTrackIndex,1);
      hide = true;
      //delete button
      break;
    case 1:
      currentTrack.pieces[selectedTrackIndex].dir = right(currentTrack.pieces[selectedTrackIndex].dir);
      //rotate right
      break;
    case 2:
      currentTrack.pieces[selectedTrackIndex].dir = left(currentTrack.pieces[selectedTrackIndex].dir);
      //rotate left
      break;
    case 3:
      if(currentTrack.pieces[selectedTrackIndex].type == STRAIGHT){
        currentTrack.pieces[selectedTrackIndex].type = RAMP;
      }
      else{
        currentTrack.pieces[selectedTrackIndex].type = STRAIGHT;
      }
      switchLayer()
      hide = true;
      //switch from ramp to straight or vice versa
      break;
  }
  if(hide)clearEditPieMenu();
  drawCurrentTrack();
}


function getAdjacent(xCoord,yCoord,zCoord){
  var selectedtrack;
  for(var index = 0; index < currentTrack.pieces.length; index++){
    if((currentTrack.pieces[index].pos[0]+currentTrack.pieces[index].dir[0] == xCoord) &&
    (currentTrack.pieces[index].pos[1]+currentTrack.pieces[index].dir[1] == yCoord) &&
    (currentTrack.pieces[index].pos[2] == zCoord)){
      selectedtrack = currentTrack.pieces[index];
    }
  }
  return selectedtrack;
}

function isSpaceOccupied(xCoord,yCoord,zCoord){
  var selectedIndex = -1;
  for(var index = 0; index < currentTrack.pieces.length; index++){
    if((currentTrack.pieces[index].pos[0] == xCoord) && (currentTrack.pieces[index].pos[1] == yCoord) && (currentTrack.pieces[index].pos[2] == zCoord)){
      flag = true;
      selectedIndex = index;
      selectedTrackIndex = index;
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


function doMouseDown(e) {
    var canvas = document.getElementById('canvas');
    var widthX = (canvas.width / 2);
    var widthY = (canvas.height / 2);
    /* old placeholder function for testing - draws circle on click
    var context = canvas.getContext('2d');
    context.beginPath();
    context.arc(e.clientX, e.clientY, 25, 0, 2*Math.PI);
    context.fillStyle = "#000000";
    context.fill();*/
    selectedTrackPieceX = (e.clientX - ((e.clientX - panX%gridSize)%gridSize)) + (gridSize/2);
    selectedTrackPieceY = (e.clientY - ((e.clientY - panY%gridSize)%gridSize)) + (gridSize/2);
    selectedGridPieceX = Math.floor(((selectedTrackPieceX +(gridSize/2)) - panX - widthX)/gridSize);
    selectedGridPieceY = Math.floor(((selectedTrackPieceY +(gridSize/2)) - panY - widthY)/gridSize);

    startX = e.clientX;
    startY = e.clientY;

    originX = e.clientX;
    originY = e.clientY;
    if(e.button == 2)
      rightClick = true;

    canvas.addEventListener("mousemove", mouseTracking);
    canvas.addEventListener("mouseup", endTracking);
    canvas.addEventListener("mouseleave", endTracking);


}

function endTracking(e) {
    var canvas = document.getElementById('canvas');
    canvas.removeEventListener("mousemove", mouseTracking);
    canvas.removeEventListener("mouseup", endTracking);
    canvas.removeEventListener("mouseleave", endTracking);
    var startCheck = isStartPiece(selectedGridPieceX,selectedGridPieceY,focusLayer);
    if(pieAddMenuOpen == false && pieEditMenuOpen == false && rightClick == false && startCheck == false){
      var selectedIndex = isSpaceOccupied(selectedGridPieceX,selectedGridPieceY,focusLayer);
      if((Math.abs(startX-e.clientX) < (gridSize/1.5)) && (Math.abs(startY-e.clientY) < (gridSize/1.5))){
        if(selectedIndex == -1)
          displayAddPieMenu();
        else if (pieEditMenuOpen == false){
          displayEditPieMenu(currentTrack.pieces[selectedIndex].type);
        }
      }
    }
    else if(pieAddMenuOpen == true)
      clearAddPieMenu();
    else
      clearEditPieMenu();
    originX = null;
    originY = null;
    rightClick = false;
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
}


function switchLayer(){
    /*
    * fL 0 = Darken second layer
    * fL 1 = Darken first layer
    * fL 2 = No focused layer
    *
    * Adding 2 and using modulus to make button order:
    * First press = first layer focus
    * Second press = second layer focus
    * Third press = no focus
    * Repeat
    */
    focusLayer = ((focusLayer + 1) % 2);
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
    modScale(1 - scale);
    panX = 0;
    panY = 0;
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


function cycle(){
  if(trackIndex < goodTracks.length){
    currentTrack = JSON.parse(goodTracks[trackIndex]);
    drawCurrentTrack();
  } else
  trackIndex = 0;
}
//run track generation
function threadGen() {
    var time;
    if (!working) {
        goodTracks = [];
        working = true;
        trackIndex = 0;

        if (trackInterval) clearInterval(trackInterval);
        trackInterval = setInterval(function () {
          cycle()
          trackIndex++;
        }, 100);

        time = Date.now();
        if (typeof (w) == "undefined") {
            w = new Worker("./generator.js");
        }

        // tell worker piece pool
        console.log('start');
        w.postMessage([6, 6, 6, 0, 2, 1, 2]);
        //             L  R  S  B Ra  X  J

        w.onmessage = function (event) {
            if (event.data.type == 0) {
                //trackIndex = goodTracks.length-1;
                goodTracks = goodTracks.concat(event.data.tracks);
                console.log('tracks :' + goodTracks.length);
            }
            else if (event.data.type == 1) {
                goodTracks = goodTracks.concat(event.data.tracks);
                console.log('stop');
                console.log('time :' + (Date.now() - time));
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
        cycle()
    } else if (x == 39){
        if(trackInterval){
            clearInterval(trackInterval);
            trackInterval = null;
        }
        trackIndex++;
        cycle()
    } else if (x == 32){
        if(trackInterval){
            clearInterval(trackInterval);
            trackInterval = null;
        }
        else
            trackInterval = setInterval(function(){cycle(); trackIndex++;}, 100);
    }
}


function uploadTrack(){
  var fileElem = document.getElementById("fileElem");
  if (fileElem) {
    fileElem.click();
  }
}

function handleFiles(files) {
  var reader = new FileReader();
  reader.onload = function(){
    var text = reader.result;
    currentTrack = JSON.parse(text);
  }
  reader.readAsText(files[0]);
}
