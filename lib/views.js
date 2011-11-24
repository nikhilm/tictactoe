var StartView = Backbone.View.extend({
    tagName: 'div',
    id: 'startView',

    events: {
        'click #join-button a': 'join',
        'click #invite-button a': 'invite'
    },

    initialize: function() {
        this.render();
    },

    render: function() {
        // sorry :)
        $(this.el).html('<h4 id="join-button"><a href="#">Join game</a></h4>\n<h4 id="invite-button"><a href="#">Invite a friend</a></h4>');
    },

    join: function() {
        // TODO: actually try popping the queue, then queing ourselves
        // and push state only after we find the right match.
        webdis.get('/LPOP/playerqueue', _.bind(function(reply) {
            if (reply.LPOP == null) {
                // no players, let's act as a host
                webdis.get('/RPUSH/playerqueue/'+this.options.playerID, _.bind(function(reply) {
                    game.navigate('host/' + this.options.playerID, true);
                }, this));
            }
            else {
                // otherwise join that game
                game.navigate('play/' + reply.LPOP, true);
            }
            this.remove();
            return false;
        }, this));
    },

    invite: function() {
        var link = 'http://' + window.location.host + '/play/' + this.options.playerID;
        $.prompt({
            state0: {
                'html': '<p>Share this link and click OK</p><input value="' + link + '" />',
                'submit': _.bind(function() {
                    game.navigate('host/'+this.options.playerID, true);
                }, this)
            }
        });
        this.remove();
        return false;
    }
});

var WaitView = Backbone.View.extend({
    tagName: 'div',
    id: 'waitView',

    initialize: function() {
        this.render();
    },

    render: function() {
        $(this.el).html('<h4>Waiting for the other player...</h4>');

        var fade = _.bind(function(cb) {
            $(this.el).children('h4').animate({
                'opacity': 0.25,
            }, 1500, cb);
        }, this);

        var appear = _.bind(function(cb) {
            $(this.el).children('h4').animate({
                'opacity': 1
            }, 1500, _.bind(fade, this, appear));
        }, this);
        fade(appear);
    }
});

var GridView = Backbone.View.extend({
    tagName: 'div',
    id: 'container',
    cellWidth: 100,
    cellHeight: 100,

    initialize: function() {
        $('h1').after(this.el);
        this.paper = Raphael(this.el.id, 500, 500);
        this.model.bind('change', this.render, this);
        this.render();
        var radius = 30;
        this.O = this.paper.circle(radius, radius, 35);
        this.O.data('keep', true);
        this.O.attr({'stroke': '#000', 'stroke-width': '16'});
        this.O.hide();
        this.X = this.paper.path('M0,0l60,60m0,-60,l-60,60');
        this.X.data('keep', true);
        this.X.attr({'stroke': '#00f', 'stroke-width': '16', 'stroke-linecap': 'round'});
        this.X.hide();

        $(this.el).click(_.bind(this.makeMove, this));
    },

    render: function() {
        this.paper.forEach(function(elt) {
            if (elt.data('keep'))
                return;
            elt.remove();
        });
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

var HUDView = Backbone.View.extend({
    tagName: 'div',
    id: 'hud',
    initialize: function() {
        $(this.el).append('<h5 id="turnIndicator">');
        $(this.el).append('<h5 id="gameOver">');
        $(this.el).append('<h5 id="pieceIndicator">');
        this.model.bind('change:ourTurn', this.render, this);
        window.game.bind('gameover', this.render, this);
        this.render();
    },

    render: function() {
        $(this.el).children('#pieceIndicator').html('You are ' + this.model.get('piece').toUpperCase());
        if (this.model.get('ourTurn'))
            $(this.el).children('#turnIndicator').html('Your turn');
        else
            $(this.el).children('#turnIndicator').html('Opponent\'s turn');

        var state = arguments[0];
        if (typeof(state) != 'string')
            return this;

        if (state == 'draw')
            $(this.el).children('#gameOver').html('DRAW!');
        else if (state == 'won')
            $(this.el).children('#gameOver').html('YOU WON!');
        else if (state == 'lost')
            $(this.el).children('#gameOver').html('YOU LOST :(');
        $(this.el).children('#turnIndicator').html('');
        return this;
    }
});
