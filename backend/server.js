import "dotenv/config";
import http from "http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import brandingRoutes from "./routes/brandingRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

app.set("io", io);
app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "vidyatech-school-ecosystem-api",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/branding", brandingRoutes);
app.use("/api/leads", leadRoutes);

io.on("connection", (socket) => {
  socket.on("join-school", (schoolId) => {
    if (schoolId) {
      socket.join(`school:${schoolId}`);
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error"
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
