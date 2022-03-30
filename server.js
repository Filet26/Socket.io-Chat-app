const express = require("express");
const { isObject } = require("util");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")().listen(server).sockets;
const bodyParser = require("body-parser"); // Middleware
const basicAuth = require("express-basic-auth");
const { redirect } = require("statuses");

app.use(bodyParser.urlencoded({ extended: false }));

let valid = false;

// list of valid clients
let valid_clients = [];

function myAsyncAuthorizer(username, password) {
  for (i in valid_clients) {
    const userMatches = basicAuth.safeCompare(
      username,
      Object.keys(valid_clients[i])[0]
    );
    const passwordMatches = basicAuth.safeCompare(
      password,
      Object.values(valid_clients[i])[0]
    );
    if ((userMatches & passwordMatches) == true) {
      return true;
    }
  }
  return false;
}

// signup page
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/signup.html");
});

app.post("/signup", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  temp_dict = {};
  temp_dict[username] = password;
  valid_clients.push(temp_dict);
  res.redirect("/");
});

// login page, is home
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

//login page
app.get("/home", (req, res) => {
  if (valid) {
    res.sendFile(__dirname + "/index.html");
    valid = false;
  } else {
    res.send("Unauthorized");
  }
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (myAsyncAuthorizer(username, password)) {
    valid = true;
    res.redirect("/home");
  } else {
    res.send(`WRONG username: ${username} Password: ${password} `);
  }
});

// ----------------------------------------------------------
let connectedUser = [];
io.on("connection", (socket) => {
  console.log("one user connected");
  updateUserName();
  let username = "";
  socket.on("login", (name, callback) => {
    if (name.trim().length === 0) {
      retur;
    }
    callback(true);
    username = name;
    connectedUser.push(username);
    console.log(connectedUser);
    updateUserName();
  });

  socket.on("disconnect", () => {
    console.log("one user disconnected");
    connectedUser.splice(connectedUser.indexOf(username), 1);
    console.log(connectedUser);
    updateUserName();
  });
  function updateUserName() {
    io.emit("loadUser", connectedUser);
    // We’ll define “loadUser” event in html later
  }

  //receive chat message
  socket.on("chat message", (msg) => {
    //emit message data
    io.emit("output", {
      name: username,
      msg: msg,
    });
  });
});

const port = process.env.PORT || 5000;

server.listen(port, () => console.log(`Server is running on port ${port}`));
