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

var view = new StartView({
    el: $('#startView'),
    playerID: ourID
});

var GameRouter = Backbone.Router.extend({
    routes: {
        "play/:id": "play",
    },

    play: function(id) {
        console.log('playing with', id);
        window.subscriber = new Subscriber(id);
        _.extend(window.subscriber, Backbone.Events);
        window.publisher = new Publisher(id);

        view.remove();

        // establish contact with peer
        // if we are the one 'joining', ie, ID != ourID, choose a piece and
        // init the game.
        if (id != ourID) {
            var piece = Math.random() < 0.5 ? 'x' : 'o';
            view = new GridView({
                model: new GridModel({piece: piece})
            });
            publisher.send({"action": "start",
                            "type": piece});
        }
        else {
            // wait for other player to init game
            window.subscriber.bind('start', function(start) {
                view = new GridView({
                    model: new GridModel({piece: start.type == 'x' ? 'o' : 'x'})
                });
            }, this);
        }
    }
});

window.game = new GameRouter();
Backbone.history.start({pushState: true});

});
