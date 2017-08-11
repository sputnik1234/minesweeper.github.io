/*  I shamelessly stole Donald's images and state var
    @ https://github.com/donaldali/odin-js-jquery/tree/master/minesweeper
*/
var STATE = {
  blank: 1,
  opened: 2,
  flagged: 3,
  question: 4
};

var IMAGE = {
  blank: 'images/board/blank.gif',
  flagged: 'images/board/flagged.gif',
  question: 'images/board/question.gif',
  minedeath: 'images/mine/minedeath.gif',
  minemisflagged: 'images/mine/minemisflagged.gif',
  minerevealed: 'images/mine/minerevealed.gif',
  facedead: 'images/face/facedead.gif',
  facesmile: 'images/face/facesmile.gif',
  facewin: 'images/face/facewin.gif',
  'number-': 'images/number/number-.gif',
  number0: 'images/number/number0.gif',
  number1: 'images/number/number1.gif',
  number2: 'images/number/number2.gif',
  number3: 'images/number/number3.gif',
  number4: 'images/number/number4.gif',
  number5: 'images/number/number5.gif',
  number6: 'images/number/number6.gif',
  number7: 'images/number/number7.gif',
  number8: 'images/number/number8.gif',
  number9: 'images/number/number9.gif',
  open0: 'images/open/open0.gif',
  open1: 'images/open/open1.gif',
  open2: 'images/open/open2.gif',
  open3: 'images/open/open3.gif',
  open4: 'images/open/open4.gif',
  open5: 'images/open/open5.gif',
  open6: 'images/open/open6.gif',
  open7: 'images/open/open7.gif',
  open8: 'images/open/open8.gif'
};

var board;
var size ;
var gameOver = false;
var cellsOpened = 0;
var timeOut;


function Board(bsize){
  size = bsize;
  this.grid = [[Cell]];
  this.minesPositions = [];
  this.timePassed = 0;
  this.minesLeft = size;
  this.firstClick = false;
  this.generateBoard();
  this.generateMines();
  this.updateNeighboursAdjacentMines();
  this.render();
  clearTimeout(timeOut);
  this.displayTimer();
  this.displayMines();
}

// Will create empty cells in the grid, and add them to the markup
Board.prototype.generateBoard = function(){
  for (var i = 0 ; i<size ; i++){
    this.grid.push([]);
    for (var j = 0 ; j<size ; j++){
      var cell = new Cell([i,j]);
      cell.addCellToMarkup();
      this.grid[i][j] = cell;
    }
  }
  $('.grid').width(size*16);
  $('.grid').height(size*16);
  $('.minesweeper').width(size*16);
}

// Generate  mines, if cell is already a mine, try another one
Board.prototype.generateMines = function(){
  var mines = 0;
  if (size == 9)
    mines = 9;
  else if (size == 15)
    mines = 35;
  else if (size == 20)
    mines = 99;
  for (var i = 0;i<mines;i++){
    var mine = getRandomCell(size,size);
    if (this.grid[mine[0]][mine[1]].isMine)
      i-=1;
    else{
      this.grid[mine[0]][mine[1]].isMine = true;
      this.minesPositions.push(mine);
    }
  }
}

// For each mine, find adjacent cells and increment adjacentMines counter
Board.prototype.updateNeighboursAdjacentMines = function(){
  var grid = this.grid;
  $.each(this.minesPositions, function(index,position){
    var neighbourPositions = grid[position[0]][position[1]].listNeighbourPositions();

    $.each(neighbourPositions, function(index,neighbour){
      grid[neighbour[0]][neighbour[1]].adjacentMines+=1;
    }) ;
  });
}
 
// Render the board
Board.prototype.render = function(){
  for (var i = 0 ; i<this.rows ; i++){
    for (var j = 0 ; j<this.columns ; j++){
      $('.'+i+'-'+j).attr('src', IMAGE.blank);
    }
  }
}

// Reveal all unrevealed mines when game Over
Board.prototype.revealMines = function(){
  for (var i = 0 ; i<size ; i++){
    for (var j = 0 ; j<size ; j++){
      if (this.grid[i][j].isMine && this.grid[i][j].state == 1)
        this.grid[i][j].updateCell(IMAGE.minerevealed);
      else if (!this.grid[i][j].isMine && this.grid[i][j].state == 3)
        this.grid[i][j].updateCell(IMAGE.minemisflagged);
    }
  }
}

//increments timePassed and display timer
Board.prototype.updateTimer = function(){
  if(gameOver)
    return;
  this.timePassed++;
  timeOut = setTimeout(this.updateTimer.bind(this), 1000 );
  this.displayTimer();
}

Board.prototype.displayTimer = function(){
  var displayStr = ('00' + Math.abs(this.timePassed) ).slice(-3);
      $( '#time0' ).attr( 'src', IMAGE['number' + displayStr[0]] );
      $( '#time1' ).attr( 'src', IMAGE['number' + displayStr[1]] );
      $( '#time2' ).attr( 'src', IMAGE['number' + displayStr[2]] );
}

Board.prototype.displayMines = function(){
  var displayStr = ('0' + this.minesLeft).slice(-3)
      $( '#mine0' ).attr( 'src', IMAGE['number' + displayStr[0]] );
      $( '#mine1' ).attr( 'src', IMAGE['number' + displayStr[1]] );
}

// Reveals neighbours of the clicked cell if they are not a mine or flagged
revealNeighbours = function(cell){
  //create an array of all cells to check
  var cellsToCheck = [];

  //add the clicked cell
  cellsToCheck.push(cell)

  /*  While there are still cells to check, add all the neighbours of the
      cell being check in the list, only if the cell is not a mine and not flagged
  */ 
  while(cellsToCheck.length>0){
    var neighbourPositions = cellsToCheck[0].listNeighbourPositions();
    $.each(neighbourPositions, function(index,neighbour){
      var c = board.grid[neighbour[0]][neighbour[1]];
      if(!c.isMine && c.state != 2 && c.state!=3 ){
        c.reveal();
        //only check the neighbours of the cell if the cell has no adjacent mines
        if (c.adjacentMines == 0)
          cellsToCheck.push(c)
      }
    });
    cellsToCheck.shift();
  }
}


//Class Cell
function Cell(position){
  this.position = position;
  this.state = STATE.blank;
  this.isMine = false;
  this.adjacentMines = 0;
}

//create markup for gtml document
Cell.prototype.addCellToMarkup = function(){
  var $div = $('<img  src='+IMAGE.blank+'>')
  $div.addClass('cell');
  $div.addClass(this.position[0]+'-'+this.position[1]);

  $('.grid').append($div);
}

//returns a list of positions vectors for all neighbours 
Cell.prototype.listNeighbourPositions = function(){
  var list = [];
  for (var i = -1;i<=1;i++){
    for (var j = -1;j<=1;j++){
      var pos = [this.position[0] +i,this.position[1] +j];
      // do not push initial cell in list
      if (isPositionValid(pos) && !(i == 0 && j == 0))
        list.push(pos);
    }
  }
  return list;
}

// reveal the cell, change img depending of type
Cell.prototype.reveal = function(){
  this.state = 2;
  if(this.isMine){
    this.updateCell(IMAGE.minedeath);
    loseGame();
  }
  else {
    switch (this.adjacentMines){
      case 0:
        this.updateCell(IMAGE.open0);
        revealNeighbours(this);
        break;
      case 1:
        this.updateCell(IMAGE.open1);
        break;
      case 2:
        this.updateCell(IMAGE.open2);
        break;
      case 3:
        this.updateCell(IMAGE.open3);
        break;
      case 4:
        this.updateCell(IMAGE.open4);
        break;
      case 5:
        this.updateCell(IMAGE.open5);
        break;
      case 6:
        this.updateCell(IMAGE.open6);
        break;
      case 7:
        this.updateCell(IMAGE.open7);
        break;
      case 8:
        this.updateCell(IMAGE.open8);
        break;
    }
  }
  this.updateCellsOpened();
}

Cell.prototype.putFlag = function(){
  if (this.state == 3){
    this.state = 1;
    this.updateCell(IMAGE.blank);
    board.minesLeft++;
    board.displayMines();
  }
  else if (this.state == 1){
    this.state = 3;
    this.updateCell(IMAGE.flagged);
    board.minesLeft--;
    board.displayMines();
  }
}

//change the src image of a cell
Cell.prototype.updateCell = function(img){
  $('.'+this.position[0]+'-'+this.position[1]).attr('src', img);
}

//keep track of the nb of cells opened, for checking win condition
Cell.prototype.updateCellsOpened = function(){
  cellsOpened++;
  if(cellsOpened === size*size-size)
    winGame();
}

function clicked(type, cell){
  if (!board.firstClick){
    board.firstClick = true;
    timeOut = setTimeout(board.updateTimer(), 1000 );
  }
  if(gameOver)
    return;
  switch (type){
    case 1:
      cell.reveal();
      break;
    case 2:
      cell.putFlag();
      break;
  }
}

function winGame(){
  $('.imgface').attr('src', IMAGE.facewin);
  gameOver = true;
}

function loseGame(){
  console.log('lost');
  board.revealMines();
  $('.imgface').attr('src', IMAGE.facedead);
  gameOver = true;
}



//helper functions
function getRandomInt(min,max){
   return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomCell(maxWidth,maxHeight){
  return [getRandomInt(0,maxWidth),getRandomInt(0,maxHeight)];
}

function isPositionValid(position){
  return position[0]>=0 && position[0]<size && position[1]>=0 && position[1]<size;
}

//listen for left and middle click on cells
function listenClick(){
  $('.cell').mousedown(function(event) {
    var x = $(this)[0].classList[1].match(/^\d+/);
    var y = $(this)[0].classList[1].match(/\d+$/);
    var cell = board.grid[x][y];
    switch (event.which) {
        case 1:
            clicked(1, cell);
            break;
        case 2:
            clicked(2, cell);
            break;
        default:
           break;
    }
  });
}

function init(size){
  $('.grid').empty();
  gameOver = false;
  cellsOpened = 0;
  board = new Board(size);
  listenClick();
  $('.imgface').attr('src', IMAGE.facesmile);
  
}


$(document).ready(function(){
  init(9);
});

$(document).on('change', 'input[name="radioOptions"]:radio', function(){
    init($('input[name="radioOptions"]:checked').val());
});