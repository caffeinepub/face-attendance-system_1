import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AttendanceRecord,
  AttendanceStats,
  Employee,
  FaceDescriptorRecord,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEmployees();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllAttendance() {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAttendance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAttendanceByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "date", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useGetAttendanceStats(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceStats>({
    queryKey: ["attendance-stats", date],
    queryFn: async () => {
      if (!actor) return { total: 0n, present: 0n, absent: 0n };
      return actor.getAttendanceStats(date);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllFaceDescriptors() {
  const { actor, isFetching } = useActor();
  return useQuery<FaceDescriptorRecord[]>({
    queryKey: ["face-descriptors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFaceDescriptors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name: string;
      department: string;
      employeeIdCode: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addEmployee(
        vars.id,
        vars.name,
        vars.department,
        vars.employeeIdCode,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name: string;
      department: string;
      employeeIdCode: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEmployee(
        vars.id,
        vars.name,
        vars.department,
        vars.employeeIdCode,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteEmployee(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useSaveFaceDescriptor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { employeeId: string; descriptor: number[] }) => {
      if (!actor) throw new Error("No actor");
      return actor.saveFaceDescriptor(vars.employeeId, vars.descriptor);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["face-descriptors"] }),
  });
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { employeeId: string; timestamp: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.markAttendance(vars.employeeId, vars.timestamp);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-stats"] });
    },
  });
}

export function useClearAttendanceLogs() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.clearAttendanceLogs();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}
