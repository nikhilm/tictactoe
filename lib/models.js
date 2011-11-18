window.GridModel = Backbone.Model.extend({
    defaults: {
        grid: [ null, null, null,
                null, null, null,
                null, null, null ]
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

    makeMove: function(row, col, val) {
        this.setGridElement(row, col, val);
        window.publisher.send({'action': 'move', 'row': row, 'col': col, 'id': window.ourID});
    },

    opponentMove: function(move) {
        this.setGridElement(move.row, move.col, 'o');
    }
});
