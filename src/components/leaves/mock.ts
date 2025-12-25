import { LeaveRequest } from "./types";

// Mock data generator - 8-12 kayıt üretir
export const generateMockLeaves = (): LeaveRequest[] => {
  const today = new Date();
  const mockEmployees = [
    { id: "1", full_name: "Ahmet Yılmaz", first_name: "Ahmet", last_name: "Yılmaz", department: "Satış" },
    { id: "2", full_name: "Ayşe Demir", first_name: "Ayşe", last_name: "Demir", department: "Pazarlama" },
    { id: "3", full_name: "Mehmet Kaya", first_name: "Mehmet", last_name: "Kaya", department: "İnsan Kaynakları" },
    { id: "4", full_name: "Fatma Şahin", first_name: "Fatma", last_name: "Şahin", department: "Muhasebe" },
    { id: "5", full_name: "Ali Çelik", first_name: "Ali", last_name: "Çelik", department: "Üretim" },
    { id: "6", full_name: "Zeynep Arslan", first_name: "Zeynep", last_name: "Arslan", department: "Satış" },
    { id: "7", full_name: "Can Özdemir", first_name: "Can", last_name: "Özdemir", department: "IT" },
    { id: "8", full_name: "Elif Aydın", first_name: "Elif", last_name: "Aydın", department: "Pazarlama" },
    { id: "9", full_name: "Burak Yıldız", first_name: "Burak", last_name: "Yıldız", department: "Satış" },
    { id: "10", full_name: "Selin Korkmaz", first_name: "Selin", last_name: "Korkmaz", department: "Muhasebe" },
    { id: "11", full_name: "Emre Öztürk", first_name: "Emre", last_name: "Öztürk", department: "IT" },
    { id: "12", full_name: "Deniz Yücel", first_name: "Deniz", last_name: "Yücel", department: "Pazarlama" },
  ];

  const mockApprovers = [
    { id: "approver-1", full_name: "Ayşe Yılmaz", first_name: "Ayşe", last_name: "Yılmaz" },
    { id: "approver-2", full_name: "Mehmet Demir", first_name: "Mehmet", last_name: "Demir" },
    { id: "approver-3", full_name: "Fatma Kaya", first_name: "Fatma", last_name: "Kaya" },
  ];

  const statuses: Array<"pending" | "approved" | "rejected" | "cancelled"> = [
    "pending",
    "approved",
    "rejected",
    "cancelled",
  ];
  const leaveTypes = ["annual", "sick", "unpaid", "maternity", "paternity", "compassionate", "other"];

  // 8-12 kayıt üret
  const count = 10;
  return Array.from({ length: count }, (_, i) => {
    const employee = mockEmployees[i % mockEmployees.length];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + i - 5); // -5 ile +5 arası tarihler
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 gün süre
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const approver = status !== "pending" && Math.random() > 0.3 
      ? mockApprovers[Math.floor(Math.random() * mockApprovers.length)]
      : null;

    return {
      id: `mock-leave-${i + 1}`,
      tenant_id: "mock-tenant-id",
      employee_id: employee.id,
      leave_type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      days,
      status,
      approver_id: approver?.id || null,
      reason: Math.random() > 0.4 ? `Mock izin talebi nedeni - ${i + 1}` : null,
      created_at: new Date(today.getTime() - i * 86400000).toISOString(),
      employee: employee,
      approver: approver,
    } as LeaveRequest;
  });
};

