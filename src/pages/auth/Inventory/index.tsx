import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type ColumnDef } from "@tanstack/react-table";
import * as Yup from "yup";
import { Field, FormikProvider, useFormik } from "formik";
import Button from "../../../components/Button";
import DataTable from "../../../components/table/DataTable";
import TextField from "../../../components/TextField";
import { addItem, deleteItem, updateItem, type InventoryItem } from "../../../store/slices/inventorySlice";
import type { RootState, AppDispatch } from "../../../store";
import { toast } from "react-hot-toast";


const Inventory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.inventory.items);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const transitionMs = 200;

  const handleOpen = () => {
    setMounted(true);
    requestAnimationFrame(() => setOpen(true));
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setMounted(false);
      setEditingItem(null);
    }, transitionMs);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingItem?.name ?? "",
      weight: editingItem ? String(editingItem.weight) : "",
      unit: editingItem?.unit ?? "grams",
      quantity: editingItem ? String(editingItem.quantity) : "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Item name is required"),
      weight: Yup.number().typeError("Enter a number").positive("Must be positive").required("Weight is required"),
      unit: Yup.mixed<InventoryItem["unit"]>().oneOf(["grams", "kgs", "pounds"]).required("Unit is required"),
      quantity: Yup.number().typeError("Enter a number").integer("Must be an integer").min(1, "At least 1").required("Quantity is required"),
    }),
    onSubmit: (values, helpers) => {
      if (editingItem) {
        dispatch(
          updateItem({
            id: editingItem.id,
            name: values.name,
            weight: Number(values.weight),
            unit: values.unit as InventoryItem["unit"],
            quantity: Number(values.quantity),
          })
        );
        toast.success("Item updated");
      } else {
        dispatch(
          addItem({
            name: values.name,
            weight: Number(values.weight),
            unit: values.unit as InventoryItem["unit"],
            quantity: Number(values.quantity),
          })
        );
        toast.success("Item added");
      }
      helpers.resetForm();
      handleClose();
    },
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    handleOpen();
  };

  const handleDelete = (id: string) => {
    dispatch(deleteItem(id));
    toast.success("Item deleted");
  };

  const columns: ColumnDef<InventoryItem, unknown>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Weight", accessorKey: "weight" },
    { header: "Unit", accessorKey: "unit" },
    { header: "Quantity", accessorKey: "quantity" },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              title="Edit"
              onClick={() => handleEdit(item)}
              className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.25 19.04 4 20l.96-4.25 11.902-11.263Z"
                />
              </svg>
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => handleDelete(item.id)}
              className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 7h12M10 11v6m4-6v6M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1Zm-1 4h8l-.6 11.2A1 1 0 0 1 14.4 20H9.6a1 1 0 0 1-.998-.8L8 8Z"
                />
              </svg>
            </button>
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <div className="p-2">
      <div className="w-full flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <Button
          fullWidth={false}
          className="px-3 py-1 text-sm"
          onClick={() => {
            setEditingItem(null);
            handleOpen();
          }}
        >
          Add New Item
        </Button>
      </div>
      <DataTable columns={columns} data={items} />

      {mounted && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-out`}>
          <div className={`absolute inset-0 bg-black/40 ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onClick={handleClose} />
          <div
            className={`relative w-full max-w-md mx-4 rounded-xl bg-white shadow-lg ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transform transition-all duration-200 ease-out`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                {editingItem ? "Edit Item" : "Add Item"}
              </h2>
            </div>
            <form onSubmit={formik.handleSubmit}>
              <FormikProvider value={formik}>
            <div className="px-5 py-4 space-y-3">
              <Field name="name">
                {({ field, meta }) => (
                  <TextField
                    label="Item Name"
                    name="name"
                    value={field.value as string}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={meta.touched && meta.error ? meta.error : undefined}
                    required
                  />
                )}
              </Field>
              <Field name="weight">
                {({ field, meta }) => (
                  <TextField
                    label="Weight"
                    name="weight"
                    type="number"
                    value={field.value as string}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={meta.touched && meta.error ? meta.error : undefined}
                    required
                  />
                )}
              </Field>
              <Field name="unit">
                {({ field, meta }) => (
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700 text-left">
                      Unit of Measurement<span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <select
                      {...field}
                      className="w-full px-3 py-2 border rounded-md bg-white text-left text-gray-900 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="grams">grams</option>
                      <option value="kgs">kgs</option>
                      <option value="pounds">pounds</option>
                    </select>
                    {meta.touched && meta.error ? (
                      <p className="text-xs text-red-600">{meta.error}</p>
                    ) : null}
                  </div>
                )}
              </Field>
              <Field name="quantity">
                {({ field, meta }) => (
                  <TextField
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={field.value as string}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={meta.touched && meta.error ? meta.error : undefined}
                    required
                  />
                )}
              </Field>
            </div>
            <div className="px-5 py-3 border-t flex items-center justify-end space-x-2">
              <Button type="button" fullWidth={false} className="px-3 py-1 text-sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" fullWidth={false} className="px-3 py-1 text-sm">
                {editingItem ? "Save Changes" : "Add"}
              </Button>
            </div>
              </FormikProvider>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
