var fs = require('fs');
var config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));
var express = require('express');
var app = express.createServer();

app.listen(3000);
app.use(express.static(__dirname + '/client'));

if(config.enable_socket_io) {	
	var io = require('socket.io').listen(app);
	io.set('log level', 1);

	var sockets = [];
	var code = fs.readFileSync(config.code, 'utf8');

	fs.watchFile(config.code, {interval: 100}, function (curr, prev) {
		if(+curr.mtime === +prev.mtime) { return; } // ignore file access event
	
		var newCode = fs.readFileSync(config.code, 'utf8');
		if(newCode !== code) {
			code = newCode;
			sockets.forEach(function (socket) {
				socket.emit("code-update", code);				
			});
		}
	});

	io.sockets.on('connection', function (socket) {
		socket.on('disconnect', function () {
			sockets = sockets.slice(sockets.indexOf(socket));
		});

		socket.on("code-update", function (data) {
			fs.writeFileSync(config.code, data, "utf8");
		});

		socket.emit("code-update", code);
	});
}