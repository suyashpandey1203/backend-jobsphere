const Attempt = require("../models/Attempt");

module.exports = (io) => {
  const collab = io.of("/collab");

  collab.on("connection", (socket) => {
    console.log("✅ Collab socket connected:", socket.id);

    // Join room and send initial state
    socket.on("join-room", async ({ assessmentId, candidateId, questionId }) => {
      try {
        if (!assessmentId || !candidateId || !questionId) {
          console.warn(`⚠️ Missing room data from ${socket.id}`);
          return;
        }
        const roomKey = `${assessmentId}_${candidateId}_${questionId}`;
        socket.join(roomKey);
        console.log(`🚪 ${socket.id} joined room ${roomKey}`);
        
        // Store room info in socket for later use
        socket.data = { assessmentId, candidateId, questionId, roomKey };

        let attempt = await Attempt.findOne({
          assessment: assessmentId,
          candidate: candidateId,
          question_id: questionId,
        });

        if (!attempt) {
          attempt = await Attempt.create({
            assessment: assessmentId,
            candidate: candidateId,
            question_id: questionId,
            final_code: "",
            final_whiteboard_data: [],
          });
          console.log("📝 Created new attempt");
        }

        // Send initial state once
        const initialData = {
          code: attempt.final_code || "",
          whiteboard: attempt.final_whiteboard_data || [],
        };
        
        console.log(`📤 Sending initial state: code=${initialData.code?.length || 0}, elements=${initialData.whiteboard?.length || 0}`);
        socket.emit("load-initial-state", initialData);
      } catch (err) {
        console.error("❌ Error in join-room:", err);
      }
    });

    // Handle code changes
    socket.on("code-change", async (data) => {
      try {
        const { assessmentId, candidateId, questionId, roomKey } = socket.data || {};
        if (!roomKey) {
          console.warn("⚠️ No room data available for code-change");
          return;
        }
        
        console.log(`📝 Code change in room ${roomKey}, broadcasting...`);
        socket.to(roomKey).emit("code-update", { code: data.code });
        
        await Attempt.updateOne(
          {
            assessment: assessmentId,
            candidate: candidateId,
            question_id: questionId,
          },
          {
            $set: { final_code: data.code },
            $push: { code_events: { timestamp: new Date(), event_data: { length: data.code?.length } } },
          }
        );
      } catch (err) {
        console.error("❌ Error handling code-change:", err);
      }
    });

    // Handle whiteboard changes
    socket.on("whiteboard-change", async (data) => {
      try {
        const { assessmentId, candidateId, questionId, roomKey } = socket.data || {};
        if (!roomKey) {
          console.warn("⚠️ No room data available for whiteboard-change");
          return;
        }

        const elements = data.whiteboard || [];
        console.log(`🎨 Whiteboard change in room ${roomKey}, ${elements.length} elements, broadcasting...`);
        
        // Use a deep copy to avoid any reference issues
        const plainElements = JSON.parse(JSON.stringify(elements));
        socket.to(roomKey).emit("whiteboard-update", { whiteboard: plainElements });

        await Attempt.updateOne(
          {
            assessment: assessmentId,
            candidate: candidateId,
            question_id: questionId,
          },
          {
            $set: { final_whiteboard_data: plainElements },
            $push: { whiteboard_events: { timestamp: new Date(), event_count: elements.length } },
          }
        );
      } catch (err) {
        console.error("❌ Error handling whiteboard-change:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`👋 ${socket.id} disconnected`);
    });
  });
};