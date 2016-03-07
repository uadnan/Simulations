var TicTacSimulation = (function (SimpleCanvas) {
    
    Array.prototype.random = function() {
        return this[Math.floor(this.length * Math.random())];  
    };
    
    Array.prototype.extend = function (other) {
        other.forEach(function(v) {
            this.push(v)
        }, this);    
    };
    
    String.manipulate = function (str, times) {
        var newStr = str;
        for (var k = 1; k < times; k++) {
            newStr += str;
        }
        
        return newStr;
    };
     
    var Players = {
        None: 0,
        PlayerX: 1,
        PlayerY: 2,
        toString: function (player) {
            
            switch (player) {
                case Players.None:
                    return " ";
                case Players.PlayerX:
                    return "X";
                case Players.PlayerY:
                    return "O";
            }
            
            return "";
        }
    };
    
    var GameBoard = function (dimension, reverse, board) {
        
        var self = this;
        self.$dimension = dimension;
        self.$reverse = reverse || false;
        self.$board = new Array(dimension);
        
        for (var i = 0; i < dimension; i++) {
            self.$board[i] = new Array(dimension);
            for (var j = 0; j < dimension; j++) {
                self.$board[i][j] = board ? board[i][j] || Players.None : Players.None;
            }
        }
        
        this.__defineGetter__('dimension', function () {
            return self.$dimension;
        })
        
        this.toString = function () {
            var repr = "";
            
            GameBoard.iterGrid(self.$board, function (i, j, value) {
                
                repr += Players.toString(value); 
                repr += (j < self.$dimension - 1) ? '|' : '\n';
                
                if (j == self.$dimension - 1 && i != self.$dimension - 1) {
                    repr += String.manipulate('-', self.$dimension + 1);
                    repr += '-\n';   
                }
            });
           
            return repr;
        };
        
        this.square = function(row, col) {
            return self.$board[row][col];  
        };
        
        this.emptySquares = function() {
            var empty = new Array();
            
            GameBoard.iterGrid(self.$board, function (i, j, value) {
                if (value === Players.None) {
                    empty.push([i, j]);
                }
            });
            
            return empty;
        };
        
        this.move = function(row, col, player) {
            if (self.$board[row][col] == Players.None) {
                self.$board[row][col] = player;
            }
        };
        
        this.findWinner = function() {
            
            var lines = [];
            lines.extend(self.$board); // rows
            
            var cols = new Array(self.$dimension);
            for (var j = 0; j < self.$dimension; j++) {
                var row = new Array(self.$dimension);
                for (var i = 0; i < self.$dimension; i++) {
                    row[i] = self.$board[i][j];
                }
                
                cols.push(row);
            }
            lines.extend(cols); // cols
            
            var diagonal1 = new Array(self.$dimension);
            for (var i = 0; i < self.$dimension; i++) {
                diagonal1[i] = self.$board[i][i];
            }

            var diagonal2 = new Array(self.$dimension);
            for (var i = 0; i < self.$dimension; i++) {
                diagonal2[i] = self.$board[i][self.$dimension - i - 1];
            }

            lines.push(diagonal1);
            lines.push(diagonal2);
            
            var winner = null;
            lines.forEach(function (line) {
                 if (line[0] !== Players.None && new Set(line).size == 1) {
                     if (self.$reverse) {
                         winner = GameBoard.switchPlayer(line[0]);
                         return false;
                     }
                     
                     winner = line[0];
                     return false;
                 }
            });
            
            if (winner !== null)
                return winner;
            
            if (self.emptySquares().length === 0)
                return Players.None;
                
            return null;
        };
        
        this.clone = function() {
            return new GameBoard(self.$dimension, self.$reverse, self.$board);
        };
        
        this.forEach = function(callback) {
            GameBoard.iterGrid(self.$board, callback);  
        };
    };
    
    GameBoard.iterGrid = function (grid, callback) {
        for (var i = 0; i < grid.length; i++) {
            var row = grid[i];
            for (var j = 0; j < row.length; j++) {
                callback(i, j, row[j]);
            }
        }
    };
    
    GameBoard.switchPlayer = function(player) {
        if (player === Players.PlayerX)
            return Players.PlayerY;
        else if (player === Players.PlayerY)
            return Players.PlayerX;
            
        return Players.None;
    };

    var TicTacGui = function (aiMoveProvider, simulator) {
        
        var that = simulator;
        var self = this;
        self.$aiMoveProvider = aiMoveProvider;
        
        self.$canvas = new SimpleCanvas(that.$dom, {
            width: that.$options.width,
            height: that.$options.height
        });
        
        self.$canvas.background(that.$options.backgroundColor);
        self.$canvas.on('click', function (point) {
            
            if (self.$progress && self.$turn === self.$players.human) {
                var move = translatePointToCol(point[0], point[1]);
                self.$move(move[0], move[1], self.$players.human);
                self.$wait = false;
            }
        });
        
        self.$barSpacing = that.$options.width / that.$options.boardSize;
        self.$halfSize = 0.4 * self.$barSpacing;
       
        self.$players = {
            ai: that.$options.aiPlayer,
            human: GameBoard.switchPlayer(that.$options.aiPlayer)
        };
        
        self.$drawX = function(context, position) {
            
            context.drawLine(
                [position[0] - self.$halfSize, position[1] - self.$halfSize],
                [position[0] + self.$halfSize, position[1] + self.$halfSize],
                that.$options.barWidth, that.$options.barColor); 
                
            context.drawLine(
                [position[0] + self.$halfSize, position[1] - self.$halfSize],
                [position[0] - self.$halfSize, position[1] + self.$halfSize],
                that.$options.barWidth, that.$options.barColor);
        };
        
        self.$drawO = function(context, position) {
            context.drawCircle(position, self.$halfSize,
                that.$options.barWidth, that.$options.barColor);
        };
        
        self.$drawGridLines = function (context) {
            
            for (var i = 1; i < that.$options.boardSize; i++) {
                var barStart = self.$barSpacing * i;
                
                context.drawLine([barStart, 0], [barStart, that.$options.height],
                    that.$options.barWidth, that.$options.barColor);
                    
                context.drawLine([0, barStart], [that.$options.width, barStart],
                    that.$options.barWidth, that.$options.barColor);
            }
        };
        
        var translateColToPoint = function (row, col) {
            return [
                self.$barSpacing * (col + 0.5),
                self.$barSpacing * (row + 0.5)
            ];
        };
        
        var translatePointToCol = function (x, y) {
            return [Math.floor(y / self.$barSpacing), Math.floor(x / self.$barSpacing)];
        };
        
        self.$move = function (x, y, player) {
            if (self.$board.square(x, y) !== Players.None) return;
            self.$board.move(x, y, player);
                
            self.$turn = GameBoard.switchPlayer(player);
            var winner = self.$board.findWinner();
            if (winner !== null) {
                self.$gameOver(winner);
            }
        };
        
        self.$drawPlayers = function (context) {
            
            self.$board.forEach(function (i, j, player) {
                
                var position = translateColToPoint(i, j);
                if (player == Players.PlayerX)
                    self.$drawX(context, position);
                else if (player === Players.PlayerY) 
                    self.$drawO(context, position);
            });
        };
        
        self.$draw = function(context) {
            
            self.$drawGridLines(context);
            self.$drawPlayers(context);
            
            if (!self.$wait) {
                if (self.$progress && self.$turn === self.$players.ai) {
                    var move = self.$aiMoveProvider(self.$board, self.$players.ai, that.$options.trials);
                    self.$move(move[0], move[1], self.$players.ai);
                }
                
                self.$wait = true;
            }
        };
        
        self.$start = function() {
            self.$canvas.start(self.$draw);
        };
        
        self.$setWinner = function (winner) {
            var winBannerText = ""; 
            if (winner == Players.None)
                winBannerText = "It's a tie!";
            else if (winner == Players.PlayerX)
                winBannerText = "X wins!";
            else if (winner === Players.PlayerY) 
                winBannerText = "O wins!";
                
            if (winBannerText) {
                setTimeout(function () {
                    alert(winBannerText);
                }, 100);
            }
        };
        
        self.newGame = function() {
            self.$board = new GameBoard(that.$options.boardSize, that.$options.reverse);
            self.$progress = true;
            self.$wait = false;
            self.$turn = Players.PlayerX;
            
            self.$setWinner(null);
            self.$start();
        };
        
        self.$gameOver = function (winner) {
            self.$setWinner(winner);
            self.$progress = false;
        };
    };
    
    var TicTacSimulation = function (dom, options) {
        
        var self = this;
        
        self.$dom = dom;
        self.$options = $.extend({}, TicTacSimulation.defaults, options);
        
        self.createEmptyGrid = function(dimension) {
            var grid = new Array(dimension);
            for (var i = 0; i < dimension; i++) {
                grid[i] = new Array(dimension);
                for (var j = 0; j < dimension; j++) {
                    grid[i][j] = 0;
                }
            }  
            return grid;
        };
        
        self.makeRandomMove = function(board, player) {
            var emptySquares;
            while ((emptySquares = board.emptySquares()).length !== 0) {
                var move = emptySquares.random();
                board.move(move[0], move[1], player);
                
                if (board.findWinner() !== null) {
                    break;
                }
                
                player = GameBoard.switchPlayer(player);
            }
        };
        
        self.calculateScores = function(scores, board, player) {
            
            var winner = board.findWinner();
            board.forEach(function (i, j, value) {
                
                var s = 0;
                if (winner === Players.PlayerX &&
                    player === Players.PlayerY ||
                    winner === Players.PlayerX &&
                    player == Players.PlayerY) {
                        
                    s = value === Players.PlayerX ? self.$options.machineScore :
                            value === Players.PlayerY ? -1 * self.$options.humanScore : 0;
                            
                } else if (winner === Players.PlayerY &&
                    player === Players.PlayerX ||
                    winner === Players.PlayerY &&
                    player == Players.PlayerY) {
                    
                    s = value === Players.PlayerX ? -1 * self.$options.machineScore :
                            value === Players.PlayerY ? self.$options.humanScore : 0;
                }
                
                scores[i][j] += s;
            });
        };
        
        self.calculateHigestScoresFor = function(emptySquares, scores) {
            
            var maxScore = -1 * Infinity;
            emptySquares.forEach(function (pair) {
                var score = scores[pair[0]][pair[1]];
                if (score >= maxScore) {
                    maxScore = score; 
                }
            }); 
            
            return maxScore;            
        };
        
        self.guessBestMove = function(board, scores) {
            
            var emptySquares = board.emptySquares();
            var highScores = self.calculateHigestScoresFor(emptySquares, scores);
            
            var possibleMoves = [];
            board.forEach(function (i, j, value) {
                if (scores[i][j] === highScores) {
                    if (value == Players.None) {
                        possibleMoves.push([i, j]);
                    }
                }
            });
            
            return possibleMoves.random();
        };
        
        self.$gui = new TicTacGui(function (board, player, trials) {
            
            var scores = self.createEmptyGrid(self.$options.boardSize);
            
            for (var i = 0; i < trials; i++) {
                var boardCopy = board.clone();
                self.makeRandomMove(boardCopy, player);
                self.calculateScores(scores, boardCopy, player);
            }
            
            return self.guessBestMove(board, scores);
            
        }, self);
        dom.append($("<button>").html("New Game").click(function () {
            self.restart();
        }));
        
        self.$gui.newGame();
        self.restart = function() {
            self.$gui.newGame();
        };
        
        self.stop = function() {
            self.$gui.$canvas.stop();  
        };
        
        return self;
    };
    
    TicTacSimulation.defaults = {
        width: 400,
        height: 400,
        barWidth: 5,
        
        reverse: false,
        boardSize: 3,
        trials: 20,
        aiPlayer: Players.PlayerX,
        
        backgroundColor: 'white',
        barColor: 'black',
        
        machineScore: 1.0, // Score for squares played by the machine player
        humanScore: 1.0 // Score for squares played by the other player 
    };
    
    return TicTacSimulation;
    
})(window.SimpleCanvas);