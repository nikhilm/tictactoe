window.GridModel = Backbone.Model.extend({
    defaults: {
        grid: [ null, null, null,
                null, null, null,
                null, null, null ],
        piece: null,
        ourTurn: false,
        gameover: null,
    },

    initialize: function() {
        console.log('Our turn?', this.get('ourTurn'));
        window.subscriber.bind('move', this.opponentMove, this);
    },

    setGridElement: function(row, col, val) {
        if (this.get('gameover'))
            return;
        var g = this.get('grid');
        g[row*3 + col] = val;
        this.set({'grid': g});
        console.log(g);
        this.change();
    },

    makeMove: function(row, col) {
        if (this.get('gameover'))
            return;
        // don't play if not our turn
        if (!this.get('ourTurn'))
            return;

        // no longer our turn
        this.set({'ourTurn': false});

        // publish
        window.publisher.send({'action': 'move', 'row': row, 'col': col});

        // then draw
        this.setGridElement(row, col, this.get('piece'));

        // evaluate situation
        this.check();
    },

    opponentPiece: function() {
        return this.get('piece') == 'x' ? 'o' : 'x';
    },

    opponentMove: function(move) {
        if (this.get('gameover'))
            return;
        if (this.get('ourTurn')) {
            // if this is true, the opponent and us
            // are immediately out of sync, and the game
            // is up, but unless some one is cheating
            // this shouldn't happen
            return;
        }

        this.set({'ourTurn': true});

        this.setGridElement(move.row, move.col, this.opponentPiece());

        // evaluate situation
        this.check();
    },

    check: function() {
        var won = false, lost = false;
        var g = this.get('grid');

        // rows
        for (var i = 0; i < 3; i++) {
            if (g[i*3] && g[i*3] == g[i*3+1] && g[i*3] == g[i*3+2]) {
                won = g[i*3] == this.get('piece');
                lost = !won;
                console.log('row', i, won, lost);
            }
        }

        // columns
        for (var i = 0; i < 3; i++) {
            if (g[i] && g[i] == g[i+3] && g[i] == g[i+6]) {
                won = g[i] == this.get('piece');
                lost = !won;
                console.log('col', i, won, lost);
            }
        }

        // diagonals
        if ((g[0] && g[0] == g[4] && g[0] == g[8]) ||
            (g[2] && g[2] == g[4] && g[2] == g[6])) {
            // since g[4] is common use that
            won = g[4] == this.get('piece');
            lost = !won;
            console.log('diag', won, lost);
        }

        if (!lost && !won) {
            // check draw
            if (!_.include(g, null)) {
                console.log('draw');
                // our app needs to corraborate this with the opponent
                // but this model is done and is no longer useful
                this.set({'gameover': 'draw'});
            }
        }

        if (lost || won) {
            console.log('won/lost', won, lost);
            this.set({'gameover': won ? 'won' : 'lost'});
        }
    }
});
