import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type Employee = {
    id : Text;
    name : Text;
    department : Text;
    employeeIdCode : Text;
  };

  module Employee {
    public func compare(e1 : Employee, e2 : Employee) : Order.Order {
      Text.compare(e1.id, e2.id);
    };
  };

  let employees = Map.empty<Text, Employee>();

  type AttendanceRecord = {
    id : Text;
    employeeId : Text;
    employeeName : Text;
    department : Text;
    date : Text;
    timeIn : Text;
    timestamp : Int;
    status : Text;
  };

  module AttendanceRecord {
    public func compare(a1 : AttendanceRecord, a2 : AttendanceRecord) : Order.Order {
      Text.compare(a1.id, a2.id);
    };
  };

  let attendanceRecords = Map.empty<Text, AttendanceRecord>();
  let faceDescriptors = Map.empty<Text, [Float]>();

  // Persistent authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Employee management - Admin only
  public shared ({ caller }) func addEmployee(
    id : Text,
    name : Text,
    department : Text,
    employeeIdCode : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add employees");
    };
    let employee : Employee = {
      id;
      name;
      department;
      employeeIdCode;
    };
    employees.add(id, employee);
  };

  public shared ({ caller }) func updateEmployee(
    id : Text,
    name : Text,
    department : Text,
    employeeIdCode : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update employees");
    };
    if (not employees.containsKey(id)) { Runtime.trap("Employee not found") };
    let employee : Employee = {
      id;
      name;
      department;
      employeeIdCode;
    };
    employees.add(id, employee);
  };

  public shared ({ caller }) func deleteEmployee(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete employees");
    };
    if (not employees.containsKey(id)) { Runtime.trap("Employee not found") };
    employees.remove(id);
    // Also remove associated face descriptor
    faceDescriptors.remove(id);
  };

  public query ({ caller }) func getEmployee(id : Text) : async Employee {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employees");
    };
    switch (employees.get(id)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?employee) { employee };
    };
  };

  public query ({ caller }) func getAllEmployees() : async [Employee] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employees");
    };
    employees.values().toArray().sort();
  };

  // Face descriptor management - User level access required (sensitive biometric data)
  public shared ({ caller }) func saveFaceDescriptor(employeeId : Text, descriptor : [Float]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save face descriptors");
    };
    switch (employees.get(employeeId)) {
      case (null) { Runtime.trap("Employee not found") };
      case (_) { faceDescriptors.add(employeeId, descriptor) };
    };
  };

  public query ({ caller }) func getFaceDescriptor(employeeId : Text) : async [Float] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access face descriptors");
    };
    switch (faceDescriptors.get(employeeId)) {
      case (null) { Runtime.trap("Face descriptor not found") };
      case (?descriptor) { descriptor };
    };
  };

  type FaceDescriptorRecord = {
    employeeId : Text;
    descriptor : [Float];
  };

  public query ({ caller }) func getAllFaceDescriptors() : async [FaceDescriptorRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access face descriptors");
    };
    let descriptorsList : List.List<FaceDescriptorRecord> = List.empty();

    for ((employeeId, descriptor) in faceDescriptors.entries()) {
      let record : FaceDescriptorRecord = {
        employeeId;
        descriptor;
      };
      descriptorsList.add(record);
    };

    descriptorsList.toArray();
  };

  // Attendance operations
  public shared ({ caller }) func markAttendance(employeeId : Text, timestamp : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark attendance");
    };
    switch (employees.get(employeeId)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?employee) {
        let record : AttendanceRecord = {
          id = employeeId # "_" # timestamp.toText();
          employeeId;
          employeeName = employee.name;
          department = employee.department;
          date = timestamp.toText();
          timeIn = timestamp.toText();
          timestamp;
          status = "Present";
        };
        attendanceRecords.add(record.id, record);
      };
    };
  };

  public query ({ caller }) func getAttendanceByDate(date : Text) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance records");
    };
    attendanceRecords.values().toArray().filter(func(record) { record.date == date }).sort();
  };

  public query ({ caller }) func getAttendanceByEmployee(employeeId : Text) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance records");
    };
    attendanceRecords.values().toArray().filter(func(record) { record.employeeId == employeeId }).sort();
  };

  public query ({ caller }) func getAllAttendance() : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance records");
    };
    attendanceRecords.values().toArray().sort();
  };

  type AttendanceStats = {
    present : Nat;
    absent : Nat;
    total : Nat;
  };

  public query ({ caller }) func getAttendanceStats(date : Text) : async AttendanceStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance statistics");
    };
    let records = attendanceRecords.values().toArray().filter(func(record) { record.date == date });
    let present = records.filter(func(record) { record.status == "Present" }).size();
    let total = employees.size();
    let absent = if (total > present) { total - present } else { 0 };
    
    {
      present;
      absent;
      total;
    };
  };

  // Admin-only: Clear all attendance logs
  public shared ({ caller }) func clearAttendanceLogs() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can clear attendance logs");
    };
    for (key in attendanceRecords.keys()) {
      attendanceRecords.remove(key);
    };
  };
};
