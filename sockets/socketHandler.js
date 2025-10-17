const userSocketMap = {}; // optional: track userId -> socket.id
const roomHostMap = {};   // roomId -> hostSocketId

module.exports = (io, socket) => {
  console.log("New video socket connected:", socket.id);

  socket.on("join-room", ({ roomId, userId }) => {
    // (optional) userId -> socketId
    if (userId) userSocketMap[userId] = socket.id;

    socket.join(roomId);
    console.log(`${userId || socket.id} joined video room ${roomId} (socket: ${socket.id})`);

    // Step 1: Get all sockets in the room
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const clientCount = clients.length;
    console.log(`Room ${roomId} now has ${clientCount} clients`);

    // Step 2: Host determination logic
    if (!roomHostMap[roomId]) {
      // First user = host
      roomHostMap[roomId] = socket.id;
      console.log(`Assigned ${socket.id} as HOST for room ${roomId}`);
      
      // Tell this user they're the host
      socket.emit("host-assigned", { isHost: true });
      
      // No need to emit existing-users since they're the first one
    } else {
      // Not first user = guest
      const hostId = roomHostMap[roomId];
      console.log(`Guest ${socket.id} joining room ${roomId} with host ${hostId}`);

      // Tell this user who the host is
      socket.emit("host-info", { hostId });
      
      // Let this guest know about the host (ONLY the host) as an existing user
      socket.emit("existing-users", [hostId]);
      
      // Let host know a guest joined
      io.to(hostId).emit("user-connected", socket.id);
    }

    // Step 3: Handle signaling relays
    socket.on("offer", ({ to, sdp }) => {
      console.log(`Relaying offer from ${socket.id} to ${to}`);
      io.to(to).emit("offer", { from: socket.id, sdp });
    });

    socket.on("answer", ({ to, sdp }) => {
      console.log(`Relaying answer from ${socket.id} to ${to}`);
      io.to(to).emit("answer", { from: socket.id, sdp });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // Step 4: Handle disconnections
    socket.on("disconnect", () => {
      console.log(`${userId || socket.id} disconnected from video room (socket: ${socket.id})`);

      // Remove from maps
      if (userId && userSocketMap[userId]) delete userSocketMap[userId];

      // If host leaves → handle host reassignment
      if (roomHostMap[roomId] === socket.id) {
        console.log(`Host ${socket.id} left room ${roomId}. Finding new host.`);
        
        // Get remaining clients
        const remaining = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        
        if (remaining.length > 0) {
          // Assign new host
          const newHostId = remaining[0];
          roomHostMap[roomId] = newHostId;
          
          console.log(`New host assigned for ${roomId}: ${newHostId}`);
          
          // Tell new host they are now the host
          io.to(newHostId).emit("host-assigned", { isHost: true });
          
          // Tell EVERYONE in the room who the new host is
          io.to(roomId).emit("host-info", { hostId: newHostId });
        } else {
          // Room is empty
          delete roomHostMap[roomId];
          console.log(`Room ${roomId} is now empty, removed host mapping`);
        }
      }

      // Notify everyone that this user has left
      socket.to(roomId).emit("user-disconnected", socket.id);
    });
  });
};