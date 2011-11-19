var StartView = Backbone.View.extend({
    tagName: 'div',
    id: 'startView',

    events: {
        'click #join-button a': 'join',
        'click #invite-button a': 'invite'
    },

    render: function() {
    },

    join: function() {
        // TODO: actually try popping the queue, then queing ourselves
        // and push state only after we find the right match.
        game.navigate('play/'+this.options.playerID, true);
        return false;
    },

    invite: function() {
        var link = 'http://' + window.location.host + '/play/' + this.options.playerID;
        $.prompt({
            state0: {
                'html': '<p>Share this link:</p><input value="' + link + '" />',
                'submit': _.bind(function() {
                    game.navigate('play/'+this.options.playerID, true);
                }, this)
            }
        });
    }
});

var GridView = Backbone.View.extend({
    tagName: 'div',
    id: 'container',
    cellWidth: 100,
    cellHeight: 100,

    initialize: function() {
        this.paper = Raphael(this.el.id, 500, 500);
        this.model.bind('change', this.render, this);
        this.render();
        var radius = 35;
        this.O = this.paper.circle(radius, radius, 35);
        this.O.attr({'stroke': '#000', 'stroke-width': '16'});
        this.O.hide();
        this.X = this.paper.path('M0,0l60,60m0,-60,l-60,60');
        this.X.attr({'stroke': '#00f', 'stroke-width': '16', 'stroke-linecap': 'round'});
        this.X.hide();

        $('#container').click(_.bind(this.makeMove, this));
    },

    render: function() {
        this.paper.clear();
        var vert = 'M30,30';
        for (var i = 1; i < 3; i++) {
            vert += 'M' + (30+i*this.cellWidth) + ',30';
            vert += 'l0,' + 3*this.cellHeight;
        }
        var horiz = 'M30,30';
        for (var j = 1; j < 3; j++) {
            horiz += 'M30,' + (30+j*this.cellHeight);
            horiz += 'l' + 3*this.cellWidth + ',0';
        }

        this.paper
            .path(vert)
            .attr({
                'stroke': '#000',
                'stroke-width': '5'
        });

        this.paper
            .path(horiz)
            .attr({
                'stroke': '#000',
                'stroke-width': '5'
        });

        var g = this.model.get('grid');
        for (var i = 0; i < g.length; i++) {
            var elem = null;
            if (!g[i])
                continue;

            elem = g[i] == 'x' ? this.X : this.O;
            elem.clone().translate(50 + i%3 * this.cellWidth,
                                   50 + parseInt(i/3) * this.cellHeight);
        }
    },

    makeMove: function(e) {
        var x = e.pageX - $('#container')[0].offsetLeft;
        var y = e.pageY - $('#container')[0].offsetTop;

        var col = parseInt((x-30)/this.cellWidth);
        var row = parseInt((y-30)/this.cellHeight);
        this.model.makeMove(row, col, 'x');
    }
});