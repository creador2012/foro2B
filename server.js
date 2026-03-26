const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("."));
app.post("/register", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const username = req.body.username?.trim();
  const password = req.body.password?.trim();

  db.run(
    "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
    [email, username, password],
    function (err) {
      if (err) {
        return res.send("Error: usuario o correo ya existe");
      }
      res.send("Usuario registrado");
    }
  );
});

const db = new sqlite3.Database("chat.db");

const usersOnline = {};

// SOCKETS
io.on("connection", (socket) => {

  console.log("Usuario conectado");

  // LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, row) => {
      if (row) {
        res.json({ success: true, username: row.username });
      } else {
        res.json({ success: false });
      }
    }
  );
});
  socket.on("login", (username) => {
    usersOnline[username] = socket.id;
    io.emit("users list", Object.keys(usersOnline));
  });

  // 🌍 FORO
  socket.on("global message", (data) => {
    io.emit("global message", data);
  });

  // 👤 PRIVADO
  socket.on("private message", (data) => {
    const { to, from, text } = data;

    const targetSocket = usersOnline[to];

    if (targetSocket) {
      io.to(targetSocket).emit("private message", { from, text });
    }
  });

  socket.on("disconnect", () => {
    for (let user in usersOnline) {
      if (usersOnline[user] === socket.id) {
        delete usersOnline[user];
      }
    }
    io.emit("users list", Object.keys(usersOnline));
  });

});

// SERVIDOR
server.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});