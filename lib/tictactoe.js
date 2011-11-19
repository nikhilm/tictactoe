$(function() {

var Subscriber = function(id) {
    this.channelID = id;
    this.socket = new XMLHttpRequest();
    this.socket.open('GET', 'http://' + window.location.host + '/SUBSCRIBE/' + this.channelID, true);
    this.socket.setRequestHeader('Authorization', 'Basic dGljdGFjdG9lOmVuZGdhbWU=');
    this.pos = 0;
    this.socket.onreadystatechange = _.bind(function() {
        if (this.socket.responseText) {
            var data = this.socket.responseText.substr(this.pos);
            this.pos = this.socket.responseText.length;

            var msg = JSON.parse(data);
            console.log(msg);
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
        headers: {'Authorization': 'Basic dGljdGFjdG9lOmVuZGdhbWU='},
        type: 'PUT',
        data: JSON.stringify(message),
        username: 'tictactoe',
        password: 'endgame',
    });
}

window.ourID = UUID.generate();

var GameRouter = Backbone.Router.extend({
    routes: {
        "play/:id": "play",
        "host/:id": "host",
        "*path": "home"
    },

    play: function(id) {
        console.log('we are', window.ourID, 'playing with', id);

        this.reset(id);
        // since we are the one joining, choose a piece
        // and init the game.
        var piece = Math.random() < 0.5 ? 'x' : 'o';
        new GridView({
            model: new GridModel({piece: piece})
        });
        publisher.send({"action": "start",
                        "type": piece});
    },

    host: function(id) {
        window.ourID = id;
        console.log('host triggered, ourID', ourID);
        this.reset(id);
        // wait for other player to init game
        window.subscriber.bind('start', function(start) {
            view = new GridView({
                model: new GridModel({piece: start.type == 'x' ? 'o' : 'x'})
            });
        }, this);
    },

    home: function() {
        console.log('home triggered, ourID', ourID);
        new StartView({
            el: $('#startView'),
            playerID: ourID
        });
    },

    reset: function(id) {
        window.subscriber = new Subscriber(id);
        _.extend(window.subscriber, Backbone.Events);
        window.publisher = new Publisher(id);
    }
});

window.game = new GameRouter();
Backbone.history.start({pushState: true});

});
