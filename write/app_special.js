const modal = document.querySelector('#modal');
const btnClear=document.querySelector('#btnClear')
const btnDraw=document.querySelector('#btnDraw')
const btnSave=document.querySelector('#btnSave')
const btnDrawText=document.querySelector('#btnDrawText')
const btnColor=document.querySelector('#btnColor');
const inpText=document.querySelector('#inpText')
const slider=document.querySelector('#slider')
const lblSlider=document.querySelector('#lblSlider')
const slideOpac=document.querySelector('#sliderOpac')
const lblSliderOpac=document.querySelector('#lblSliderOpac')
const totalPoint=document.querySelector('#totalPoint');
const colorWheel=document.querySelector('#colorWheel')
const canvas1 = document.querySelector('#canvas');
const ctx1 = canvas1.getContext('2d');
let paths=[];
let paint;
let lineCap="round"; //"butt"
let lineJoin="round";
let bubbleTextArray = [];
let adjustX = -3;
let adjustY = -3;

// CHANGED: scale reduced from 12 → 7 so Latin letters aren't oversized
let scale = 7;

let textCoordinates;

// CHANGED: default font size raised from 24 → 40 (Latin letters need more pixels)
let textPixel = 40;

let wins=false;
let detect=[];
let picked=[];
let colorPick;
let colorTransparent;
let pickColor=[];
let count=0;
let ok=true;
pickColor[0]=224;
pickColor[1]=150
pickColor[2]=24;
pickColor[3]=1;
colorTransparent='rgba(0,0,0,0)';
colorPick='rgba('+pickColor[0]+','+pickColor[1]+','+pickColor[2]+','+pickColor[3]+')';

// CHANGED: font family changed from Georgia (thin serif) → Verdana bold (thick sans)
ctx1.font = 'bold 40px Verdana, Arial, sans-serif';

canvas1.width = 340;
canvas1.height =340;
DrawSVGPie(0)

const canvasTemp = document.createElement('canvas');
const ctxTemp = canvasTemp.getContext('2d');

// CHANGED: buffer enlarged from 48×48 → 96×96 to fit larger Latin glyphs
canvasTemp.width = 96;
canvasTemp.height = 96;

ctxTemp.fillStyle = 'white';
btnColor.style.backgroundColor=colorPick;
btnColor.style.color=colorPick;

// CHANGED: default sample text swapped from Chinese poem → Latin alphabet
let writeStr='ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let inStr=getUrlVars()["w"];
if(inStr!=null) {
  writeStr=decodeURIComponent(inStr);
}

class Particle {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.size = 7;
    this.bX = this.x/scale-2;
    this.bY = this.y/scale-3;
  }
  draw() {
    ctx1.lineWidth = 1;
    ctx1.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx1.fillStyle = 'rgba(255,80,80,0.6)';
    ctx1.beginPath();
    this.size = 5;
    ctx1.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.stroke();
    ctx1.closePath();
    ctx1.beginPath();
    ctx1.arc(this.x + 1, this.y -1, this.size/3, 0, Math.PI * 2);
    ctx1.closePath();
  }
}

function createText() {
  detect=[];
  bubbleTextArray = [];
  for (let y = 0, y2 = textCoordinates.height; y < y2; y++){
    for (let x = 0, x2 = textCoordinates.width; x < x2; x++){
      if (textCoordinates.data[(y * 4 * textCoordinates.width) + (x * 4) + 3] > 128){
        let positionX = x + adjustX;
        let positionY = y + adjustY;
        bubbleTextArray.push(new Particle(positionX * scale, positionY * scale));
      }
    }
  }

  ctx1.fillStyle=colorPick;
  ctx1.strokeStyle=colorPick;
}

function drawBigText(){
  ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
  for (let i = 0; i < bubbleTextArray.length; i++){
    bubbleTextArray[i].draw();
  }
  totalPoint.innerHTML='0 / '+bubbleTextArray.length;
}

function drawText(txt){
  return new Promise(resolve => {
    ctxTemp.clearRect(0, 0, canvasTemp.width, canvasTemp.height);

    // CHANGED: same bold sans-serif font at the larger textPixel size
    ctxTemp.font = 'bold ' + textPixel + 'px Verdana, Arial, sans-serif';

    // CHANGED: origin moved so the glyph sits centered in the 96×96 buffer
    ctxTemp.fillText(txt, 14, textPixel + 10);

    textCoordinates = ctxTemp.getImageData(0, 0, textPixel*2, textPixel*2);
    createText();
    drawBigText();
    picked=[];
    picked=bubbleTextArray.map(({ bX,bY }) => ({ bX, bY  }))
    resolve(colorPick='rgba('+pickColor[0]+','+pickColor[1]+','+pickColor[2]+','+sliderOpac.value/10+')')
  })
}

initColor();
let ctxWheel=colorWheel.getContext('2d');
let canvasWPosition = colorWheel.getBoundingClientRect();

function initColor(){
  let img=new Image();
  img.onload=function(){
    colorWheel.width=img.width;
    colorWheel.height=img.height;
    ctxWheel.drawImage(img,0,0);
  }
  img.src='data:image/png;base64,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';
}

colorWheel.addEventListener('mouseup',function(e){
  e.preventDefault();
  let x =e.x - canvasWPosition.left;
  let y =e.y - canvasWPosition.top;
  pickColor = ctxWheel.getImageData(x, y, 1, 1).data;
  colorPick='rgba('+pickColor[0]+','+pickColor[1]+','+pickColor[2]+','+sliderOpac.value/10+')';
  btnColor.style.backgroundColor=colorPick;
})

colorWheel.addEventListener('touchstart',function(e){
  e.preventDefault()
  let x =e.targetTouches[0].pageX-canvasWPosition.left;
  let y =e.targetTouches[0].pageY-canvasWPosition.top;
  pickColor = ctxWheel.getImageData(x, y, 1, 1).data;
  colorPick='rgba('+pickColor[0]+','+pickColor[1]+','+pickColor[2]+','+sliderOpac.value/10+')';
  btnColor.style.backgroundColor=colorPick;
})

lblSlider.innerHTML=slider.value;
lblSliderOpac.innerHTML=sliderOpac.value/10;
ctx1.strokeStyle =colorPick;
ctx1.lineJoin = lineJoin;
inpText.value=writeStr[count]
btnDrawText.click();
slider.addEventListener('change',function(){
  lblSlider.innerHTML=slider.value;
  ctx1.strokeStyle =colorPick;
  ctx1.lineWidth = slider.value;
  ctx1.lineJoin = lineJoin;
})

sliderOpac.addEventListener('change',function(){
  lblSliderOpac.innerHTML=sliderOpac.value/10;
  colorPick='rgba('+pickColor[0]+','+pickColor[1]+','+pickColor[2]+','+sliderOpac.value/10+')';
})

function addPath(x, y, dragging) {
  ctx1.lineJoin = lineJoin;
  ctx1.lineCap =lineCap;
  ctx1.fillStyle=colorPick;
  ctx1.strokeStyle =colorPick;
  paths.push({
    x:x,
    y:y,
    radius:ctx1.lineWidth,
    color:colorPick,
    dragging:dragging
  })
  checkPointInPaths(x,y,ctx1.lineWidth)
}

function checkPointInPaths(x,y,radius){
  let distance;
  let lx,ly,lr;
  let distanceUniq=[];
  let percentage;
  for (let i = 0; i < bubbleTextArray.length; i++){
    lr=bubbleTextArray[i].size+radius;
    lx=(bubbleTextArray[i].x-x);
    ly=(bubbleTextArray[i].y-y);
    distance = Math.sqrt(lx*lx+ly*ly)
    if(distance<lr/1.4){
      detect.push(i);
      distanceUniq=uniq(detect)
      totalPoint.innerHTML=distanceUniq.length+' / '+bubbleTextArray.length;
      percentage=Math.floor(distanceUniq.length/bubbleTextArray.length*100);
      DrawSVGPie(percentage)
      if(distanceUniq.length===bubbleTextArray.length){
        wins=true;
        DrawSVGPie(0)
      }
    }
  }
}

function uniq(a) {
  return a.sort().filter(function(item, pos, ary) {
    return !pos || item != ary[pos - 1];
  });
}

function clearCanvas(){
  ctx1.clearRect(0, 0, canvas1.width,canvas1.height);
}

function redraw() {
  ctx1.lineCap = lineJoin;
  ctx1.clearRect(0, 0, canvas1.width,canvas1.height);
  for (let i = 0; i < paths.length; i += 1) {
    ctx1.lineWidth=paths[i].radius;
    ctx1.fillStyle=paths[i].color;
    ctx1.strokeStyle =paths[i].color;
    if (!paths[i].dragging && i == 0) {
      ctx1.beginPath();
      ctx1.moveTo(paths[i].x, paths[i].y);
      ctx1.stroke();
    } else if (!paths[i].dragging && i > 0) {
      ctx1.closePath();
      ctx1.beginPath();
      ctx1.moveTo(paths[i].x, paths[i].y);
      ctx1.stroke();
    } else {
      ctx1.lineTo(paths[i].x, paths[i].y);
      ctx1.stroke();
    }
  }
}

function drawNew(radius) {
  let i = paths.length - 1;
  ctx1.lineWidth=radius;
  ctx1.lineCap =lineCap;
  ctx1.fillStyle=colorPick;
  ctx1.strokeStyle =colorPick;;
  if (!paths[i].dragging) {
    if (paths.length == 0) {
      ctx1.beginPath();
      ctx1.moveTo(paths[i].x, paths[i].y);
      ctx1.stroke();
    } else {
      ctx1.closePath();
      ctx1.beginPath();
      ctx1.moveTo(paths[i].x, paths[i].y);
      ctx1.stroke();
    }
  } else {
    ctx1.lineTo(paths[i].x, paths[i].y);
    ctx1.stroke();
  }
}

function checkWin(){
  if(wins) {
    wins=false;
    if(count===writeStr.length-1) {
      modal.style.display = "block";
      if(ok){
        count=0;
        inpText.value=writeStr[count];
        btnDrawText.click();
        ok=false;
      }
    } else{
        if(count<writeStr.length-1) count++;
        inpText.value=writeStr[count];
        btnDrawText.click();
    }
  }
}

function delay(delayInms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
