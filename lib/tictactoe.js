$(function() {
console.log('lets');
/*var paper = Raphael('container', 500, 500);
var O = paper.circle(180, 180, 35);
O.attr({'stroke': '#000', 'stroke-width': '16'});
var X = paper.path('M45,45l60,60m0,-60,l-60,60');
X.attr({'stroke': '#00f', 'stroke-width': '16', 'stroke-linecap': 'round'});

var cellWidth = 100, cellHeight = 100;
var vert = 'M30,30';
for (var i = 1; i < 3; i++) {
    vert += 'M' + (30+i*cellWidth) + ',30';
    vert += 'l0,' + 3*cellHeight;
}
var horiz = 'M30,30';
for (var j = 1; j < 3; j++) {
    horiz += 'M30,' + (30+j*cellHeight);
    horiz += 'l' + 3*cellWidth + ',0';
}
console.log(horiz);

var grid = paper.path(vert);
grid.attr({'stroke': '#000', 'stroke-width': '5'});
var grid = paper.path(horiz);
grid.attr({'stroke': '#000', 'stroke-width': '5'});*/

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
}
});
