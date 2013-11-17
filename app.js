//////////////////////////////////////////
///
/// SYNESTHESIA
/// A collaboration between Kinetech and Hack Reactor
///
/// November 2013
/// Weidong Yang
/// David Ryan Hall
/// George Bonner
/// Kate Jenkins
/// Joey Yang
///
/// Check out http://kine-tech.org/ for more information.
///
//////////////////////////////////////////

// Instantiate server
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
server.listen(8080);
var io = require('socket.io').listen(server);

var db = require('./server/database_server');
var helpers = require('./server/helpers');

// define socket.io spaces
var conductor = io.of('/conductor');
var clients = io.of('/client');
var fireworks = io.of('/fireworks');
var dancer = io.of('/dancer');
var audio = io.of('/audio');

// instantiate state object (keeps track of performance state)
var state = {
  connections: 0,
  strobe: false,
  audio: false,
  audioLights: false,
  motionTrack: false,
  currentColor: '#000000',
  resetMC: function() {
    this.strobe = false;
    this.audio = false;
    this.audioLights = false;
    this.motionTrack = false;
  }
};

// server settings
app.set('views', __dirname + '/views');
app.set("view engine", "jade");
app.use(require('stylus').middleware({ src: __dirname + '/public'}));
app.use(express.static(__dirname + '/public'));
io.set('log level', 1);                           // reduce server-side logging
io.set('browser client gzip', true);              // gzip the static files

//////////////////////////////////////////
/// ROUTES
//////////////////////////////////////////

app.get('/', function (req, res) {
  res.render('client');
});

app.get('/conductor', function (req, res) {
  res.render('conductor');
});

app.get('/fireworks', function (req, res) {
  res.render('fireworks');
});

app.get('/audio', function (req, res) {
  res.render('audio');
});

app.get('/dancer', function (req, res) {
  res.render('dancer');
});

app.get('/update', function (req, res) {
  res.render('update');
});

// SERVE DATABASE FILES
app.get('/cast', function (req, res) {
  db.getCast(res);
});

app.get('/upcomingShows', function (req, res) {
  db.getUpcomingShows(res);
});

// POST DATABASE FILES
app.post('/cast', function (req, res) {
  processPost(req, function(data){
    db.postNewCast(data, res);
  });
});

app.post('/upcomingShows', function (req, res) {
  processPost(req, function(data){
    db.postNewEvent(data, res);
  });
});

// UPDATE DATABASE FILES
app.put('/cast/:id', function (req, res) {
  processPost(req, function(data){
    db.updateCastMember(req.params.id, data, res);
  });
});

app.put('/upcomingShows/:id', function (req, res) {
  processPost(req, function(data){
    db.updateEvent(req.params.id, data, res);
  });
});

// DELETE DATABASE FILES
app.delete('/cast/:id', function (req, res) {
  db.deleteCastMember(req.params.id, res);
});

app.delete('/upcomingShows/:id', function (req, res) {
  db.deleteEvent(req.params.id, res);
});

//////////////////////////////////////////
/// EVENTS
//////////////////////////////////////////

//////////////////////////////////////////
/// Visualizer events
//////////////////////////////////////////

fireworks.on('connection', function (firework) {
  firework.emit("welcome", "Visualizer connected.");
});

//////////////////////////////////////////
/// Dancer / Motion Tracker events
//////////////////////////////////////////

dancer.on('connection', function (dancer) {
  dancer.emit('welcome', {
    message: "Connected for motion tracking.",
    tracking: state.motionTrack
  });
  dancer.on('motionData', function (data) {
    fireworks.emit('motionData', data);
  });
});

//////////////////////////////////////////
/// Conductor events
//////////////////////////////////////////

conductor.on('connection', function (conductor) {
  // reset on connection
  state.resetMC();
  clients.emit('reset');
  dancer.emit('reset');
  audio.emit('reset');

  conductor.emit("welcome");

  conductor.on('changeColor',function (data){
    var clients = io.of('/client');
    state.currentColor = data.color;
    clients.emit('changeColor', data);
  });

  conductor.on('randomColor', function (data){
    var clients = io.of('/client');
    state.currentColor = '#000000';    // Set current to black in the case of random
   clients.emit('randomColor', data);
  });

  conductor.on('toggleSound', function (data){
    state.audio = data.sound;
    audio.emit('toggleSound', data);
  });

  conductor.on('toggleMotion', function (data){
    var dancer = io.of('/dancer');
    if (data.motion) {
      state.motionTrack = true;
    } else if (!data.paint) {
      state.motionTrack = false;
    }
    dancer.emit('toggleMotion', data);
  });

  conductor.on('toggleStrobe', function (data){
    var clients = io.of('/client');
    if (data.strobe) {
      state.strobe = true;
    } else {
      state.strobe = false;
    }
    clients.emit('toggleStrobe');
  });

  conductor.on('audioLightControl', function (data){
    var clients = io.of('/client'); // not necessary
    if (data.audio) {
      state.audioLights = true;
    } else {
      state.audioLights = false;
    }
  });

  conductor.on('newFadeTime', function (data){
    var clients = io.of('/client');
    clients.emit('newFadeTime', data);
  });
});

//////////////////////////////////////////
/// Client events
//////////////////////////////////////////

clients.on('connection', function (client) {
  // var clients = io.of('/client');
  state.connections += 1;

  client.emit("welcome", {
    id: client.id,
    message: "welcome!",
    mode: {
      color: state.currentColor,
      strobe: state.strobe,
      audioLights: state.audioLights
    }
  });

  client.on('disconnect', function (){
    state.connections -= 1;
  });

  // client.on('reconnect', function (){
    // canvas.emit('refresh', data);
    // client.emit("welcome", {
    //   id: client.id,
    //   mode: state.mode
    // });
  // });
});

//////////////////////////////////////////
/// Audio events
//////////////////////////////////////////

audio.on('connection', function (audio) {
  audio.emit('welcome', {audio: state.audio});
  audio.on('audio', function (data){
    console.log(data);  // Leave in for test logging until Monday
    var clients = io.of('/client');
    if (state.audioLights) {
      clients.emit('audio', data);
    }
    fireworks.emit('audio', data);
  });
});
