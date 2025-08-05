export type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  imageUrl: string;
  hireDate: string;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
};

export const employees: Employee[] = [
  { id: 'E001', name: 'Alice Johnson', email: 'alice.j@example.com', department: 'Teknik', imageUrl: 'https://placehold.co/100x100', hireDate: '2022-08-15' },
  { id: 'E002', name: 'Bob Williams', email: 'bob.w@example.com', department: 'Pemasaran', imageUrl: 'https://placehold.co/100x100', hireDate: '2021-03-20' },
  { id: 'E003', name: 'Charlie Brown', email: 'charlie.b@example.com', department: 'SDM', imageUrl: 'https://placehold.co/100x100', hireDate: '2023-01-10' },
  { id: 'E004', name: 'Diana Miller', email: 'diana.m@example.com', department: 'Teknik', imageUrl: 'https://placehold.co/100x100', hireDate: '2022-11-05' },
  { id: 'E005', name: 'Ethan Davis', email: 'ethan.d@example.com', department: 'Penjualan', imageUrl: 'https://placehold.co/100x100', hireDate: '2023-05-30' },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'A001', employeeId: 'E001', employeeName: 'Alice Johnson', date: '2024-07-22', time: '09:01:15', status: 'Clocked In' },
  { id: 'A002', employeeId: 'E002', employeeName: 'Bob Williams', date: '2024-07-22', time: '08:55:45', status: 'Clocked In' },
  { id: 'A003', employeeId: 'E003', employeeName: 'Charlie Brown', date: '2024-07-22', time: '09:15:30', status: 'Clocked In' },
  { id: 'A004', employeeId: 'E001', employeeName: 'Alice Johnson', date: '2024-07-22', time: '17:35:10', status: 'Clocked Out' },
  { id: 'A005', employeeId: 'E004', employeeName: 'Diana Miller', date: '2024-07-22', time: '08:45:00', status: 'Clocked In' },
  { id: 'A006', employeeId: 'E002', employeeName: 'Bob Williams', date: '2024-07-22', time: '18:05:22', status: 'Clocked Out' },
  { id: 'A007', employeeId: 'E005', employeeName: 'Ethan Davis', date: '2024-07-21', time: '09:00:05', status: 'Clocked In' },
  { id: 'A008', employeeId: 'E001', employeeName: 'Alice Johnson', date: '2024-07-21', time: '09:03:00', status: 'Clocked In' },
];
