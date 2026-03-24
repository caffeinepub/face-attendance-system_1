declare const faceapi: any;

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Camera, CheckCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../App";
import type { Employee, FaceDescriptorRecord } from "../backend.d";
import {
  useGetAllEmployees,
  useGetAllFaceDescriptors,
  useGetAttendanceByDate,
  useMarkAttendance,
} from "../hooks/useQueries";

const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model";
const today = new Date().toISOString().split("T")[0];
const COOLDOWN_MS = 5 * 60 * 1000;

function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "present")
    return (
      <span className="chip-success text-xs font-semibold px-2.5 py-1 rounded-full">
        {status}
      </span>
    );
  return (
    <span className="chip-absent text-xs font-semibold px-2.5 py-1 rounded-full">
      {status}
    </span>
  );
}

export default function MarkAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastMarkedRef = useRef<Map<string, number>>(new Map());

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedFace, setDetectedFace] = useState<{
    name: string;
    empCode: string;
    distance: number;
  } | null>(null);
  const [isLive, setIsLive] = useState(false);

  const { data: descriptors } = useGetAllFaceDescriptors();
  const { data: employees } = useGetAllEmployees();
  const { data: todayLogs } = useGetAttendanceByDate(today);
  const markAttendance = useMarkAttendance();

  // Load face-api.js models
  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.error("Failed to load face-api models", e);
        toast.error("Failed to load face recognition models");
      } finally {
        setLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  // Start webcam
  useEffect(() => {
    if (!modelsLoaded) return;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsLive(true);
        }
      } catch {
        setCameraError(
          "Camera access denied. Please allow camera permissions.",
        );
      }
    }
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        for (const t of stream.getTracks()) {
          t.stop();
        }
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [modelsLoaded]);

  // Build FaceMatcher from descriptors
  const buildMatcher = useCallback(() => {
    if (!descriptors || !employees || descriptors.length === 0) return null;
    const empMap = new Map<string, Employee>(employees.map((e) => [e.id, e]));
    const labeled = descriptors
      .map((fd: FaceDescriptorRecord) => {
        const emp = empMap.get(fd.employeeId);
        if (!emp) return null;
        return new faceapi.LabeledFaceDescriptors(fd.employeeId, [
          new Float32Array(fd.descriptor),
        ]);
      })
      .filter(Boolean);
    if (labeled.length === 0) return null;
    return new faceapi.FaceMatcher(labeled, 0.5);
  }, [descriptors, employees]);

  // Detection loop
  useEffect(() => {
    if (!modelsLoaded || !isLive) return;

    const empMap = employees
      ? new Map<string, Employee>(employees.map((e) => [e.id, e]))
      : new Map();

    async function detect() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const matcher = buildMatcher();
      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result) {
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resized = faceapi.resizeResults(result, dims);

        // Draw bounding box
        if (ctx) {
          const box = resized.detection.box;
          ctx.strokeStyle = "#60A5FA";
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }

        if (matcher) {
          const match = matcher.findBestMatch(result.descriptor);
          if (match.label !== "unknown" && match.distance < 0.5) {
            const emp = empMap.get(match.label);
            if (emp) {
              setDetectedFace({
                name: emp.name,
                empCode: emp.employeeIdCode,
                distance: match.distance,
              });

              // Cooldown check
              const lastMarked = lastMarkedRef.current.get(emp.id) ?? 0;
              if (Date.now() - lastMarked > COOLDOWN_MS) {
                lastMarkedRef.current.set(emp.id, Date.now());
                markAttendance.mutate(
                  { employeeId: emp.id, timestamp: BigInt(Date.now()) },
                  {
                    onSuccess: () =>
                      toast.success(`Attendance marked for ${emp.name}`),
                    onError: () =>
                      toast.error(`Failed to mark attendance for ${emp.name}`),
                  },
                );
              }
            } else {
              setDetectedFace(null);
            }
          } else {
            setDetectedFace(null);
          }
        } else {
          setDetectedFace({ name: "Unknown", empCode: "--", distance: 1 });
        }
      } else {
        setDetectedFace(null);
      }

      rafRef.current = requestAnimationFrame(detect);
    }

    rafRef.current = requestAnimationFrame(detect);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [modelsLoaded, isLive, buildMatcher, employees, markAttendance]);

  return (
    <div data-ocid="mark-attendance.page">
      <PageHeader
        title="Mark Attendance | Face Recognition"
        breadcrumb={["Home", "Attendance", "Face Recognition"]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera card */}
        <Card
          className="shadow-card border-0"
          data-ocid="mark-attendance.panel"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Live Attendance Session
              </CardTitle>
              {isLive && (
                <Badge className="live-badge bg-red-500 text-white text-xs gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  LIVE
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingModels ? (
              <div
                className="flex flex-col items-center justify-center h-72 gap-3"
                data-ocid="mark-attendance.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading face recognition models...
                </p>
              </div>
            ) : cameraError ? (
              <div
                className="flex flex-col items-center justify-center h-72 gap-3"
                data-ocid="mark-attendance.error_state"
              >
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  {cameraError}
                </p>
              </div>
            ) : (
              <div className="relative bg-black rounded-b-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full block"
                  muted
                  playsInline
                  style={{ aspectRatio: "4/3", objectFit: "cover" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ pointerEvents: "none" }}
                />
                {detectedFace && (
                  <div className="absolute bottom-0 left-0 right-0 face-detected-overlay px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 text-xs font-bold tracking-widest">
                            FACE DETECTED
                          </span>
                        </div>
                        <p className="text-white font-semibold text-sm">
                          {detectedFace.name}
                        </p>
                        <p className="text-white/70 text-xs">
                          {detectedFace.empCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-xs">Match</p>
                        <p className="text-green-400 text-sm font-bold">
                          {Math.round((1 - detectedFace.distance) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's log */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Today's Attendance Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!todayLogs || todayLogs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12"
                data-ocid="mark-attendance.empty_state"
              >
                <Camera className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No attendance marked yet today
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <Table data-ocid="mark-attendance.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Employee</TableHead>
                      <TableHead className="text-xs">Dept</TableHead>
                      <TableHead className="text-xs">Time In</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayLogs.map((r, i) => (
                      <TableRow
                        key={r.id}
                        data-ocid={`mark-attendance.item.${i + 1}`}
                      >
                        <TableCell className="text-xs font-medium">
                          {r.employeeName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.department}
                        </TableCell>
                        <TableCell className="text-xs">{r.timeIn}</TableCell>
                        <TableCell>
                          <StatusChip status={r.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
