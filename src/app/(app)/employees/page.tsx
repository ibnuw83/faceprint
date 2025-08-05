import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { employees } from '@/lib/mock-data';
import { Users, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function EmployeesPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-primary" />
              Manajemen Karyawan
            </CardTitle>
            <CardDescription>
              Lihat, tambah, atau kelola profil karyawan.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/employees/new">
              <PlusCircle className="mr-2" /> Tambah Karyawan
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tanggal Diterima</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.imageUrl} alt={employee.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{new Date(employee.hireDate).toLocaleDateString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
