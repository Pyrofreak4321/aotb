var gridSize = 50;
var halfGrid = gridSize/2;
var goodTracks = [];
var trackIndex = 0;
var trackInterval;
var drawing = false;
var working = false;
var curTrack; //for the track being worked with/selected from generation

//changed these to consts and put them in number-order
const START = -1;
const RIGHT = 0;
const LEFT = 1;
const STRAIGHT = 2;
const BOOST = 3;
const RAMP = 4;
const INTERSECTION = 5;
const JUMP = 6;

//image locations
const IMAGES = [document.getElementById("imgCornerR"), document.getElementById("imgCornerL"), document.getElementById("imgStraight"),
document.getElementById("imgBoost"), document.getElementById("imgRamp"), document.getElementById("imgIntersection"),
document.getElementById("imgJumpLaunch"), document.getElementById("imgJumpCatch"), document.getElementById("imgStart")];

//initalize
window.onload = function () {
    //onclicks for the buttons
    document.getElementById("btnGen").onclick = function () {
        threadGen();
    }
    document.getElementById("btnSave").onclick = function () {
        console.log(JSON.parse(goodTracks[trackIndex]));
    };
    document.getElementById("btnLayer").onclick = function () {
        switchLayer();
    }
    //handler for when the window's resized
    window.addEventListener('resize', function () {
        drawResize();
    });
    //maximize the canvas size at the start so we don't have resize it (which resets the view to white)
    //this might not work if the user has multiple screens
    let canvas = document.getElementById('canvas');
    canvas.height = window.screen.availHeight - (window.outerHeight - window.innerHeight);
    canvas.width = window.screen.availWidth - (window.outerWidth - window.innerWidth);
    clearTrack();
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

function switchLayer() {
    //empty atm
}

//draw grid
function drawGrid() {
    let body = document.getElementById('body');
    let h = body.clientHeight;
    let w = body.clientWidth;
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');

    context.fillStyle = "#FFFFFF";
    context.strokeStyle = "#AAAAAA";
    context.fillRect(0, 0, w, h);

    context.beginPath();
    for (var x = 0; x < w; x += gridSize) {
        context.moveTo(x, 0);
        context.lineTo(x, h);
    }
    context.stroke();
    context.beginPath();
    for (var y = 0; y < h; y += gridSize) {
        context.moveTo(0, y);
        context.lineTo(w, y);
    }
    context.stroke();
}

//this is like draw grid but it doesn't recolor.
//minor visual issue: this currently draws lines over pieces of the track
function drawResize() {
    let body = document.getElementById('body');
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');

    let h = body.clientHeight;
    let w = body.clientWidth;
    context.strokeStyle = "#D1D1D1"; //this isn't "#AAAAAA" since that color was appearing darker than it should've for some reason
    context.beginPath();
    for (var x = 0; x < w; x += gridSize) {
        context.moveTo(x, 0);
        context.lineTo(x, h);
    }
    context.stroke();
    context.beginPath();
    for (var y = 0; y < h; y += gridSize) {
        context.moveTo(0, y);
        context.lineTo(w, y);
    }
    context.stroke();
}

//need to change this so it draws images
//draw track
function draw(track) {
    let body = document.getElementById('body');
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    //this should fix the window scaling issues
    let offsetx = (body.clientWidth / 2);
    let offsety = (body.clientHeight / 2);
    offsetx -= offsetx%gridSize;
    offsety -= offsety%gridSize;
    drawGrid();

    //draw each layer from bottom to top
    //will this *appear* to properly focus when layer switching is added? (as in, will they look distinct?)
        //maybe should edit the default color for empty tiles to be dark gray or dark green when focused on the upper layer?
    for (var i = 0; i <= 1; i++) {
        for (var s = 0; s < track.pieces.length; s++) {
            //if this is on the layer currently being drawn
            if (track.pieces[s].pos[2] == i) {
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
                        if (track.pieces[s].type == JUMP) {
                            context.drawImage(IMAGES[JUMP + 1], offsetx + ((track.pieces[s].pos[0] - track.pieces[s].dir[0]) * gridSize), 
                                offsety + ((track.pieces[s].pos[1] - track.pieces[s].dir[1]) * gridSize), gridSize, gridSize);
                            //context.fillRect(offsetx + ((track.pieces[s].pos[0] - track.pieces[s].dir[0]) * gridSize), offsety + ((track.pieces[s].pos[1] - track.pieces[s].dir[1]) * gridSize), gridSize, gridSize);
                        }
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
    drawResize();
}

function drawGoodTracks() {
    if (!drawing) {
        drawing = true;
        if (trackIndex < 0) {
            trackIndex = 0;
        }
        if (trackIndex >= goodTracks.length) {
            trackIndex = 0;
        }
        if (trackIndex < goodTracks.length) draw(JSON.parse(goodTracks[trackIndex]));
        drawing = false;
    }
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
            w = new Worker("js/generator.js");
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

function shift(event) {
    var x = event.keyCode;
    if (x == 37) {
        if (trackInterval) {
            clearInterval(trackInterval);
            trackInterval = null;
        }
        trackIndex--;
        drawGoodTracks();
    } else if (x == 39) {
        if (trackInterval) {
            clearInterval(trackInterval);
            trackInterval = null;
        }
        trackIndex++;
        drawGoodTracks();
    } else if (x == 32) {
        if (trackInterval) {
            clearInterval(trackInterval);
            trackInterval = null;
        }
        else
            trackInterval = setInterval(function () { drawGoodTracks(); trackIndex++; }, 100);
    }
}
