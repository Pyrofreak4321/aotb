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
const IMAGES = [document.getElementById("imgCornerR"), document.getElementById("imgCornerL"), document.getElementById("imgStraight"),
document.getElementById("imgBoost"), document.getElementById("imgRamp"), document.getElementById("imgIntersection"),
document.getElementById("imgJumpLaunch"), document.getElementById("imgJumpCatch"), document.getElementById("imgStart")];

//initalize
window.onload = function () {
    //onclicks for the buttons - already defined in the html file
    /*document.getElementById("btnGen").onclick = function () {
        threadGen();
    }*/
    /*document.getElementById("btnSave").onclick = function () {
        console.log(JSON.parse(goodTracks[trackIndex]));
    };*/
    /*document.getElementById("btnLayer").onclick = function () {
        switchLayer();
    }*/
    //handler for when the window's resized
    window.addEventListener('resize', function () {
        drawResize();
    });
    currentTrack = {
      pieces:[
        {type:-1, pos:[0,0,0], dir:[0,-1]}
      ]
    }
    var body = document.getElementById('body');
    var h = body.clientHeight;
    var w = body.clientWidth;
    var canvas = document.getElementById('canvas');
    canvas.height = h;
    canvas.width = w;
    draw(currentTrack);
    canvas.addEventListener("wheel", wheelZoom); // scroll zoom event listener
    canvas.addEventListener("mousedown", doMouseDown);
}

function clearTrack() {
    drawGrid(); //remove this line if this function calls draw(track) in its final form
    //clear all but the start of the current track
    //uncomment or edit this once manual track editing is in place
    //while (curTrack.pieces > 1) {
    //    curTrack.pieces.pop();
    //}
    //draw(curTrack);
}

//draw grid
function drawGrid() {
    let body = document.getElementById('body');
    let h = body.clientHeight;
    let w = body.clientWidth;
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');

    // Enforce global alpha of 1 to prevent ghosting
    context.globalAlpha = 1;

    context.fillStyle = "#FFFFFF";
    context.strokeStyle = "#AAAAAA";
    context.fillRect(0, 0, w, h);

    context.beginPath();
    for(var x = 0; x <= w+gridSize; x+=gridSize){
        // Draw one tile further offscreen to try to stop panning into blank space
        context.moveTo(x + (panX % gridSize),0 + (panY % gridSize)-gridSize);
        context.lineTo(x + (panX % gridSize),h + (panY % gridSize)+gridSize);
    }
    context.stroke();
    context.beginPath();
    for(var y = 0; y <= h+gridSize; y+=gridSize){
        context.moveTo(0 + (panX % gridSize)-gridSize,y + (panY % gridSize));
        context.lineTo(w + (panX % gridSize)+gridSize,y + (panY % gridSize));
    }
    context.stroke();
}

//this is like draw grid but it doesn't recolor.
//minor visual issue: this currently draws lines over pieces of the track - was caused by calling this function AFTER drawing the track pieces

//repurposed to readjust canvas size when resizing browser window as static size caused issues
function drawResize() {
    /*let body = document.getElementById('body');
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');

    let h = body.clientHeight;
    let w = body.clientWidth;
    context.strokeStyle = "#AAAAAA"; //this isn't "#AAAAAA" since that color was appearing darker than it should've for some reason - Because drawResize wasn't drawing clear rectangles it stacked the lines and made them darker
    context.beginPath();
    for (var x = 0; x < w; x += gridSize) {
        context.moveTo(x, 0);
        context.lineTo(x, h);
    }
    //context.globalAlpha = 1;
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
    context.stroke();*/
    var body = document.getElementById('body');
    var h = body.clientHeight;
    var w = body.clientWidth;
    var canvas = document.getElementById('canvas');
    canvas.height = h;
    canvas.width = w;
    drawGrid();
    drawGoodTracks();
}

//need to change this so it draws images
//draw track

// function drawT(track,canvas,xCoord,yCoord,trackScale)
// {
//
// }

function draw(track) {
    let body = document.getElementById('body');
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    //this should fix the window scaling issues
    let offsetx = (canvas.width / 2);
    let offsety = (canvas.width / 2);
    offsetx = offsetx - (offsetx%gridSize) + panX;
    offsety = offsety - (offsety%gridSize) + panY;
    drawGrid();

    //draw each layer from bottom to top
    //will this *appear* to properly focus when layer switching is added? (as in, will they look distinct?)
        //maybe should edit the default color for empty tiles to be dark gray or dark green when focused on the upper layer?
    for (var i = 0; i <= 1; i++) {
        for (var s = 0; s < track.pieces.length; s++) {
            //if this is on the layer currently being drawn
            if (track.pieces[s].pos[2] == i) {
                if(i == (focusLayer - 1)) // Set opacity of image to 20% if not on focused layer
                    context.globalAlpha = 0.2;
                else
                    context.globalAlpha = 1;
                switch (track.pieces[s].type) {
                    case START:
                        context.drawImage(IMAGES[IMAGES.length - 1], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        //context.fillStyle = '#00FF00'; //light green
                        //get last index for start's number
                        break;
                    case STRAIGHT:
                        //context.fillStyle = '#FFFFFF'; //white
                        context.drawImage(IMAGES[STRAIGHT], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        break;
                    case LEFT:
                        //context.fillStyle = '#F08080'; //light coral
                        context.drawImage(IMAGES[LEFT], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        break;
                    case RIGHT:
                        //context.fillStyle = '#FF5A5A'; //red
                        context.drawImage(IMAGES[RIGHT], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        break;
                    case JUMP:
                        //context.fillStyle = '#DA70D6'; //magenta was bothering my eyes, so I changed it to orchid
                        //if the piece is a jump, fill two squares
                        context.drawImage(IMAGES[JUMP], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        // if (track.pieces[s].type == JUMP) { // This if statement is redundant, switch-case already checks for jump
                        context.drawImage(IMAGES[JUMP + 1], offsetx + ((track.pieces[s].pos[0] - track.pieces[s].dir[0]) * gridSize),
                            offsety + ((track.pieces[s].pos[1] - track.pieces[s].dir[1]) * gridSize), gridSize, gridSize);
                            //context.fillRect(offsetx + ((track.pieces[s].pos[0] - track.pieces[s].dir[0]) * gridSize), offsety + ((track.pieces[s].pos[1] - track.pieces[s].dir[1]) * gridSize), gridSize, gridSize);
                        // }
                        break;
                    case RAMP:
                        //context.fillStyle = '#0000FF'; //blue
                        context.drawImage(IMAGES[RAMP], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        break;
                    case BOOST: //this is still needed, since straights can be upgraded into boosts
                        //context.fillStyle = '#FFFF00'; //yellow
                        context.drawImage(IMAGES[BOOST], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        break;
                    case INTERSECTION:
                        context.drawImage(IMAGES[INTERSECTION], offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize),
                            gridSize, gridSize);
                        //context.fillStyle = '#FFA500'; //was dark gray, I changed it to orange
                        break;
                    default:
                        context.globalAlpha = 0.5;
                        context.fillStyle = '#1A1110'; //the switch should only fall here if a track piece's type is set wrong, so I set it to licorice to make it stand out
                        context.fillRect(offsetx + (track.pieces[s].pos[0] * gridSize), offsety + (track.pieces[s].pos[1] * gridSize), gridSize, gridSize);
                        context.globalAlpha = 1;
                }

            }
        }
    }
}

function drawGoodTracks() {
    if (!drawing) {
        drawing = true;
        draw(currentTrack);
        drawing = false;
    }
}

function displayAddPieMenu(){
  pieAddMenuOpen = true;
  var straightButton = document.getElementById('STRIAGHT_button');
  var rampButton = document.getElementById('RAMP_button');
  var cornerButton = document.getElementById('CORNER_button');
  var intersectionButton = document.getElementById('INTERSECTION_button');
  var boostButton = document.getElementById('BOOST_button');
  var jumpButton = document.getElementById('JUMP_button');
  straightButton.style.display = "block";
  straightButton.style.left = selectedTrackPieceX + 25 + 'px';
  straightButton.style.top = selectedTrackPieceY - 25 + 'px';
  rampButton.style.display = "block";
  rampButton.style.left = selectedTrackPieceX + 5 + 'px';
  rampButton.style.top = selectedTrackPieceY - 75 + 'px';
  cornerButton.style.display = "block";
  cornerButton.style.left = selectedTrackPieceX - 50 + 'px';
  cornerButton.style.top = selectedTrackPieceY - 75 + 'px';
  intersectionButton.style.display = "block";
  intersectionButton.style.left = selectedTrackPieceX - 75 + 'px';
  intersectionButton.style.top = selectedTrackPieceY - 25 + 'px';
  boostButton.style.display = "block";
  boostButton.style.left = selectedTrackPieceX - 50  + 'px';
  boostButton.style.top = selectedTrackPieceY + 25 + 'px';
  jumpButton.style.display = "block";
  jumpButton.style.left = selectedTrackPieceX + 5  + 'px';
  jumpButton.style.top = selectedTrackPieceY + 25 + 'px';
}

function clearAddPieMenu(){
  pieAddMenuOpen = false;
  document.getElementById('STRIAGHT_button').style.display = "none";
  document.getElementById('RAMP_button').style.display = "none";
  document.getElementById('CORNER_button').style.display = "none";
  document.getElementById('INTERSECTION_button').style.display = "none";
  document.getElementById('BOOST_button').style.display = "none";
  document.getElementById('JUMP_button').style.display = "none";
}

function displayEditPieMenu(pieceType){
  pieEditMenuOpen = true;
  var rotateRightButton = document.getElementById('ROTATERIGHT');
  var rotateLeftButton = document.getElementById('ROTATELEFT');
  var deleteButton = document.getElementById('DELETE');
  var straightToRampButton = document.getElementById('SWITCH');
  rotateRightButton.style.display = "block";
  rotateRightButton.style.left = selectedTrackPieceX - 75 + 'px';
  rotateRightButton.style.top = selectedTrackPieceY - 25 + 'px';
  rotateLeftButton.style.display = "block";
  rotateLeftButton.style.left = selectedTrackPieceX + 25 + 'px';
  rotateLeftButton.style.top = selectedTrackPieceY - 25 + 'px';
  deleteButton.style.display = "block";
  deleteButton.style.left = selectedTrackPieceX - 25 + 'px';
  deleteButton.style.top = selectedTrackPieceY - 75 + 'px';
  straightToRampButton.style.display = "block";
  straightToRampButton.style.left = selectedTrackPieceX - 25 + 'px';
  straightToRampButton.style.top = selectedTrackPieceY + 25 + 'px';
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
  document.getElementById('ROTATERIGHT').style.display = "none";
  document.getElementById('ROTATELEFT').style.display = "none";
  document.getElementById('DELETE').style.display = "none";
  document.getElementById('SWITCH').style.display = "none";
  document.getElementById('SWITCH').disabled = false;
  document.getElementById('SWITCH').src = "images/straight.png";
  document.getElementById('SWITCH').style.filter = "grayscale(0%)";
}

function addTypeOfTrack(trackPiece){
  switch(trackPiece){
    case STRAIGHT:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:[0,-1],
      });
      break;
    case LEFT:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir: [0,-1],
      });
      break;
    case RIGHT:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:[0,-1],
      });
      break;
    case JUMP:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:[0,-1],
      });
      break;
    case RAMP:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:[0,-1],
      });
      break;
    case INTERSECTION:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:[0,-1],
      });
      break;
    case BOOST:
      currentTrack.pieces.push({
        type:trackPiece,
        pos:[selectedGridPieceX,selectedGridPieceY,focusLayer],
        dir:[0,-1],
      });
      break;
  }
  clearAddPieMenu();
  draw(currentTrack);
}

function editTrackPiece(trackPiece){
  switch(trackPiece){
    case 0:
      currentTrack.pieces.splice(selectedTrackIndex,1);
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
      //switch from ramp to straight or vice versa
      break;
  }
  clearEditPieMenu();
  draw(currentTrack);
}

function isSpaceOccupied(xCoord,yCoord,zCoord){
  var selectedIndex = -1;
  for(var index = 0; index < currentTrack.pieces.length; index++){
    if((currentTrack.pieces[index].pos[0] == xCoord) && (currentTrack.pieces[index].pos[1] == yCoord) && (currentTrack.pieces[index].pos[2] == zCoord)){
      flag = true;
      selectedIndex = index;
    }
  }
  return selectedIndex;
}

function doMouseDown(e) {
    var canvas = document.getElementById('canvas');
    var widthX = (canvas.width / 2);
    var widthY = (canvas.width / 2);
    /* old placeholder function for testing - draws circle on click
    var context = canvas.getContext('2d');
    context.beginPath();
    context.arc(e.clientX, e.clientY, 25, 0, 2*Math.PI);
    context.fillStyle = "#000000";
    context.fill();*/
    selectedTrackPieceX = (e.clientX - ((e.clientX - panX%gridSize)%gridSize)) + (gridSize/2);
    selectedTrackPieceY = (e.clientY - ((e.clientY - panY%gridSize)%gridSize)) + (gridSize/2);
    selectedGridPieceX = Math.ceil(((selectedTrackPieceX - (gridSize/2)) - panX - widthX)/gridSize);
    selectedGridPieceY = Math.ceil(((selectedTrackPieceY - (gridSize/2)) - panY - widthY)/gridSize);

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
    var selectedIndex = isSpaceOccupied(selectedGridPieceX,selectedGridPieceY,focusLayer);
    if(pieAddMenuOpen == false && pieEditMenuOpen == false && rightClick == false && selectedIndex != 0){
      if((Math.abs(startX-e.clientX) < (gridSize/1.5)) && (Math.abs(startY-e.clientY) < (gridSize/1.5))){
        if(selectedIndex == -1)
          displayAddPieMenu();
        else if (pieEditMenuOpen == false){
          selectedTrackIndex = selectedIndex;
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
    drawGoodTracks();
}

function pan(x,y){
    panX += x;
    panY += y;
    drawGrid();
    drawGoodTracks();
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
    drawGrid();
    drawGoodTracks();
}

function resetScale(){
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
function threadGen() {
    var time;
    if (!working) {
        goodTracks = [];
        working = true;
        trackIndex = 0;

        if (trackInterval) clearInterval(trackInterval);
        trackInterval = setInterval(function () { drawGoodTracks(); trackIndex++; }, 100);

        time = Date.now();
        if (typeof (w) == "undefined") {
            w = new Worker("./generator.js");
        }

        // tell worker piece pool
        console.log('start');
        w.postMessage([10, 10, 10, 0, 4, 2, 2]);
        //w.postMessage([4, 4, 6, 0, 0, 0, 0]);
        //             L R S B Ra X J

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
