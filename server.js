//	Customization

var appPort = 1234;

// Librairies

var express = require('express'), 
	app = express();
var http = require('http'), 
	server = http.createServer(app), 
	io = require('socket.io').listen(server);

var pseudoArray = [];

// Views Options
cons = require('consolidate');

app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', __dirname+ "/views");
app.set("view options", { layout: false });

app.use(express.static(__dirname + '/public'));

// Render and send the main page

app.get('/', function(req, res){
  res.render('home.html');
});
server.listen(appPort);
console.log("Server listening on port " + appPort);

// Handle the socket.io connections

var users = 0; //count the users
var connUsersArray = [];
var i=0

io.sockets.on('connection', function (socket) { // First connection
	users += 1; // Add 1 to the count
	reloadUsers(); // Send the count to all the users
	socket.on('message', function (data) { // Broadcast the message to all
		if(pseudoSet(socket))
		{
			var transmit = {date : new Date().toISOString(), pseudo : socket.nickname, message : data.msg};
			if(data.user == 'All')
				socket.broadcast.emit('message', transmit);
			else{
				for(user in connUsersArray){
					if(data.user == connUsersArray[user].name){
						io.sockets.connected[ connUsersArray[user].id ].emit('message', transmit);
					}
				}
			}
			console.log("User "+ transmit['pseudo'] +" said \""+data+"\"");
		}
	});


	// Got it
	socket.on('setPseudo', function (data) { // Assign a name to the user
		var connUsers = {};
		
		if (pseudoArray.indexOf(data) == -1) // Test if the name is already taken
		{
			pseudoArray.push(data);
			connUsers.id = socket.id;
			connUsers.name = data;
			socket.nickname = data;
			connUsersArray.push(connUsers)
			
			io.sockets.emit('connectedUsers', pseudoArray)
			socket.emit('pseudoStatus', 'ok');
			console.log("User " + data + " connected");
		}
		else
		{
			socket.emit('pseudoStatus', 'error') // Send the error
		}
	});

	// Got it
	socket.on('disconnect', function () { // Disconnection of the client
		users -= 1;
		reloadUsers();
		if (pseudoSet(socket))
		{
			console.log("disconnect...");
			var pseudo;
			pseudo = socket.nickname;
			var index = pseudoArray.indexOf(pseudo);
			pseudo.slice(index - 1, 1);
		}
	});
});

function reloadUsers() { // Send the count of the users to all
	io.sockets.emit('nbUsers', {"nb": users});
}
function pseudoSet(socket) { // Test if the user has a name
	var test;
	if (socket.nickname == null ) test = false;
	else test = true;
	return test;
}