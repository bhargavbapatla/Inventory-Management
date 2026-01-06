import NoData from "../../../components/NoData";
import DataTable from "../../../components/table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";


const Inventory = () => {
  const data = [
    { id: 'SKU-1001', name: 'Wireless Mouse', category: 'Peripherals', inStock: 120, unitPrice: 24.99 },
    { id: 'SKU-1002', name: 'Mechanical Keyboard', category: 'Peripherals', inStock: 85, unitPrice: 79.00 },
    { id: 'SKU-1003', name: 'USB-C Cable', category: 'Cables', inStock: 12, unitPrice: 9.99 },
  ];

  const columns: ColumnDef<(typeof data)[number], unknown>[] = [
    { header: 'SKU', accessorKey: 'id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'In Stock', accessorKey: 'inStock' },
    {
      header: 'Unit Price',
      accessorKey: 'unitPrice',
      cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    },
  ];

  return (
    <div className="p-2">
      <h1 className="text-2xl font-semibold mb-4">Inventory</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default Inventory;
