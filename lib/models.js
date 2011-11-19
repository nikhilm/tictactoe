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
        // don't play if not our turn
        if (!this.get('ourTurn'))
            return;

        // no longer our turn
        this.set({'ourTurn': false});

        // publish
        window.publisher.send({'action': 'move', 'row': row, 'col': col});

        // then draw
        this.setGridElement(row, col, this.get('piece'));
    },

    opponentPiece: function() {
        return this.get('piece') == 'x' ? 'o' : 'x';
    },

    opponentMove: function(move) {
        if (this.get('ourTurn')) {
            // if this is true, the opponent and us
            // are immediately out of sync, and the game
            // is up, but unless some one is cheating
            // this shouldn't happen
            return;
        }

        this.set({'ourTurn': true});

        this.setGridElement(move.row, move.col, this.opponentPiece());
    }
});
