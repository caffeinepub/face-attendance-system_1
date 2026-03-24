declare const faceapi: any;

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Loader2,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../App";
import {
  useAddEmployee,
  useGetAllEmployees,
  useSaveFaceDescriptor,
} from "../hooks/useQueries";

const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model";

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Design",
  "Legal",
];

export default function RegisterFace() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(
    null,
  );
  const [capturing, setCapturing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    employeeIdCode: "",
    department: "",
  });

  const addEmployee = useAddEmployee();
  const saveFaceDescriptor = useSaveFaceDescriptor();
  const { data: employees } = useGetAllEmployees();

  // Load models
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
        console.error(e);
        toast.error("Failed to load face recognition models");
      } finally {
        setLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  // Start camera
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
          setCameraReady(true);
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
        for (const t of stream.getTracks()) t.stop();
      }
    };
  }, [modelsLoaded]);

  async function captureAndDetect() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturing(true);
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0);
      setPreviewSrc(canvas.toDataURL("image/jpeg"));

      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        toast.error(
          "No face detected. Please position your face clearly in frame.",
        );
        setPreviewSrc(null);
        return;
      }

      setCapturedDescriptor(Array.from(result.descriptor));
      toast.success("Face captured successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to detect face.");
    } finally {
      setCapturing(false);
    }
  }

  async function handleRegister() {
    if (!form.name.trim() || !form.employeeIdCode.trim() || !form.department) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!capturedDescriptor) {
      toast.error("Please capture your face first.");
      return;
    }

    const duplicate = employees?.find(
      (e) => e.employeeIdCode === form.employeeIdCode,
    );
    if (duplicate) {
      toast.error("Employee ID already exists.");
      return;
    }

    const empId = crypto.randomUUID();
    try {
      await addEmployee.mutateAsync({
        id: empId,
        name: form.name.trim(),
        department: form.department,
        employeeIdCode: form.employeeIdCode.trim(),
      });
      await saveFaceDescriptor.mutateAsync({
        employeeId: empId,
        descriptor: capturedDescriptor,
      });
      toast.success(`${form.name} registered successfully!`);
      setForm({ name: "", employeeIdCode: "", department: "" });
      setCapturedDescriptor(null);
      setPreviewSrc(null);
    } catch (e) {
      console.error(e);
      toast.error("Registration failed. Please try again.");
    }
  }

  const isPending = addEmployee.isPending || saveFaceDescriptor.isPending;

  return (
    <div data-ocid="register-face.page">
      <PageHeader
        title="Register Face"
        breadcrumb={["Home", "Employees", "Register Face"]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera / preview */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Camera Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingModels ? (
              <div
                className="flex flex-col items-center justify-center h-64 gap-3"
                data-ocid="register-face.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading face recognition models...
                </p>
              </div>
            ) : cameraError ? (
              <div
                className="flex flex-col items-center justify-center h-64 gap-3"
                data-ocid="register-face.error_state"
              >
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-sm text-muted-foreground text-center">
                  {cameraError}
                </p>
              </div>
            ) : (
              <div className="relative bg-black rounded-lg overflow-hidden">
                {previewSrc ? (
                  <div className="relative">
                    <img
                      src={previewSrc}
                      alt="Captured face"
                      className="w-full rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-green-500/20 border-2 border-green-400 rounded-lg p-3">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full block"
                    muted
                    playsInline
                    style={{ aspectRatio: "4/3", objectFit: "cover" }}
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            <div className="flex gap-2">
              {previewSrc ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPreviewSrc(null);
                    setCapturedDescriptor(null);
                  }}
                  data-ocid="register-face.secondary_button"
                >
                  Retake Photo
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={captureAndDetect}
                  disabled={!cameraReady || capturing}
                  data-ocid="register-face.primary_button"
                >
                  {capturing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Detecting Face...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Face
                    </>
                  )}
                </Button>
              )}
            </div>

            {capturedDescriptor && (
              <div
                className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg"
                data-ocid="register-face.success_state"
              >
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">
                  Face descriptor captured ({capturedDescriptor.length} values)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration form */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name" className="text-xs font-medium">
                Full Name
              </Label>
              <Input
                id="emp-name"
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                data-ocid="register-face.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-id" className="text-xs font-medium">
                Employee ID
              </Label>
              <Input
                id="emp-id"
                placeholder="e.g. EMP-001"
                value={form.employeeIdCode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    employeeIdCode: e.target.value,
                  }))
                }
                data-ocid="register-face.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, department: v }))
                }
              >
                <SelectTrigger data-ocid="register-face.select">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full mt-2"
              onClick={handleRegister}
              disabled={isPending || !capturedDescriptor}
              data-ocid="register-face.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Employee
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
