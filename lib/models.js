window.GridModel = Backbone.Model.extend({
    defaults: {
        grid: [ null, null, null,
                null, null, null,
                null, null, null ]
    },

    setGridElement: function(row, col, val) {
        var g = this.get('grid');
        g[row*3 + col] = val;
        this.set({'grid': g});
        console.log(g);
        this.change();
    }
});
