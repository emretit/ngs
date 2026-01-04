import { useMemo } from "react";
import { EmployeeNode, DepartmentNode } from "./useOrgChartData";

export const useOrgChartHierarchy = (
  departments: DepartmentNode[],
  employees: EmployeeNode[],
  selectedDepartment: string,
  searchQuery: string
) => {
  // Build complete organization hierarchy
  const orgStructure = useMemo(() => {
    // Filter departments if selected
    let filteredDepartments = departments;
    if (selectedDepartment !== "all") {
      filteredDepartments = departments.filter(dept => dept.id === selectedDepartment);
    }

    // Also filter by search query for departments
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDepartments = filteredDepartments.filter(dept => 
        dept.name.toLowerCase().includes(query) ||
        dept.description?.toLowerCase().includes(query)
      );
    }

    if (!filteredDepartments.length && !employees.length) return [];

    // Group employees by department name
    const employeesByDept = new Map<string, EmployeeNode[]>();
    const employeesWithoutDept: EmployeeNode[] = [];
    const deptNameMap = new Map<string, string>();

    filteredDepartments.forEach((dept) => {
      deptNameMap.set(dept.name.toLowerCase(), dept.id);
    });

    employees.forEach((emp) => {
      if (emp.department) {
        const deptId = deptNameMap.get(emp.department.toLowerCase());
        if (deptId) {
          if (!employeesByDept.has(deptId)) {
            employeesByDept.set(deptId, []);
          }
          employeesByDept.get(deptId)!.push(emp);
        } else {
          employeesWithoutDept.push(emp);
        }
      } else {
        employeesWithoutDept.push(emp);
      }
    });

    // Build employee hierarchy within each department
    const buildEmployeeTree = (emps: EmployeeNode[]): EmployeeNode[] => {
      const employeeMap = new Map<string, EmployeeNode>();
      const roots: EmployeeNode[] = [];

      // First pass: create all nodes
      emps.forEach((emp) => {
        employeeMap.set(emp.id, { ...emp, children: [] });
      });

      // Second pass: build tree
      emps.forEach((emp) => {
        const node = employeeMap.get(emp.id)!;
        if (emp.manager_id && employeeMap.has(emp.manager_id)) {
          const manager = employeeMap.get(emp.manager_id)!;
          if (!manager.children) manager.children = [];
          manager.children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    };

    // Build department hierarchy tree
    const buildDepartmentTree = (depts: DepartmentNode[]): DepartmentNode[] => {
      const deptMap = new Map<string, DepartmentNode>();
      const roots: DepartmentNode[] = [];

      // First pass: create all nodes
      depts.forEach((dept) => {
        const deptEmployees = employeesByDept.get(dept.id) || [];
        const head = dept.head_id ? deptEmployees.find((e) => e.id === dept.head_id) : null;
        deptMap.set(dept.id, {
          ...dept,
          head: head || null,
          employees: buildEmployeeTree(deptEmployees),
          children: [],
        });
      });

      // Second pass: build tree
      depts.forEach((dept) => {
        const node = deptMap.get(dept.id)!;
        if (dept.parent_id && deptMap.has(dept.parent_id)) {
          const parent = deptMap.get(dept.parent_id)!;
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    };

    // Build department structure with hierarchy
    const deptStructure: (DepartmentNode | { type: 'no-dept'; employees: EmployeeNode[] })[] = [];
    const departmentTree = buildDepartmentTree(filteredDepartments);
    
    // Add root departments to structure
    departmentTree.forEach((rootDept) => {
      deptStructure.push(rootDept);
    });

    // Add employees without department
    if (employeesWithoutDept.length > 0) {
      deptStructure.push({
        type: 'no-dept',
        employees: buildEmployeeTree(employeesWithoutDept),
      });
    }

    return deptStructure;
  }, [departments, employees, selectedDepartment, searchQuery]);

  // Build complete hierarchy tree (all employees regardless of department)
  const completeHierarchy = useMemo(() => {
    const employeeMap = new Map<string, EmployeeNode>();
    const roots: EmployeeNode[] = [];

    // 1. Tüm çalışanları map'e ekle
    employees.forEach((emp) => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    // 2. Hiyerarşi ağacını oluştur (manager_id ilişkilerine göre)
    employees.forEach((emp) => {
      const node = employeeMap.get(emp.id)!;
      if (emp.manager_id && employeeMap.has(emp.manager_id)) {
        // Yöneticisi var ve aynı şirkette - bu node alt seviyede
        const manager = employeeMap.get(emp.manager_id)!;
        if (!manager.children) manager.children = [];
        manager.children.push(node);
      } else {
        // Yöneticisi yok veya aynı şirkette değil - bu root node (en üst seviye = 0)
        roots.push(node);
      }
    });

    // 3. Ağaç yapısı tamamlandı, seviyeler otomatik olarak derinliğe göre belirlenecek
    return roots;
  }, [employees]);

  return {
    orgStructure,
    completeHierarchy
  };
};

