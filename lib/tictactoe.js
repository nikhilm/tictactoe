$(function() {
var AUTH = 'Basic dGljdGFjdG9lOmVuZGdhbWU=';

var Subscriber = function(id) {
    this.channelID = id;
    // we don't use jQuery here because we want a
    // request that can handle chunked responses
    this.socket = new XMLHttpRequest();
    this.socket.open('GET', 'http://' + window.location.host + '/SUBSCRIBE/' + this.channelID, true);
    this.socket.setRequestHeader('Authorization', AUTH);
    this.pos = 0;
    this.socket.onreadystatechange = _.bind(function() {
        if (this.socket.responseText) {
            var data = this.socket.responseText.substr(this.pos);
            this.pos = this.socket.responseText.length;

            var msg = JSON.parse(data);
            if (typeof(msg.SUBSCRIBE[2]) == 'string') {
                var contents = JSON.parse(msg.SUBSCRIBE[2]);
                // if id is ours, skip
                if (window.ourID != contents.id)
                    this.trigger(contents.action, contents);
            }
        }
    }, this);
    this.socket.send();
}

var Publisher = function(id) {
    this.channelID = id;
}

Publisher.prototype.send = function(message) {
    // NOTE: ourID may be different from channelID
    message["id"] = window.ourID;
    $.ajax('http://' + window.location.host + '/PUBLISH/' + this.channelID, {
        headers: {'Authorization': AUTH},
        type: 'PUT',
        data: JSON.stringify(message),
    });
}

var Webdis = function() {
}

Webdis.prototype.get = function(path, callback) {
    $.ajax('http://' + window.location.host + path, {
        headers: {'Authorization': 'Basic dGljdGFjdG9lOmVuZGdhbWU='},
        success: callback,
    });
}

window.webdis = new Webdis();
window.ourID = UUID.generate();

window.globals = { model: null, gview: null, hud: null };

var GameRouter = Backbone.Router.extend({
    routes: {
        "play/:id": "play",
        "host/:id": "host",
        "*path": "home"
    },

    play: function(id) {
        this.reset(id);

        mpq.track('Playing game', { id: id });

        // since we are the one joining, choose a piece
        // and init the game.
        var piece = Math.random() < 0.5 ? 'x' : 'o';
        var model = this.setUpGame({
            piece: piece,
            ourTurn: piece == 'x'
        }).bind('change:gameover', function() {
            // if we are the 'JOINER'
            // we send a message indicating our state (win/lose/draw)
            // why so? since the JOINER starts the game,
            // it also attempts to finish.
            setTimeout(function() {
                publisher.send({
                    "action": "gameover",
                    "senderState": model.get('gameover')
                });
            }, 500);
        }, this);

        window.subscriber.bind('gameover', _.bind(this.processGameOver, this, model));

        publisher.send({"action": "start",
                        "type": piece});
    },

    host: function(id) {
        window.ourID = id;

        mpq.track('Hosted game', { id: id });

        this.reset(id);
        var view = new WaitView({
            el: $('#waitView')
        });
        // wait for other player to init game
        window.subscriber.bind('start', function(start) {
            view.remove();
            var model = this.setUpGame({
                piece: start.type == 'x' ? 'o' : 'x',
                ourTurn: start.type == 'o' // if opponent picked x, not our turn
            }).bind('change:gameover', function() {
                // if we are the HOST, even when our grid tells us
                // we still wait for the joiner to confirm.
                // BUT we reply with a confirmation.
                // So the JOINER makes the first move
                // but both sides confirm the results
            });

            window.subscriber.bind('gameover', _.bind(this.processGameOver, this, model));
        }, this);
    },

    home: function() {
        console.log('home triggered, ourID', ourID);
        new StartView({
            el: $('#startView'),
            playerID: ourID
        });
        mpq.track("Home");
    },

    reset: function(id) {
        window.subscriber = new Subscriber(id);
        _.extend(window.subscriber, Backbone.Events);
        window.publisher = new Publisher(id);
    },

    setUpGame: function(modelAttrs) {
        if (window.globals.model) {
            window.globals.model.destroy();
            delete window.globals.model;
        }

        window.globals.model = new GridModel(modelAttrs);

        if (window.globals.gview) {
            window.globals.gview.paper.remove();
            window.globals.gview.remove();
            delete window.globals.gview;
        }

        window.globals.gview = new GridView({
            model: window.globals.model
        });

        if (window.globals.hud) {
            window.globals.hud.remove();
            delete window.globals.hud;
        }

        window.globals.hud = new HUDView({
            model: window.globals.model
        });
        $('#container').before(window.globals.hud.el);
        return window.globals.model;
    },

    processGameOver: function(model, state /* opponent's */) {
        var mismatch = false;

        if (!model.get('gameover') ||
        (state.senderState == 'draw' && model.get('gameover') != 'draw') ||
        (state.senderState == 'won' && model.get('gameover') != 'lost') ||
        (state.senderState == 'lost' && model.get('gameover') != 'won'))
        mismatch = true;

        if (mismatch) {
            console.log("Something went terribly wrong");
            window.publisher.send({
                "action": "error",
                "message": "gameover mismatch!"
            });
            return;
        }

        if (window.location.pathname.indexOf('/host/') == 0) {
            setTimeout(_.bind(function() {
                window.publisher.send({
                    "action": "gameover",
                    "senderState": model.get('gameover')
                });
            }, this), 0);
            mpq.track('Game Over', { id: window.ourID, outcome: 'Host ' + model.get('gameover') });
        }

        if (model.get('gameover') == 'won' ||
        model.get('gameover') == 'lost' ||
        model.get('gameover') == 'draw') {
            console.log(model.get('gameover'));
            this.trigger('gameover', model.get('gameover'));
        }
        else {
            console.log("Something went wrong, gameover isn't won/lost/draw");
        }
    }
});

window.game = new GameRouter();
Backbone.history.start({pushState: true});

});
