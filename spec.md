# Face Attendance System

## Current State
New project. Empty Motoko backend and no frontend components.

## Requested Changes (Diff)

### Add
- Employee registration with webcam face capture
- Face descriptor storage (float array from face-api.js) per employee
- Real-time attendance marking via webcam face recognition
- Attendance dashboard with records table (name, ID, date, time-in, status)
- Admin management panel: add/edit/remove employees, view/export/filter attendance logs
- Role-based access: admin vs regular user view
- Authorization system for admin access

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- Employee type: { id: Text, name: Text, department: Text, faceDescriptor: [Float64] }
- AttendanceRecord type: { id: Text, employeeId: Text, employeeName: Text, timestamp: Int, status: Text }
- CRUD operations for employees
- Add/query attendance records
- Store face descriptors as float arrays
- Query attendance by date range, employee ID, status
- Admin-only mutations via authorization component

### Frontend (React + TypeScript)
- Sidebar navigation: Dashboard, Mark Attendance, Register Face, Manage Employees, Admin Panel
- Dashboard page: attendance stats cards + records table with filters
- Mark Attendance page: live webcam feed, face-api.js recognition loop, auto-mark on match
- Register Face page: webcam capture, name/ID form, submit descriptor to backend
- Manage Employees page: employee list, add/edit/delete modals
- Admin Panel: export CSV attendance logs, advanced filters
- face-api.js loaded via CDN script tag in index.html
- Recognition: load all employee descriptors, compute Euclidean distance, threshold match
