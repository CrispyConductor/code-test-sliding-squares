# Sliding Squares Coding Test

## The Task

Your task is to build a program that finds the sequence of moves to solve a sliding squares puzzle, like this:

![Sliding Squares Puzzle](http://2.bp.blogspot.com/-YyRRefGeo0A/Tb6ZePINW2I/AAAAAAAAA1I/0HDbDAufCcY/s1600/Number%252520Puzzle%252520Wall%252520Panel%2525201-15.jpg)

## Background

This type of puzzle starts as a square grid of numbers, where the numbers are in order.  The last number is missing.

![Solved Puzzle](http://www.cleavebooks.co.uk/puzzles/slideblk/sb1415.gif)

The grid is then scrambled by moving numbers into an adjacent empty square.  To solve the puzzle, the numbers must be unscrambled in the same way,
by sliding numbers into the empty square.

## The API

You will have to interface with an API that we provide to generate and validate puzzle solutions.  The API to generate puzzles can be accessed at:

`GET http://HOSTNAME/puzzle?size=3&difficulty=8`

The `size` parameter specifies the size of the puzzle, and can range from 2 to 16.  The `difficulty` parameter specifies an approximate
difficulty to solve, and can range from 0 to 255.

The return value from the API looks like this:

```javascript
{ "width": 3, "height": 3, "id": "xfzEgisOA5", "grid": [

       0,    1, null,
       3,    4,    2,
       6,    7,    5

] }
```

The grid array is an array of squares, where each square contains a number.  The single square containing a null is the empty square.  The
array is in row-major order, ie, the square containing `2` is at coordinates [2, 1], at index 5 in the array.  Note that coordinates are
specified as [X, Y], or [Col, Row], indexed from 0.

The web service also provides an endpoint to validate a solution:

`POST http://HOSTNAME/verify?size=3&id=xfzEgisOA5&difficulty=8`

The size and difficulty must match the original size and difficulty specified for the puzzle, and the `id` parameter must match the id that was
returned with the puzzle.  You must supply the header `Content-type` with a value of `application/json`, and must provide a list of moves
to solve the puzzle as the POST body.

The format of the solution is an array of coordinate pairs, where each coordinate pair indicates the square which is moved.  For example, the
solution to the above example puzzle would be:

```javascript
[ [ 2, 1 ], [ 2, 2 ] ]
```

This indicates that, first, the `2` square is moved, and then the `5` square is moved.

## Requirements

To complete the coding test, you must build an application in Node.JS to solve these puzzles.  It should accept the size and difficulty as
command-line arguments, like:

`node solver.js 3 8`

The application should then request a fresh puzzle from the web service, figure out a solution, and submit the solution for validation.  It should
print out both the puzzle (in a nice, human-readable format) and the solution.  After completing, the program should exit.

You may use any npm modules that you find useful in the application.  Write the application as if you were writing professional code - it should be
well-structured and well-commented.  The project should include a package.json file such that `npm install` will install everything needed.  Please submit
your code test as a .tar.gz file, a .tar.bz2 file, or a .zip file.

Submissions will be judged on the following criteria:

* Code structure
* Code style (no particular style, but should be generally well-formatted)
* Accuracy of solution
* Originality/creativity of solver algorithm
* Speed of algorithm
* Adherence to guidelines

If you cannot complete the code test, partial solutions will be accepted.  In this case, please document where you got stuck, and what your next
steps would be.

Good luck!


