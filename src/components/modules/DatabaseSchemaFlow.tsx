import React, { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  BackgroundVariant,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Key, Link, Circle } from 'lucide-react';

interface TableColumn {
  name: string;
  data_type: string;
  options: string[];
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  comment?: string;
}

interface TableInfo {
  name: string;
  schema: string;
  columns: TableColumn[];
  primary_keys: string[];
  foreign_key_constraints: Array<{
    name: string;
    source: string;
    target: string;
  }>;
  rows: number;
  rls_enabled: boolean;
  comment?: string;
}

// Supabase'den gelen tablo verilerini simüle edelim (gerçek uygulamada API'den gelecek)
const mockTableData: TableInfo[] = [
  // Core Tables
  {
    name: 'companies',
    schema: 'public',
    rows: 21,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'name', data_type: 'text', options: ['updatable'] },
      { name: 'domain', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'is_active', data_type: 'boolean', options: ['updatable'] },
      { name: 'created_at', data_type: 'timestamptz', options: ['updatable'] },
      { name: 'updated_at', data_type: 'timestamptz', options: ['updatable'] },
    ],
    foreign_key_constraints: []
  },
  {
    name: 'profiles',
    schema: 'public',
    rows: 11,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'first_name', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'last_name', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'company_id', data_type: 'uuid', options: ['updatable'], isForeignKey: true },
      { name: 'employee_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
    ],
    foreign_key_constraints: [
      { name: 'fk_profiles_company_id', source: 'public.profiles.company_id', target: 'public.companies.id' },
      { name: 'profiles_employee_id_fkey', source: 'public.profiles.employee_id', target: 'public.employees.id' }
    ]
  },
  // CRM Tables
  {
    name: 'customers',
    schema: 'public',
    rows: 544,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'name', data_type: 'text', options: ['updatable'] },
      { name: 'email', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'company', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'representative', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'customers_company_id_fkey', source: 'public.customers.company_id', target: 'public.companies.id' },
      { name: 'fk_customers_representative', source: 'public.customers.representative', target: 'public.employees.id' }
    ]
  },
  {
    name: 'employees',
    schema: 'public',
    rows: 17,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'first_name', data_type: 'text', options: ['updatable'] },
      { name: 'last_name', data_type: 'text', options: ['updatable'] },
      { name: 'email', data_type: 'text', options: ['updatable', 'unique'] },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'user_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'employees_company_id_fkey', source: 'public.employees.company_id', target: 'public.companies.id' },
      { name: 'employees_user_id_fkey', source: 'public.employees.user_id', target: 'public.profiles.id' }
    ]
  },
  {
    name: 'opportunities',
    schema: 'public',
    rows: 77,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'title', data_type: 'text', options: ['updatable'] },
      { name: 'description', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'customer_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'employee_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'opportunities_customer_id_fkey', source: 'public.opportunities.customer_id', target: 'public.customers.id' },
      { name: 'opportunities_employee_id_fkey', source: 'public.opportunities.employee_id', target: 'public.employees.id' },
      { name: 'opportunities_company_id_fkey', source: 'public.opportunities.company_id', target: 'public.companies.id' }
    ]
  },
  {
    name: 'proposals',
    schema: 'public',
    rows: 60,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'number', data_type: 'text', options: ['updatable'] },
      { name: 'title', data_type: 'text', options: ['updatable'] },
      { name: 'customer_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'opportunity_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'employee_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'proposals_customer_id_fkey', source: 'public.proposals.customer_id', target: 'public.customers.id' },
      { name: 'proposals_opportunity_id_fkey', source: 'public.proposals.opportunity_id', target: 'public.opportunities.id' },
      { name: 'proposals_employee_id_fkey', source: 'public.proposals.employee_id', target: 'public.employees.id' },
      { name: 'proposals_company_id_fkey', source: 'public.proposals.company_id', target: 'public.companies.id' }
    ]
  },
  // Product & Inventory Tables
  {
    name: 'products',
    schema: 'public',
    rows: 1374,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'name', data_type: 'text', options: ['updatable'] },
      { name: 'description', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'price', data_type: 'numeric', options: ['updatable'] },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'supplier_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'products_company_id_fkey', source: 'public.products.company_id', target: 'public.companies.id' },
      { name: 'products_supplier_id_fkey', source: 'public.products.supplier_id', target: 'public.suppliers.id' }
    ]
  },
  {
    name: 'suppliers',
    schema: 'public',
    rows: 12,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'name', data_type: 'text', options: ['updatable'] },
      { name: 'email', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'representative', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'suppliers_company_id_fkey', source: 'public.suppliers.company_id', target: 'public.companies.id' },
      { name: 'suppliers_representative_uuid_fkey', source: 'public.suppliers.representative', target: 'public.employees.id' }
    ]
  },
  // Order Management
  {
    name: 'orders',
    schema: 'public',
    rows: 3,
    rls_enabled: false,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'order_number', data_type: 'text', options: ['updatable', 'unique'] },
      { name: 'customer_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'employee_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'opportunity_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'proposal_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'orders_customer_id_fkey', source: 'public.orders.customer_id', target: 'public.customers.id' },
      { name: 'orders_employee_id_fkey', source: 'public.orders.employee_id', target: 'public.employees.id' },
      { name: 'orders_opportunity_id_fkey', source: 'public.orders.opportunity_id', target: 'public.opportunities.id' },
      { name: 'orders_proposal_id_fkey', source: 'public.orders.proposal_id', target: 'public.proposals.id' },
      { name: 'orders_company_id_fkey', source: 'public.orders.company_id', target: 'public.companies.id' }
    ]
  },
  {
    name: 'order_items',
    schema: 'public',
    rows: 7,
    rls_enabled: false,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'order_id', data_type: 'uuid', options: ['updatable'], isForeignKey: true },
      { name: 'product_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'quantity', data_type: 'numeric', options: ['updatable'] },
      { name: 'unit_price', data_type: 'numeric', options: ['updatable'] },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
    ],
    foreign_key_constraints: [
      { name: 'order_items_order_id_fkey', source: 'public.order_items.order_id', target: 'public.orders.id' },
      { name: 'order_items_product_id_fkey', source: 'public.order_items.product_id', target: 'public.products.id' },
      { name: 'order_items_company_id_fkey', source: 'public.order_items.company_id', target: 'public.companies.id' }
    ]
  },
  // Invoice Management
  {
    name: 'sales_invoices',
    schema: 'public',
    rows: 34,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'fatura_no', data_type: 'varchar', options: ['nullable', 'updatable'] },
      { name: 'order_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'customer_id', data_type: 'uuid', options: ['updatable'], isForeignKey: true },
      { name: 'employee_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'sales_invoices_order_id_fkey', source: 'public.sales_invoices.order_id', target: 'public.orders.id' },
      { name: 'sales_invoices_customer_id_fkey', source: 'public.sales_invoices.customer_id', target: 'public.customers.id' },
      { name: 'sales_invoices_employee_id_fkey', source: 'public.sales_invoices.employee_id', target: 'public.employees.id' },
      { name: 'sales_invoices_company_id_fkey', source: 'public.sales_invoices.company_id', target: 'public.companies.id' }
    ]
  },
  {
    name: 'sales_invoice_items',
    schema: 'public',
    rows: 44,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'sales_invoice_id', data_type: 'uuid', options: ['updatable'], isForeignKey: true },
      { name: 'product_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'sales_invoice_items_sales_invoice_id_fkey', source: 'public.sales_invoice_items.sales_invoice_id', target: 'public.sales_invoices.id' },
      { name: 'sales_invoice_items_product_id_fkey', source: 'public.sales_invoice_items.product_id', target: 'public.products.id' },
      { name: 'sales_invoice_items_company_id_fkey', source: 'public.sales_invoice_items.company_id', target: 'public.companies.id' }
    ]
  },
  // Purchase Management
  {
    name: 'purchase_orders',
    schema: 'public',
    rows: 0,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'po_number', data_type: 'varchar', options: ['updatable', 'unique'] },
      { name: 'supplier_id', data_type: 'uuid', options: ['updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'purchase_orders_supplier_id_fkey', source: 'public.purchase_orders.supplier_id', target: 'public.suppliers.id' },
      { name: 'purchase_orders_company_id_fkey', source: 'public.purchase_orders.company_id', target: 'public.companies.id' }
    ]
  },
  {
    name: 'purchase_invoices',
    schema: 'public',
    rows: 1,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'invoice_number', data_type: 'varchar', options: ['updatable'] },
      { name: 'po_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'supplier_id', data_type: 'uuid', options: ['updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'purchase_invoices_po_id_fkey', source: 'public.purchase_invoices.po_id', target: 'public.purchase_orders.id' },
      { name: 'purchase_invoices_supplier_id_fkey', source: 'public.purchase_invoices.supplier_id', target: 'public.suppliers.id' },
      { name: 'purchase_invoices_company_id_fkey', source: 'public.purchase_invoices.company_id', target: 'public.companies.id' }
    ]
  },
  // Financial Tables
  {
    name: 'bank_accounts',
    schema: 'public',
    rows: 2,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'account_name', data_type: 'text', options: ['updatable'] },
      { name: 'bank_name', data_type: 'text', options: ['updatable'] },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'bank_accounts_company_id_fkey', source: 'public.bank_accounts.company_id', target: 'public.companies.id' }
    ]
  },
  {
    name: 'payments',
    schema: 'public',
    rows: 5,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'bank_account_id', data_type: 'uuid', options: ['updatable'], isForeignKey: true },
      { name: 'amount', data_type: 'numeric', options: ['updatable'] },
      { name: 'customer_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'supplier_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'payments_bank_account_id_fkey', source: 'public.payments.bank_account_id', target: 'public.bank_accounts.id' },
      { name: 'payments_customer_id_fkey', source: 'public.payments.customer_id', target: 'public.customers.id' },
      { name: 'payments_supplier_id_fkey', source: 'public.payments.supplier_id', target: 'public.suppliers.id' },
      { name: 'payments_company_id_fkey', source: 'public.payments.company_id', target: 'public.companies.id' }
    ]
  },
  // Service Management
  {
    name: 'service_requests',
    schema: 'public',
    rows: 26,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'service_title', data_type: 'text', options: ['updatable'] },
      { name: 'customer_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['nullable', 'updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'service_requests_customer_id_fkey', source: 'public.service_requests.customer_id', target: 'public.customers.id' },
      { name: 'service_requests_company_id_fkey', source: 'public.service_requests.company_id', target: 'public.companies.id' }
    ]
  },
  // Activities & Tasks
  {
    name: 'activities',
    schema: 'public',
    rows: 11,
    rls_enabled: true,
    primary_keys: ['id'],
    columns: [
      { name: 'id', data_type: 'uuid', options: ['updatable'], isPrimaryKey: true },
      { name: 'title', data_type: 'text', options: ['updatable'] },
      { name: 'description', data_type: 'text', options: ['nullable', 'updatable'] },
      { name: 'assignee_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'opportunity_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'company_id', data_type: 'uuid', options: ['nullable', 'updatable'], isForeignKey: true },
      { name: 'created_at', data_type: 'timestamptz', options: ['updatable'] },
    ],
    foreign_key_constraints: [
      { name: 'tasks_assignee_id_fkey', source: 'public.activities.assignee_id', target: 'public.employees.id' },
      { name: 'tasks_opportunity_id_fkey', source: 'public.activities.opportunity_id', target: 'public.opportunities.id' },
      { name: 'activities_company_id_fkey', source: 'public.activities.company_id', target: 'public.companies.id' }
    ]
  }
];

const getTableTypeColor = (tableName: string, groupColor?: string) => {
  if (groupColor) {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-100 border-blue-300',
      'green': 'bg-green-100 border-green-300',
      'purple': 'bg-purple-100 border-purple-300',
      'orange': 'bg-orange-100 border-orange-300',
      'red': 'bg-red-100 border-red-300',
      'yellow': 'bg-yellow-100 border-yellow-300',
      'indigo': 'bg-indigo-100 border-indigo-300',
      'pink': 'bg-pink-100 border-pink-300'
    };
    return colorMap[groupColor] || 'bg-gray-100 border-gray-300';
  }
  
  // Fallback to old logic
  if (tableName.includes('company') || tableName.includes('companies')) return 'bg-blue-100 border-blue-300';
  if (tableName.includes('customer') || tableName.includes('employee')) return 'bg-green-100 border-green-300';
  if (tableName.includes('product') || tableName.includes('order')) return 'bg-purple-100 border-purple-300';
  if (tableName.includes('invoice') || tableName.includes('payment')) return 'bg-orange-100 border-orange-300';
  return 'bg-gray-100 border-gray-300';
};

const getDataTypeColor = (dataType: string) => {
  if (dataType.includes('uuid')) return 'text-blue-600';
  if (dataType.includes('text') || dataType.includes('varchar')) return 'text-green-600';
  if (dataType.includes('numeric') || dataType.includes('int')) return 'text-purple-600';
  if (dataType.includes('timestamp') || dataType.includes('date')) return 'text-orange-600';
  if (dataType.includes('boolean')) return 'text-red-600';
  return 'text-gray-600';
};

// Table Node Component
const TableNode: React.FC<{ data: any }> = ({ data }) => {
  const table = data.table as TableInfo;
  
  return (
    <Card className={`min-w-[280px] max-w-[350px] shadow-lg ${getTableTypeColor(table.name, data.groupColor)}`}>
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{table.name}</h3>
            {data.groupTitle && (
              <div className="text-xs text-muted-foreground font-medium">
                {data.groupTitle}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {table.rows} satır
              </Badge>
              {table.rls_enabled && (
                <Badge variant="secondary" className="text-xs">
                  RLS
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {table.columns.slice(0, 8).map((column, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-white/50"
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {column.isPrimaryKey && <Key className="h-3 w-3 text-yellow-600 flex-shrink-0" />}
                {column.isForeignKey && <Link className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                <span className="font-medium truncate">{column.name}</span>
              </div>
              <span className={`${getDataTypeColor(column.data_type)} font-mono text-xs`}>
                {column.data_type}
              </span>
            </div>
          ))}
          {table.columns.length > 8 && (
            <div className="text-xs text-muted-foreground text-center py-1">
              +{table.columns.length - 8} daha...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  table: TableNode,
};

// Convert table data to React Flow format
const convertToFlowData = (tables: TableInfo[]): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Group tables by hierarchical order - top to bottom
  const coreTables = ['companies', 'profiles'];
  const crmTables = ['customers', 'employees', 'opportunities', 'proposals'];
  const productTables = ['products', 'suppliers'];
  const orderTables = ['orders', 'order_items'];
  const invoiceTables = ['sales_invoices', 'sales_invoice_items'];
  const purchaseTables = ['purchase_orders', 'purchase_invoices'];
  const financialTables = ['bank_accounts', 'payments'];
  const serviceTables = ['service_requests', 'activities'];
  
  const groups = [
    { tables: coreTables, x: 0, y: 0, color: 'blue', title: 'Core System' },
    { tables: crmTables, x: 0, y: 200, color: 'green', title: 'CRM Module' },
    { tables: productTables, x: 0, y: 400, color: 'purple', title: 'Product Module' },
    { tables: orderTables, x: 0, y: 600, color: 'orange', title: 'Order Module' },
    { tables: invoiceTables, x: 0, y: 800, color: 'red', title: 'Invoice Module' },
    { tables: purchaseTables, x: 0, y: 1000, color: 'yellow', title: 'Purchase Module' },
    { tables: financialTables, x: 0, y: 1200, color: 'indigo', title: 'Financial Module' },
    { tables: serviceTables, x: 0, y: 1400, color: 'pink', title: 'Service Module' }
  ];
  
  // Create nodes for each table with hierarchical positioning
  tables.forEach((table) => {
    let x = 0, y = 0, groupColor = 'gray', groupTitle = '';
    
    // Find which group this table belongs to
    for (const group of groups) {
      if (group.tables.includes(table.name)) {
        const index = group.tables.indexOf(table.name);
        // Arrange tables vertically within each group
        x = group.x + (index * 350); // Horizontal spacing between tables in same group
        y = group.y;
        groupColor = group.color;
        groupTitle = group.title;
        break;
      }
    }
    
    // If table not found in groups, use default positioning
    if (x === 0 && y === 0) {
      const index = tables.indexOf(table);
      x = (index % 4) * 350;
      y = Math.floor(index / 4) * 300;
    }
    
    const node: Node = {
      id: table.name,
      type: 'table',
      position: { x, y },
      data: { table, groupColor, groupTitle }
    };
    
    nodes.push(node);
  });
  
  // Create edges for important foreign key relationships only
  const importantRelationships = [
    // Core relationships
    { from: 'profiles', to: 'companies', label: 'company' },
    { from: 'employees', to: 'companies', label: 'company' },
    { from: 'employees', to: 'profiles', label: 'user' },
    
    // CRM relationships
    { from: 'customers', to: 'companies', label: 'company' },
    { from: 'customers', to: 'employees', label: 'representative' },
    { from: 'opportunities', to: 'customers', label: 'customer' },
    { from: 'opportunities', to: 'employees', label: 'employee' },
    { from: 'proposals', to: 'opportunities', label: 'opportunity' },
    { from: 'proposals', to: 'customers', label: 'customer' },
    
    // Product relationships
    { from: 'products', to: 'companies', label: 'company' },
    { from: 'products', to: 'suppliers', label: 'supplier' },
    { from: 'suppliers', to: 'companies', label: 'company' },
    
    // Order relationships
    { from: 'orders', to: 'customers', label: 'customer' },
    { from: 'orders', to: 'opportunities', label: 'opportunity' },
    { from: 'orders', to: 'proposals', label: 'proposal' },
    { from: 'order_items', to: 'orders', label: 'order' },
    { from: 'order_items', to: 'products', label: 'product' },
    
    // Invoice relationships
    { from: 'sales_invoices', to: 'orders', label: 'order' },
    { from: 'sales_invoices', to: 'customers', label: 'customer' },
    { from: 'sales_invoice_items', to: 'sales_invoices', label: 'invoice' },
    
    // Purchase relationships
    { from: 'purchase_orders', to: 'suppliers', label: 'supplier' },
    { from: 'purchase_invoices', to: 'purchase_orders', label: 'po' },
    
    // Financial relationships
    { from: 'bank_accounts', to: 'companies', label: 'company' },
    { from: 'payments', to: 'bank_accounts', label: 'account' },
    
    // Service relationships
    { from: 'service_requests', to: 'customers', label: 'customer' },
    { from: 'activities', to: 'employees', label: 'assignee' },
    { from: 'activities', to: 'opportunities', label: 'opportunity' }
  ];
  
  importantRelationships.forEach(rel => {
    const sourceExists = tables.some(t => t.name === rel.from);
    const targetExists = tables.some(t => t.name === rel.to);
    
    if (sourceExists && targetExists) {
      const edge: Edge = {
        id: `${rel.from}_${rel.to}_${rel.label}`,
        source: rel.from,
        target: rel.to,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'smoothstep',
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#64748b',
        },
        label: rel.label,
        labelStyle: {
          fontSize: 10,
          fill: '#64748b',
        },
      };
      
      edges.push(edge);
    }
  });
  
  return { nodes, edges };
};

export const DatabaseSchemaFlow: React.FC = () => {
  const { nodes: initialNodes, edges: initialEdges } = convertToFlowData(mockTableData);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  
  logger.debug('DatabaseSchemaFlow rendered with nodes:', initialNodes.length, 'edges:', initialEdges.length);
  
  useEffect(() => {
    logger.debug('useEffect running, nodes:', nodes.length, 'edges:', edges.length);
    // Auto fit view after component mounts
    const timer = setTimeout(() => {
      logger.debug('Calling fitView');
      fitView({ padding: 0.2, duration: 1000, includeHiddenNodes: false });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [fitView]);
  
  return (
    <div className="w-full h-full" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className="bg-gradient-to-br from-slate-50 via-white to-slate-50"
        minZoom={0.1}
        maxZoom={1.5}
        style={{ width: '100%', height: '100%', minHeight: '600px' }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="opacity-30"
        />
        <Controls 
          position="top-left"
          className="bg-card border-border shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const tableName = node.id;
            if (tableName.includes('company')) return '#3b82f6';
            if (tableName.includes('customer') || tableName.includes('employee')) return '#10b981';
            if (tableName.includes('product') || tableName.includes('order')) return '#8b5cf6';
            return '#6b7280';
          }}
          className="bg-card border-border rounded-lg shadow-lg"
          position="bottom-right"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};
