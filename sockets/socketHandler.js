const userSocketMap = {}; // optional: track userId -> socket.id
const roomHostMap = {};   // roomId -> hostSocketId

module.exports = (io, socket) => {
  console.log("New video socket connected:", socket.id);

  socket.on("join-room", ({ roomId, userId }) => {
    // (optional) userId -> socketId)
    if (userId) userSocketMap[userId] = socket.id;

    socket.join(roomId);
    console.log(`${userId || socket.id} joined video room ${roomId} (socket: ${socket.id})`);

    // 1) Get all socket ids already in the room (if any)
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    // Step 2: Decide who is host
    if (!roomHostMap[roomId]) {
      // First user = host
      roomHostMap[roomId] = socket.id;
      console.log(`Assigned ${socket.id} as HOST for room ${roomId}`);
      socket.emit("host-assigned", { isHost: true });
    } else {
      // Not host → guest
      const hostId = roomHostMap[roomId];
      console.log(`Guest ${socket.id} joining room ${roomId} with host ${hostId}`);

      // Let guest know who the host is
      socket.emit("host-info", { hostId });

      // Let host know a guest joined (host will create offer)
      io.to(hostId).emit("user-connected", socket.id);
    }
    
    // // 2) Tell the newcomer about the existing sockets (so newcomer will create offers)
    // //    Exclude the newcomer socket id itself
    // const existing = clients.filter((id) => id !== socket.id);
    // socket.emit("existing-users", existing);

    // // 3) Notify others that a new socket joined (send socket.id)
    // socket.to(roomId).emit("user-connected", socket.id);

    // Step 3: Guests don’t connect to other guests anymore
    // Send only the hostId as “existing user” instead of all peers
    const hostSocketId = roomHostMap[roomId];
    if (socket.id !== hostSocketId) {
      socket.emit("existing-users", [hostSocketId]); // guests see only host
    } else {
      socket.emit("existing-users", []); // host sees none
    }

    // Step 4: Signaling relays (same as mesh)
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

    // Step 5: On disconnect
    socket.on("disconnect", () => {
      console.log(`${userId || socket.id} disconnected from video room (socket: ${socket.id})`);

      // Remove from maps
      if (userId && userSocketMap[userId]) delete userSocketMap[userId];

      // If host leaves → remove room host mapping
      if (roomHostMap[roomId] === socket.id) {
        console.log(`Host ${socket.id} left room ${roomId}. Clearing host.`);
        delete roomHostMap[roomId];
        // Optionally: promote next user as host
        const remaining = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        if (remaining.length > 0) {
          const newHostId = remaining[0];
          roomHostMap[roomId] = newHostId;
          io.to(newHostId).emit("host-assigned", { isHost: true });
          console.log(`New host assigned: ${newHostId}`);
        }
      }

      socket.to(roomId).emit("user-disconnected", socket.id);
    });
  });
};