import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type ColumnDef } from "@tanstack/react-table";
import * as Yup from "yup";
import { FormikProvider, useFormik } from "formik";
import Button from "../../../components/Button";
import DataTable from "../../../components/table/DataTable";
import TextField from "../../../components/TextField";
import { addOrder, deleteOrder, updateOrder, type OrderItem } from "../../../store/slices/ordersSlice";
import type { RootState, AppDispatch } from "../../../store";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../features/auth/authContext";

type OrderFormValues = {
  productId: string;
  customerName: string;
  orderDate: string;
  status: OrderItem["status"];
  totalAmount: string;
};

const Orders = () => {
  const { theme } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.orders.items);
  const recipes = useSelector((state: RootState) => state.recipes.items);
  const [statusFilter, setStatusFilter] = useState<OrderItem["status"] | "">("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
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

  const formik = useFormik<OrderFormValues>({
    enableReinitialize: true,
    initialValues: {
      productId: editingItem?.productId ?? "",
      customerName: editingItem?.customerName ?? "",
      orderDate: editingItem?.orderDate ?? "",
      status: editingItem?.status ?? "Pending",
      totalAmount: editingItem ? String(editingItem.totalAmount) : "",
    },
    validationSchema: Yup.object({
      productId: Yup.string().required("Product is required"),
      customerName: Yup.string().required("Customer name is required"),
      orderDate: Yup.string().required("Order date is required"),
      status: Yup.mixed<OrderItem["status"]>()
        .oneOf(["Pending", "Completed", "Cancelled"])
        .required("Status is required"),
      totalAmount: Yup.number()
        .typeError("Enter a number")
        .positive("Must be positive")
        .required("Total amount is required"),
    }),
    onSubmit: (values, helpers) => {
      const payload: Omit<OrderItem, "id"> = {
        productId: values.productId,
        customerName: values.customerName,
        orderDate: values.orderDate,
        status: values.status,
        totalAmount: Number(values.totalAmount),
      };

      if (editingItem) {
        dispatch(
          updateOrder({
            id: editingItem.id,
            ...payload,
          })
        );
        toast.success("Order updated");
      } else {
        dispatch(addOrder(payload));
        toast.success("Order added");
      }

      helpers.resetForm();
      handleClose();
    },
  });

  const handleEdit = (item: OrderItem) => {
    setEditingItem(item);
    handleOpen();
  };

  const handleDelete = (id: string) => {
    dispatch(deleteOrder(id));
    toast.success("Order deleted");
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter && item.status !== statusFilter) {
      return false;
    }
    if (
      customerFilter &&
      !item.customerName.toLowerCase().includes(customerFilter.toLowerCase())
    ) {
      return false;
    }
    if (dateFilter && item.orderDate !== dateFilter) {
      return false;
    }
    return true;
  });

  const columns: ColumnDef<OrderItem, unknown>[] = [
    { header: "Customer Name", accessorKey: "customerName" },
    {
      header: "Product",
      id: "product",
      cell: ({ row }) => {
        const recipe = recipes.find((recipeItem) => recipeItem.id === row.original.productId);
        return recipe ? recipe.name : "-";
      },
    },
    { header: "Order Date", accessorKey: "orderDate" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const value = row.original.status;
        const baseClasses =
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
        let colorClasses = "";
        if (value === "Pending") {
          colorClasses = "bg-yellow-100 text-yellow-800";
        } else if (value === "Cancelled") {
          colorClasses = "bg-red-100 text-red-800";
        } else if (value === "Completed") {
          colorClasses = "bg-green-100 text-green-800";
        }
        return <span className={`${baseClasses} ${colorClasses}`}>{value}</span>;
      },
    },
    { header: "Total Amount", accessorKey: "totalAmount" },
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
    <div
      className="p-2"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="w-full flex items-center justify-between mb-4">
        <h2
          className="text-2xl font-bold"
          style={{ color: theme.text }}
        >
          Orders
        </h2>
        <Button
          fullWidth={false}
          className="px-3 py-1 text-sm"
          onClick={() => {
            setEditingItem(null);
            handleOpen();
          }}
          variant="primary"
        >
          Add New Order
        </Button>
      </div>

      <div
        className="mb-4 rounded-lg border shadow-sm"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <div
          className="px-4 py-2 border-b"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surfaceAlt,
          }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: theme.text }}
          >
            Filters
          </h3>
        </div>
        <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField
            label="Customer Name"
            name="customerFilter"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            placeholder="Filter by customer name"
            containerClassName="w-full"
          />
          <div className="flex flex-col space-y-1">
            <label
              className="text-sm font-medium text-left"
              style={{ color: theme.text }}
            >
              Order Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-left outline-none text-sm"
              style={{
                backgroundColor: theme.surfaceAlt,
                color: theme.text,
                borderColor: theme.border,
              }}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label
              className="text-sm font-medium text-left"
              style={{ color: theme.text }}
            >
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value === "" ? "" : (e.target.value as OrderItem["status"])
                )
              }
              className="w-full px-3 py-2 border rounded-md text-left outline-none text-sm"
              style={{
                backgroundColor: theme.surfaceAlt,
                color: theme.text,
                borderColor: theme.border,
              }}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className="mb-4 border-t"
        style={{ borderColor: theme.border }}
      />

      <DataTable columns={columns} data={filteredItems} />

      {mounted && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? "opacity-100" : "opacity-0"} transition-opacity duration-200 ease-out`}>
          <div
            className={`absolute inset-0 bg-black/40 ${open ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
            onClick={handleClose}
          />
          <div
            className={`relative w-full max-w-md mx-4 rounded-xl shadow-lg ${
              open ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } transform transition-all duration-200 ease-out`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.text,
            }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: theme.border }}
            >
              <h2
                className="text-lg font-medium"
                style={{ color: theme.text }}
              >
                {editingItem ? "Edit Order" : "Add Order"}
              </h2>
            </div>
            <form onSubmit={formik.handleSubmit}>
              <FormikProvider value={formik}>
                <div className="px-5 py-4 space-y-3">
                  <TextField
                    label="Customer Name"
                    name="customerName"
                    value={formik.values.customerName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.customerName && formik.errors.customerName
                        ? formik.errors.customerName
                        : undefined
                    }
                    required
                  />
                  <div className="flex flex-col space-y-1">
                    <label
                      className="text-sm font-medium text-left"
                      style={{ color: theme.text }}
                    >
                      Product<span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <select
                      name="productId"
                      value={formik.values.productId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={recipes.length === 0 && !editingItem}
                      className="w-full px-3 py-2 border rounded-md text-left outline-none text-sm"
                      style={{
                        backgroundColor: theme.surfaceAlt,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                    >
                      <option value="">
                        {recipes.length === 0 ? "No recipes available" : "Select product"}
                      </option>
                      {recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                    {formik.touched.productId && formik.errors.productId ? (
                      <p className="text-xs text-red-600">
                        {formik.errors.productId}
                      </p>
                    ) : null}
                    {recipes.length === 0 && !editingItem && (
                      <p
                        className="text-xs"
                        style={{ color: theme.textMuted }}
                      >
                        No recipes available. Create a recipe before creating an order.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label
                      className="text-sm font-medium text-left"
                      style={{ color: theme.text }}
                    >
                      Order Date<span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      name="orderDate"
                      value={formik.values.orderDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border rounded-md text-left outline-none text-sm"
                      style={{
                        backgroundColor: theme.surfaceAlt,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                    />
                    {formik.touched.orderDate && formik.errors.orderDate ? (
                      <p className="text-xs text-red-600">
                        {formik.errors.orderDate}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label
                      className="text-sm font-medium text-left"
                      style={{ color: theme.text }}
                    >
                      Status<span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <select
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border rounded-md text-left outline-none text-sm"
                      style={{
                        backgroundColor: theme.surfaceAlt,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    {formik.touched.status && formik.errors.status ? (
                      <p className="text-xs text-red-600">
                        {formik.errors.status}
                      </p>
                    ) : null}
                  </div>
                  <TextField
                    label="Total Amount"
                    name="totalAmount"
                    type="number"
                    value={formik.values.totalAmount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.totalAmount && formik.errors.totalAmount
                        ? formik.errors.totalAmount
                        : undefined
                    }
                    required
                  />
                </div>
                <div className="px-5 py-3 border-t flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    fullWidth={false}
                    className="px-3 py-1 text-sm"
                    onClick={handleClose}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    fullWidth={false}
                    className="px-3 py-1 text-sm"
                    disabled={recipes.length === 0 && !editingItem}
                    variant="primary"
                  >
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

export default Orders;
