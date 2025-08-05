
export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'Clocked In' | 'Clocked Out';
};

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
