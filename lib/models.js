window.GridModel = Backbone.Model.extend({
    defaults: {
        grid: [ null, null, null,
                null, null, null,
                null, null, null ],
        piece: null
    },

    initialize: function() {
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
        console.log(this.piece);
        this.setGridElement(row, col, this.get('piece'));
        window.publisher.send({'action': 'move', 'row': row, 'col': col});
    },

    opponentPiece: function() {
        return this.get('piece') == 'x' ? 'o' : 'x';
    },

    opponentMove: function(move) {
        this.setGridElement(move.row, move.col, this.opponentPiece());
    }
});
