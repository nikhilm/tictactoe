$(function() {
var ourID = UUID.generate();

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
        view.remove();
        view = new GridView({
            model: new GridModel()
        });
    }
});

window.game = new GameRouter();
Backbone.history.start({pushState: true});

var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://localhost:9002/RPUSH/playerqueue/'+UUID.generate(), true);
xhr.setRequestHeader('Authorization', 'Basic dGljdGFjdG9lOmVuZGdhbWU=');
var pos = 0;
xhr.onreadystatechange = function() {
    if (xhr.responseText) {
        var data = xhr.responseText.substr(pos);
        pos = xhr.responseText.length;

        var msg = JSON.parse(data);
        if (typeof(msg.SUBSCRIBE[2]) == 'string')
            console.log(JSON.parse(msg.SUBSCRIBE[2]));
    }
}
//TODO: enable
//xhr.send();
});
