const userSocketMap = {}; // optional: track userId -> socket.id

module.exports = (io, socket) => {
  console.log("New video socket connected:", socket.id);

  socket.on("join-room", ({ roomId, userId }) => {
    // (optional) userId -> socketId)
    if (userId) userSocketMap[userId] = socket.id;

    socket.join(roomId);
    console.log(`${userId || socket.id} joined video room ${roomId} (socket: ${socket.id})`);

    // 1) Get all socket ids already in the room (if any)
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    // 2) Tell the newcomer about the existing sockets (so newcomer will create offers)
    //    Exclude the newcomer socket id itself
    const existing = clients.filter((id) => id !== socket.id);
    socket.emit("existing-users", existing);

    // 3) Notify others that a new socket joined (send socket.id)
    socket.to(roomId).emit("user-connected", socket.id);

    // Register handlers for this socket (they are scoped to this socket)
    socket.on("offer", ({ to, sdp }) => {
      // 'to' must be a socket id (not app userId)
      io.to(to).emit("offer", { from: socket.id, sdp });
    });

    socket.on("answer", ({ to, sdp }) => {
      io.to(to).emit("answer", { from: socket.id, sdp });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // When this socket disconnects
    socket.on("disconnect", () => {
      console.log(`${userId || socket.id} disconnected from video room (socket: ${socket.id})`);
      // remove mapping if present
      if (userId && userSocketMap[userId]) delete userSocketMap[userId];
      // notify others in the room
      socket.to(roomId).emit("user-disconnected", socket.id);
    });
  });
};
