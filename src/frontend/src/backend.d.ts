import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FaceDescriptorRecord {
    descriptor: Array<number>;
    employeeId: string;
}
export interface Employee {
    id: string;
    name: string;
    employeeIdCode: string;
    department: string;
}
export interface AttendanceRecord {
    id: string;
    status: string;
    timeIn: string;
    employeeName: string;
    date: string;
    employeeId: string;
    timestamp: bigint;
    department: string;
}
export interface UserProfile {
    name: string;
}
export interface AttendanceStats {
    total: bigint;
    present: bigint;
    absent: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addEmployee(id: string, name: string, department: string, employeeIdCode: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAttendanceLogs(): Promise<void>;
    deleteEmployee(id: string): Promise<void>;
    getAllAttendance(): Promise<Array<AttendanceRecord>>;
    getAllEmployees(): Promise<Array<Employee>>;
    getAllFaceDescriptors(): Promise<Array<FaceDescriptorRecord>>;
    getAttendanceByDate(date: string): Promise<Array<AttendanceRecord>>;
    getAttendanceByEmployee(employeeId: string): Promise<Array<AttendanceRecord>>;
    getAttendanceStats(date: string): Promise<AttendanceStats>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployee(id: string): Promise<Employee>;
    getFaceDescriptor(employeeId: string): Promise<Array<number>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(employeeId: string, timestamp: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveFaceDescriptor(employeeId: string, descriptor: Array<number>): Promise<void>;
    updateEmployee(id: string, name: string, department: string, employeeIdCode: string): Promise<void>;
}
