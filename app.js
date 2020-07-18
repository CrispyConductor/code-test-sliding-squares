var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var seedrandom = require('seedrandom');
var randomstring = require('randomstring');
var fs = require('fs');
var marked = require('marked');

var app = express();

function makePuzzle(sizeX, sizeY, nMoves, rng) {
	var grid = [];
	grid.getAt = function(x, y) { return grid[y * sizeX + x]; }
	grid.setAt = function(x, y, v) { grid[y * sizeX + x] = v; }
	grid.width = sizeX;
	grid.height = sizeY;
	var i;
	for(i = 0; i < sizeX * sizeY - 1; ++i) grid.push(i);
	grid.push(null);
	var emptyX = sizeX - 1;
	var emptyY = sizeY - 1;
	for(i = 0; i < nMoves; ++i) {
		var adjacentSquares = 4;
		if(emptyX == 0 || emptyX == sizeX - 1) adjacentSquares--;
		if(emptyY == 0 || emptyY == sizeY - 1) adjacentSquares--;
		var direction = Math.floor((rng ? rng() : Math.random()) * adjacentSquares);
		for(var cur = 0; ; ++cur) {
			var valid;
			switch(cur) {
				case 0:	valid = emptyX > 0; break;		// -X
				case 1: valid = emptyX < sizeX - 1; break;	// +X
				case 2: valid = emptyY > 0; break;		// -Y
				case 3: valid = emptyY < sizeY - 1; break;	// +Y
				default: throw new Error('Invalid direction');
			}
			if(valid && (direction--) === 0) {
				switch(cur) {
					case 0:
						grid.setAt(emptyX, emptyY, grid.getAt(emptyX - 1, emptyY));
						grid.setAt(emptyX - 1, emptyY, null);
						emptyX--;
						break;
					case 1:
						grid.setAt(emptyX, emptyY, grid.getAt(emptyX + 1, emptyY));
						grid.setAt(emptyX + 1, emptyY, null);
						emptyX++;
						break;
					case 2:
						grid.setAt(emptyX, emptyY, grid.getAt(emptyX, emptyY - 1));
						grid.setAt(emptyX, emptyY - 1, null);
						emptyY--;
						break;
					case 3:
						grid.setAt(emptyX, emptyY, grid.getAt(emptyX, emptyY + 1));
						grid.setAt(emptyX, emptyY + 1, null);
						emptyY++;
						break;
					default:
						throw new Error('Invalid direction');
				}
				break;
			}
		}
	}
	return grid;
}

function prettyJSONPuzzle(grid, seed) {
	function elStr(el) {
		if(typeof el == 'number') {
			return ('   ' + el).slice(-4);
		} else {
			return 'null';
		}
	}
	var str = '{ "width": ' + grid.width + ', "height": ' + grid.height + ', "id": "' + seed + '", "grid": [\n\n';
	for(var y = 0; y < grid.height; ++y) {
		str += '    ';
		for(var x = 0; x < grid.width; ++x) {
			str += elStr(grid.getAt(x, y));
			if(y < grid.height - 1 || x < grid.width - 1) str += ',';
			if(x < grid.width - 1) str += ' ';
		}
		str += '\n';
	}
	str += '\n] }\n';
	return str;
}

function makePuzzleFromSeed(size, seed, difficulty) {
	if(size < 2) throw new Error('Invalid size.');
	if(size > 16) throw new Error('Size is too large.');
	if(difficulty < 0) throw new Error('Invalid difficulty.');
	if(difficulty > 255) throw new Error('Difficulty is too high.');
	var rng = seedrandom('hiasfjhilv'+seed);
	var nMoves = Math.floor(rng() * size * size * (difficulty + 1)) + Math.floor(size * size / 2);
	//var nMoves = 2;
	var grid = makePuzzle(size, size, nMoves, rng);
	return grid;
}

function makeRandPuzzle(size, difficulty) {
	var seed = randomstring.generate(10);
	var grid = makePuzzleFromSeed(size, seed, difficulty);
	return {
		grid: grid,
		seed: seed,
		size: size,
		difficulty: difficulty
	};
}

function validateSolution(size, seed, difficulty, solution) {
	if(!Array.isArray(solution)) throw new Error('Invalid solution format.');
	var grid = makePuzzleFromSeed(size, seed, difficulty);
	var width = grid.width;
	var height = grid.height;
	function swap(x1, y1, x2, y2) {
		var tmp = grid.getAt(x1, y1);
		grid.setAt(x1, y1, grid.getAt(x2, y2));
		grid.setAt(x2, y2, tmp);
	}
	solution.forEach(function(nextCoords) {
		if(!Array.isArray(nextCoords) || nextCoords.length != 2 || typeof nextCoords[0] != 'number' || typeof nextCoords[1] != 'number') throw new Error('Invalid solution format.');
		var nextX = nextCoords[0];
		var nextY = nextCoords[1];
		if(nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) throw new Error('Invalid solution coordinate.');
		if(nextX >= 1 && grid.getAt(nextX - 1, nextY) === null) swap(nextX, nextY, nextX - 1, nextY);
		else if(nextX < width - 1 && grid.getAt(nextX + 1, nextY) === null) swap(nextX, nextY, nextX + 1, nextY);
		else if(nextY >= 1 && grid.getAt(nextX, nextY - 1) === null) swap(nextX, nextY, nextX, nextY - 1);
		else if(nextY < height - 1 && grid.getAt(nextX, nextY + 1) === null) swap(nextX, nextY, nextX, nextY + 1);
		else throw new Error('Incorrect solution - tried to make invalid move.');
	});
	for(var i = 0; i < size*size-1; ++i) {
		if(grid[i] !== i) throw new Error('Incorrect solution.');
	}
}

app.use(morgan());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	fs.readFile(__dirname + '/codetest.md', { encoding: 'utf8' }, function(error, data) {
		if(error) return res.send(error);
		res.set('Content-type', 'text/html');
		res.send(marked(data));
	});
});

app.get('/puzzle', function(req, res) {
	res.set('Content-type', 'application/json');
	if(!req.query.size) {
		res.send(400, JSON.stringify({ error: 'Missing required parameter: size' }));
		return;
	}
	var size = parseInt(req.query.size);
	if(isNaN(size)) {
		res.send(400, JSON.stringify({ error: 'Invalid parameter: size' }));
		return;
	}
	var difficulty = req.query.difficulty;
	if(!difficulty) {
		difficulty = 3;
	} else {
		difficulty = parseInt(difficulty);
		if(isNaN(difficulty)) {
			res.send(400, JSON.stringify({ error: 'Invalid parameter: difficulty' }));
			return;
		}
	}
	var id = req.query.id ? (''+req.query.id) : null;
	var puzzle;
	try {
		if(id) {
			puzzle = {
				grid: makePuzzleFromSeed(size, id, difficulty),
				seed: id,
				size: size,
				difficulty: difficulty
			};
		} else {
			puzzle = makeRandPuzzle(size, difficulty);
		}
	} catch (ex) {
		res.send(400, JSON.stringify({ error: ex.message }));
		return;
	}
	res.send(prettyJSONPuzzle(puzzle.grid, puzzle.seed));
});

app.get('/verify', function(req, res) {
	res.send('Use POST instead.');
});

app.post('/verify', function(req, res) {
	res.set('Content-type', 'application/json');
	if(!req.query.size) {
		res.send(400, JSON.stringify({ error: 'Missing required parameter: size' }));
		return;
	}
	if(!req.query.id) {
		res.send(400, JSON.stringify({ error: 'Missing required parameter: id' }));
		return;
	}
	var size = parseInt(req.query.size);
	var id = req.query.id;
	if(isNaN(size)) {
		res.send(400, JSON.stringify({ error: 'Invalid parameter: size' }));
		return;
	}
	var difficulty = req.query.difficulty;
	if(!difficulty) {
		difficulty = 3;
	} else {
		difficulty = parseInt(difficulty);
		if(isNaN(difficulty)) {
			res.send(400, JSON.stringify({ error: 'Invalid parameter: difficulty' }));
			return;
		}
	}
	if(!req.body) {
		res.send(400, JSON.stringify({ error: 'Missing POST body.' }));
		return;
	}
	try {
		validateSolution(size, id, difficulty, req.body);
	} catch (ex) {
		res.send(409, JSON.stringify({ valid: false, error: ex.message }));
		return;
	}
	res.send(JSON.stringify({ valid: true }));
});

var port = 3030;
app.listen(port, function() {
	console.log('Listening on port ' + port);
});
