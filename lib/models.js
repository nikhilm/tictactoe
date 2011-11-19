window.GridModel = Backbone.Model.extend({
    defaults: {
        grid: [ null, null, null,
                null, null, null,
                null, null, null ],
        piece: null,
        ourTurn: false
    },

    initialize: function() {
        console.log('Our turn?', this.get('ourTurn'));
        window.subscriber.bind('move', this.opponentMove, this);
    },

    setGridElement: function(row, col, val) {
        var g = this.get('grid');
        g[row*3 + col] = val;
        this.set({'grid': g});
        console.log(g);
        this.change();
    },

    makeMove: function(row, col) {
        // ensure it is our turn,
        // then set it to be opponents turn
        // publish
        // then draw
        window.publisher.send({'action': 'move', 'row': row, 'col': col});
        this.setGridElement(row, col, this.get('piece'));
    },

    opponentPiece: function() {
        return this.get('piece') == 'x' ? 'o' : 'x';
    },

    opponentMove: function(move) {
        // when the opponent moves
        // ensure it *was* the opponent's turn
        // then set the variables to make it our turn
        // and only then draw the grid again
        this.setGridElement(move.row, move.col, this.opponentPiece());
    }
});
