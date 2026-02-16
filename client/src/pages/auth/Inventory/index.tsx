import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type ColumnDef } from "@tanstack/react-table";
import * as Yup from "yup";
import { Field, FormikProvider, useFormik, type FieldProps } from "formik";
import Button from "../../../components/Button";
import DataTable from "../../../components/table/DataTable";
import TextField from "../../../components/TextField";
import { addItem, deleteItem, updateItem, setItems, type InventoryItem } from "../../../store/slices/inventorySlice";
import type { RootState, AppDispatch } from "../../../store";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../features/auth/authContext";
import { deleteInventory, editInventory, getInventory, postInventory, restockInventory } from "../../../api/inventory";
import ConfirmationModal from "../../../components/ConfirmationModal";
import Loader from "../../../components/Loader";

const convertToGrams = (weight: number, unit: string) => {
  const map: Record<string, number> = {
    GRAMS: 1,
    KGS: 1000,
    POUNDS: 453.592,
    LITERS: 1000,
    MILLILITERS: 1,
    PIECES: 1,
    BOXES: 1,
  };
  return weight * (map[unit] || 1);
};

const normalizeRemaining = (value: number, unit: string) => {
  if (unit === "BOXES" || unit === "PIECES") return value;
  if (unit === "LITERS" || unit === "MILLILITERS") return value;
  return convertToGrams(value, unit);
};

const normalizeThreshold = (value: number, unit: string) => {
  if (unit === "BOXES" || unit === "PIECES") return value;
  if (unit === "LITERS") return value * 1000;
  if (unit === "MILLILITERS") return value;
  return convertToGrams(value, unit);
};

const Inventory = () => {
  const { theme } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.inventory.items);
  
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [restockOpen, setRestockOpen] = useState(false);
  const [restockMounted, setRestockMounted] = useState(false);
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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

  const handleRestockOpen = (item: InventoryItem) => {
    setRestockingItem(item);
    setRestockMounted(true);
    requestAnimationFrame(() => setRestockOpen(true));
  };

  const handleRestockClose = () => {
    setRestockOpen(false);
    setTimeout(() => {
      setRestockMounted(false);
      setRestockingItem(null);
    }, transitionMs);
  };

  const restockFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      addedQuantity: "",
      addedWeight: restockingItem?.weight ? String(restockingItem.weight) : "",
      restockUnit: restockingItem?.unit || "GRAMS",
      newPrice: "",
    },
    validationSchema: Yup.object({
      addedQuantity: Yup.number()
        .typeError("Enter a valid number")
        .positive("Must be positive")
        .required("Added quantity is required"),
      addedWeight: Yup.number()
        .typeError("Enter a valid number")
        .when(['restockUnit'], {
          is: (restockUnit: string) => restockUnit !== 'BOXES' && restockingItem?.category !== 'PACKAGING',
          then: (schema) => schema.positive("Must be positive").required("Weight is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
      restockUnit: Yup.string().required("Unit is required"),
      newPrice: Yup.number()
        .typeError("Enter a valid price")
        .min(0, "Price cannot be negative")
        .required("Total cost is required"),
    }),
    onSubmit: async (values, helpers) => {
      if (!restockingItem?.id) return;
      
      setLoading(true);
      const payload: any = {
        addedQuantity: Number(values.addedQuantity),
        addedWeight: (values.restockUnit === 'BOXES' || restockingItem.category === 'PACKAGING') ? 1 : Number(values.addedWeight),
        addedUnit: values.restockUnit,
        newPrice: Number(values.newPrice),
      };

      const { status, message, data } = await restockInventory(payload, restockingItem.id);

      if (status === 200) {
        dispatch(updateItem({ id: restockingItem.id, ...data }));
        toast.success(message || "Stock replenished successfully");
        helpers.resetForm();
        handleRestockClose();
      } else {
        toast.error(message || "Failed to restock item");
      }
      setLoading(false);
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      category: editingItem?.category ?? "INGREDIENTS",
      name: editingItem?.name ?? "",
      weight: (editingItem && editingItem.weight !== undefined) ? String(editingItem.weight) : "",
      unit: editingItem?.unit ?? "GRAMS",
      quantity: editingItem ? String(editingItem.quantity) : "",
      price: editingItem?.price ? String(editingItem.price) : "",
      isLowStockAlert: editingItem?.isLowStockAlert ?? false,
      lowStockThreshold: editingItem?.lowStockThreshold ? String(editingItem.lowStockThreshold) : "",
      lowStockThresholdUnit: editingItem?.lowStockThresholdUnit ?? "GRAMS",
      isExpiryAlert: editingItem?.isExpiryAlert ?? false,
      expiryValue: editingItem?.expiryValue ? String(editingItem.expiryValue) : "",
      expiryUnit: editingItem?.expiryUnit ?? "DAYS",
    },
    validationSchema: Yup.object({
      category: Yup.string().oneOf(["INGREDIENTS", "PACKAGING"]).required("Category is required"),
      name: Yup.string().required("Item name is required"),
      weight: Yup.number()
        .typeError("Enter a number")
        .when(['unit', 'category'], {
          is: (unit: string, category: string) => unit !== 'BOXES' && category !== 'PACKAGING',
          then: (schema) => schema.positive("Must be positive").required("Weight is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
      unit: Yup.mixed<InventoryItem["unit"]>().oneOf(["GRAMS", "KGS", "POUNDS", "LITERS", "MILLILITERS", "PIECES", "BOXES"]).required("Unit is required"),
      quantity: Yup.number().typeError("Enter a number").integer("Must be an integer").min(1, "At least 1").required("Quantity is required"),
      price: Yup.number().typeError("Enter a number").positive("Must be positive").required("Price is required"),
      isLowStockAlert: Yup.boolean(),
      lowStockThreshold: Yup.number().when("isLowStockAlert", {
        is: true,
        then: (schema) => schema
          .typeError("Enter a number")
          .min(0, "Must be positive")
          .required("Threshold is required")
          .test(
            "max-weight",
            "Threshold cannot exceed total inventory weight",
            function (value) {
              const { weight, unit, quantity, lowStockThresholdUnit } = this.parent as any;
              if (!value || !weight || !unit || !quantity || !lowStockThresholdUnit) return true;

              const totalWeightInGrams = convertToGrams(Number(weight), unit) * Number(quantity);
              const thresholdInGrams = convertToGrams(Number(value), lowStockThresholdUnit);

              return thresholdInGrams <= totalWeightInGrams;
            }
          ),
        otherwise: (schema) => schema.notRequired(),
      }),
      lowStockThresholdUnit: Yup.string().when("isLowStockAlert", {
        is: true,
        then: (schema) => schema.required("Unit is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      isExpiryAlert: Yup.boolean(),
      expiryValue: Yup.number().when("isExpiryAlert", {
        is: true,
        then: (schema) => schema.typeError("Enter a number").min(1, "Must be positive").required("Expiry value is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      expiryUnit: Yup.string().when("isExpiryAlert", {
        is: true,
        then: (schema) => schema.oneOf(["DAYS", "MONTHS", "YEARS"]).required("Unit is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values, helpers) => {
      setLoading(true);
      const payload: InventoryItem = {
        name: values.name,
        category: values.category as any,
        weight: (values.unit === 'BOXES' || values.category === 'PACKAGING') ? 1 : Number(values.weight),
        unit: values.unit as InventoryItem["unit"],
        quantity: Number(values.quantity),
        price: Number(values.price),
        isLowStockAlert: values.isLowStockAlert,
        lowStockThreshold: values.isLowStockAlert ? Number(values.lowStockThreshold) : undefined,
        lowStockThresholdUnit: values.isLowStockAlert ? values.lowStockThresholdUnit as InventoryItem["unit"] : undefined,
        isExpiryAlert: values.isExpiryAlert,
        expiryValue: values.isExpiryAlert ? Number(values.expiryValue) : undefined,
        expiryUnit: values.isExpiryAlert ? values.expiryUnit as InventoryItem["expiryUnit"] : undefined,
        ...(editingItem && editingItem.remainingStock !== undefined && { 
            remainingStock: editingItem.remainingStock 
        })
      };

      if (editingItem) {
        if (editingItem.id) {
          const { status, message, data } = await editInventory(payload, editingItem.id);
          if (status == 200) {
            dispatch(updateItem({ id: editingItem.id, ...data }));
            toast.success(message || "Item updated");
          } else {
            toast.error(message || "Failed to update item");
          }
        } else {
          toast.error("Item ID is missing");
        }
      } else {
        const { status, data, message } = await postInventory(payload);
        if (status == 200) {
          dispatch(addItem(data));
          toast.success(message || "Item added");
        } else {
          toast.error(message || "Failed to add item");
        }
      }
      setLoading(false);
      helpers.resetForm();
      handleClose();
    },
  });

  const handleEdit = async (item: InventoryItem) => {
    setEditingItem(item);
    handleOpen();
  };

  const handleDeleteButton = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const getUnitLabel = (unit: InventoryItem["unit"], value: number) => {
    switch (unit) {
      case "BOXES":
        if (value === 1) return "box";
        return "boxes";
      case "LITERS":
      case "MILLILITERS":
        return "ml";
      default:
        if (value === 1) return "gm";
        return "gms";
    }
  }

  const columns: ColumnDef<InventoryItem, unknown>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Weight", accessorKey: "weight" },
    { header: "Unit", accessorKey: "unit" },
    { header: "Quantity", accessorKey: "quantity" },
    {
      header: "Remaining Stock",
      accessorKey: "remainingStock",
      cell: ({ row }) => {
        const item = row.original;
        const value = item.remainingStock;
        if (value === undefined || value === null) return "-";
        const unitLabel = getUnitLabel(item.unit, value);
        const remainingNormalized = normalizeRemaining(value, item.unit);
        const thresholdNormalized =
          item.isLowStockAlert && item.lowStockThreshold !== undefined && item.lowStockThresholdUnit
            ? normalizeThreshold(Number(item.lowStockThreshold), String(item.lowStockThresholdUnit))
            : undefined;
        const isLow =
          Boolean(item.isLowStockAlert) &&
          typeof thresholdNormalized === "number" &&
          remainingNormalized < thresholdNormalized;
        return (
          <span className={isLow ? "text-red-600 font-medium" : undefined}>
            {value} {unitLabel}
          </span>
        );
      },
    },
    { header: "Price", accessorKey: "price" },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              title="Edit"
              variant="ghost"
              onClick={() => handleEdit(item)}
              className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-blue-50"
              style={{ color: theme.text }}
            >
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.25 19.04 4 20l.96-4.25 11.902-11.263Z" />
              </svg>
            </Button>
            <Button
              type="button"
              title="Delete"
              variant="ghost"
              onClick={() => item.id && handleDeleteButton(item.id)}
              className="rounded-full p-1.5 text-red-600/70 hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </Button>
            <Button
              type="button"
              title="Restock Item"
              variant="ghost"
              onClick={() => handleRestockOpen(item)} 
              className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-emerald-50 text-emerald-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  const loadInitialData = async () => {
    setLoading(true);
    const { status, data, message } = await getInventory();
    if (status == 200) {
      dispatch(setItems(data));
    } else {
      toast.error(message || "Failed to load inventory");
    }
    setLoading(false);
  }

  const deleteInventoryItem = async (id: string) => {
    setLoading(true);
    const { status, message } = await deleteInventory(id);
    if (status == 200) {
      dispatch(deleteItem(id));
      toast.success(message || "Item deleted");
    } else {
      toast.error(message || "Failed to delete item");
    }
    setLoading(false);
    setDeleteModalOpen(false);
  }

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteInventoryItem(deleteId);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <div className="p-2" style={{ color: theme.text, fontFamily: theme.fontFamily }}>
      {loading && !open && !deleteModalOpen && !restockOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <Loader />
        </div>
      )}
      <div className="w-full flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
          Inventory
        </h1>
        <Button fullWidth={false} className="px-3 py-1 text-sm" onClick={() => { setEditingItem(null); handleOpen(); }} variant="primary">
          Add New Item
        </Button>
      </div>
      <DataTable columns={columns} data={items} isLoading={loading} />

      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => !loading && setDeleteModalOpen(false)}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        primaryActionLabel="Delete"
        secondaryActionLabel="Cancel"
        onPrimaryAction={handleConfirmDelete}
        primaryVariant="danger"
        isLoading={loading}
      />

      {/* --- RESTOCK MODAL --- */}
      {restockMounted && (
        <div className={`fixed inset-0 z-[1300] flex items-center justify-center ${restockOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-out`}>
          <div className={`absolute inset-0 bg-black/40 ${restockOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onClick={handleRestockClose} />
          <div
            className={`relative w-full max-w-sm mx-4 rounded-xl shadow-lg ${restockOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transform transition-all duration-200 ease-out flex flex-col`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
          >
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: theme.border }}>
              <h2 className="text-lg font-medium" style={{ color: theme.text }}>
                Restock {restockingItem?.name}
              </h2>
            </div>
            <form onSubmit={restockFormik.handleSubmit} className="flex flex-col">
              <FormikProvider value={restockFormik}>
                <div className="px-5 py-4 space-y-4">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Field name="addedQuantity">
                        {({ field, meta }: FieldProps) => (
                          <TextField
                            label="Added Quantity"
                            name="addedQuantity"
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
                  </div>

                  <div className="flex space-x-2">
                    {restockFormik.values.restockUnit !== 'BOXES' && restockingItem?.category !== 'PACKAGING' && (
                      <div className="flex-1">
                        <Field name="addedWeight">
                          {({ field, meta }: FieldProps) => (
                            <TextField
                              label="Weight per unit"
                              name="addedWeight"
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
                    )}
                    
                    <div className={restockFormik.values.restockUnit !== 'BOXES' && restockingItem?.category !== 'PACKAGING' ? "w-1/3" : "w-full"}>
                      <Field name="restockUnit">
                        {({ field }: FieldProps) => (
                          <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium text-left" style={{ color: theme.text }}>Unit</label>
                            <select
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value === 'BOXES') {
                                  restockFormik.setFieldValue('addedWeight', 1);
                                }
                              }}
                              className="w-full px-3 py-2 border rounded-md text-left text-sm outline-none"
                              style={{ backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }}
                            >
                              {restockingItem?.category === "PACKAGING" ? (
                                <>
                                  <option value="PIECES">pieces</option>
                                  <option value="BOXES">boxes</option>
                                </>
                              ) : (
                                <>
                                  <option value="GRAMS">Grams</option>
                                  <option value="KGS">Kgs</option>
                                  <option value="POUNDS">Pounds</option>
                                  <option value="LITERS">Liters</option>
                                  <option value="MILLILITERS">ML</option>
                                </>
                              )}
                            </select>
                          </div>
                        )}
                      </Field>
                    </div>
                  </div>

                  <Field name="newPrice">
                    {({ field, meta }: FieldProps) => (
                      <TextField
                        label="Total Cost for New Stock (₹)"
                        name="newPrice"
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
                <div
                  className="px-5 py-3 border-t flex items-center justify-end space-x-2"
                  style={{ borderColor: theme.border, backgroundColor: theme.surfaceAlt }}
                >
                  <Button type="button" fullWidth={false} className="px-3 py-1 text-sm" onClick={handleRestockClose} variant="secondary" disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" fullWidth={false} className="px-3 py-1 text-sm" variant="primary" loading={loading}>
                    Confirm Restock
                  </Button>
                </div>
              </FormikProvider>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      {mounted && (
        <div className={`fixed inset-0 z-[1300] flex items-center justify-center ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-out`}>
          <div className={`absolute inset-0 bg-black/40 ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onClick={handleClose} />
          <div
            className={`relative w-full max-w-lg mx-4 rounded-xl shadow-lg ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transform transition-all duration-200 ease-out flex flex-col max-h-[90vh]`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
          >
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: theme.border }}>
              <h2 className="text-lg font-medium" style={{ color: theme.text }}>
                {editingItem ? "Edit Item" : "Add Item"}
              </h2>
            </div>
            <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 min-h-0">
              <FormikProvider value={formik}>
                <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
                  <div className="flex flex-col space-y-2 mb-4">
                    <label className="text-sm font-medium" style={{ color: theme.text }}>
                      Category<span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <div className="flex space-x-6 py-1">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="category" value="INGREDIENTS" checked={formik.values.category === "INGREDIENTS"} onChange={formik.handleChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        </div>
                        <span className="text-sm font-medium" style={{ color: theme.text }}>Ingredients</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="category" value="PACKAGING" checked={formik.values.category === "PACKAGING"} onChange={formik.handleChange} className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        </div>
                        <span className="text-sm font-medium" style={{ color: theme.text }}>Packaging</span>
                      </label>
                    </div>
                  </div>
                  <Field name="name">
                    {({ field, meta }: FieldProps) => (
                      <TextField label="Item Name" name="name" value={field.value as string} onChange={field.onChange} onBlur={field.onBlur} error={meta.touched && meta.error ? meta.error : undefined} required />
                    )}
                  </Field>
                  {formik.values.unit !== 'BOXES' && formik.values.category !== 'PACKAGING' && (
                    <Field name="weight">
                      {({ field, meta }: FieldProps) => (
                        <TextField label="Weight" name="weight" type="number" value={field.value as string} onChange={field.onChange} onBlur={field.onBlur} error={meta.touched && meta.error ? meta.error : undefined} required />
                      )}
                    </Field>
                  )}
                  <Field name="unit">
                    {({ field, meta }: FieldProps) => (
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-left" style={{ color: theme.text }}>
                          Unit of Measurement<span className="text-red-600 ml-0.5">*</span>
                        </label>
                        <select {...field} onChange={(e) => { field.onChange(e); if (e.target.value === 'BOXES') { formik.setFieldValue('weight', 1); } }} className="w-full px-3 py-2 border rounded-md text-left text-sm outline-none" style={{ backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }}>
                          <option value="GRAMS">Grams (gms)</option>
                          <option value="KGS">Kilograms (kgs)</option>
                          <option value="POUNDS">Pounds (lbs)</option>
                          <option value="LITERS">Liters (l)</option>
                          <option value="MILLILITERS">Milliliters (ml)</option>
                          <option value="PIECES">pieces</option>
                          <option value="BOXES">boxes</option>
                        </select>
                        {meta.touched && meta.error ? <p className="text-sm text-red-600">{meta.error}</p> : null}
                      </div>
                    )}
                  </Field>
                  <Field name="quantity">
                    {({ field, meta }: FieldProps) => (
                      <TextField label="Quantity" name="quantity" type="number" value={field.value as string} onChange={field.onChange} onBlur={field.onBlur} error={meta.touched && meta.error ? meta.error : undefined} required />
                    )}
                  </Field>
                  <Field name="price">
                    {({ field, meta }: FieldProps) => (
                      <TextField label="Price" name="price" type="number" value={field.value as string} onChange={field.onChange} onBlur={field.onBlur} error={meta.touched && meta.error ? meta.error : undefined} required />
                    )}
                  </Field>
                  <Field name="isLowStockAlert">
                    {({ field }: FieldProps) => (
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isLowStockAlert" {...field} checked={field.value} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                        <div className="flex items-center space-x-1">
                          <label htmlFor="isLowStockAlert" className="text-sm font-medium" style={{ color: theme.text }}>Low Stock Alert</label>
                        </div>
                      </div>
                    )}
                  </Field>
                  {formik.values.isLowStockAlert && (
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Field name="lowStockThreshold">
                          {({ field, meta }: FieldProps) => (
                            <TextField label="Low Stock Threshold" name="lowStockThreshold" type="number" value={field.value as string} onChange={field.onChange} onBlur={field.onBlur} error={meta.touched && meta.error ? meta.error : undefined} required />
                          )}
                        </Field>
                      </div>
                      <div className="w-1/3">
                        <Field name="lowStockThresholdUnit">
                          {({ field }: FieldProps) => (
                            <div className="flex flex-col space-y-1">
                              <label className="text-sm font-medium text-left invisible">Unit</label>
                              <select {...field} className="w-full px-3 py-2 border rounded-md text-left text-sm outline-none h-[38px]" style={{ backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }}>
                                <option value="GRAMS">Grams (gms)</option>
                                <option value="KGS">Kilograms (kgs)</option>
                                <option value="POUNDS">Pounds (lbs)</option>
                                <option value="LITERS">Liters (l)</option>
                                <option value="MILLILITERS">Milliliters (ml)</option>
                                <option value="PIECES">pieces</option>
                                <option value="BOXES">boxes</option>
                              </select>
                            </div>
                          )}
                        </Field>
                      </div>
                    </div>
                  )}
                  <Field name="isExpiryAlert">
                    {({ field }: FieldProps) => (
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isExpiryAlert" {...field} checked={field.value} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                        <label htmlFor="isExpiryAlert" className="text-sm font-medium" style={{ color: theme.text }}>Expiry Alert</label>
                      </div>
                    )}
                  </Field>
                  {formik.values.isExpiryAlert && (
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Field name="expiryValue">
                          {({ field, meta }: FieldProps) => (
                            <TextField label="Expires In" name="expiryValue" type="number" value={field.value as string} onChange={field.onChange} onBlur={field.onBlur} error={meta.touched && meta.error ? meta.error : undefined} required />
                          )}
                        </Field>
                      </div>
                      <div className="w-1/3">
                        <Field name="expiryUnit">
                          {({ field }: FieldProps) => (
                            <div className="flex flex-col space-y-1">
                              <label className="text-sm font-medium text-left invisible">Unit</label>
                              <select {...field} className="w-full px-3 py-2 border rounded-md text-left text-sm outline-none h-[38px]" style={{ backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }}>
                                <option value="DAYS">Days</option>
                                <option value="MONTHS">Months</option>
                                <option value="YEARS">Years</option>
                              </select>
                            </div>
                          )}
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t flex items-center justify-end space-x-2 flex-shrink-0" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                  <Button type="button" fullWidth={false} className="px-3 py-1 text-sm" onClick={handleClose} variant="secondary" disabled={loading}>Cancel</Button>
                  <Button type="submit" fullWidth={false} className="px-3 py-1 text-sm" variant="primary" loading={loading}>{editingItem ? "Save Changes" : "Add"}</Button>
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
