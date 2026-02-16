import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type ColumnDef } from "@tanstack/react-table";
import * as Yup from "yup";
import { FormikProvider, useFormik } from "formik";
import Button from "../../../components/Button";
import DataTable from "../../../components/table/DataTable";
import TextField from "../../../components/TextField";
import { addCustomer, deleteCustomer, updateCustomer, setCustomers, type Customer } from "../../../store/slices/customerSlice";
import type { RootState, AppDispatch } from "../../../store";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../features/auth/authContext";
import ConfirmationModal from "../../../components/ConfirmationModal";
import Loader from "../../../components/Loader";
import { getCustomers, createCustomer, updateCustomerById, deleteCustomerById } from "../../../api/customers";
import Drawer from "@mui/material/Drawer";

const Customers = () => {
  const { theme } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.customers.items);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const transitionMs = 250;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setEditingItem(null);
    }, transitionMs);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingItem?.name ?? "",
      email: editingItem?.email ?? "",
      phone: editingItem?.phone ?? "",
      address: editingItem?.address ?? "",
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .matches(/^[A-Za-z\s.'-]+$/, "Enter a valid name")
        .required("Customer name is required"),
      email: Yup.string().email("Enter a valid email").optional(),
      phone: Yup.string()
        .trim()
        .matches(/^\d{10}$/, "Enter a valid 10-digit phone")
        .required("Phone is required"),
      address: Yup.string()
        .trim()
        .min(5, "Address must be at least 5 characters")
        .max(200, "Address must be at most 200 characters")
        .required("Address is required"),
    }),
    onSubmit: async (values, helpers) => {
      setLoading(true);
      const payload = {
        customer: {
          name: values.name.trim(),
          email: values.email ? values.email.trim() : null,
          phone: values.phone.trim(),
          address: values.address.trim(),
        }
      };

      if (editingItem?.id) {
        const { status, message } = await updateCustomerById(payload as any, editingItem.id);
        if (status === 200) {
          dispatch(updateCustomer({ id: editingItem.id, ...payload.customer }));
          toast.success(message || "Customer updated");
        } else {
          toast.error(message || "Failed to update customer");
        }
      } else {
        const { status, data, message } = await createCustomer(payload as any);
        if (status === 200) {
          dispatch(addCustomer(data));
          toast.success(message || "Customer added");
        } else {
          toast.error(message || "Failed to add customer");
        }
      }
      setLoading(false);
      helpers.resetForm();
      handleClose();
    },
  });

  const handleEdit = (item: Customer) => {
    setEditingItem(item);
    handleOpen();
  };

  const handleDeleteButton = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const { status, message } = await deleteCustomerById(deleteId);
    if (status === 200) {
      dispatch(deleteCustomer(deleteId));
      toast.success(message || "Customer deleted");
    } else {
      toast.error(message || "Failed to delete customer");
    }
    setLoading(false);
    setDeleteModalOpen(false);
    setDeleteId(null);
  };

  const columns: ColumnDef<Customer, unknown>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Email", accessorKey: "email" },
    { header: "Phone", accessorKey: "phone" },
    { header: "Address", accessorKey: "address" },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center space-xs-1">
            <Button
              type="button"
              title="Edit"
              variant="ghost"
              onClick={() => handleEdit(item)}
              className="inline-flex items-center justify-center rounded-full p-1.5 transition-colors"
              style={{ color: theme.textMuted }}
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.25 19.04 4 20l.96-4.25 11.902-11.263Z" />
              </svg>
            </Button>
            <Button
              type="button"
              title="Delete"
              variant="ghost"
              onClick={() => handleDeleteButton(item.id)}
              className="inline-flex items-center justify-center rounded-full p-1.5 transition-colors"
              style={{ color: theme.secondary }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const { data, status } = await getCustomers();
      if (status === 200 && Array.isArray(data)) {
        dispatch(setCustomers(data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Customers</h1>
        <Button type="button" fullWidth={false} className="px-3 py-1 text-sm" onClick={() => handleOpen()}>
          Add Customer
        </Button>
      </div>

      <div className="relative">
        {loading && !deleteModalOpen && <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]"><Loader /></div>}
        <DataTable columns={columns} data={items} isLoading={loading && !deleteModalOpen} />
      </div>

      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => !loading && setDeleteModalOpen(false)}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        primaryActionLabel="Delete"
        secondaryActionLabel="Cancel"
        onPrimaryAction={handleConfirmDelete}
        primaryVariant="danger"
        isLoading={loading}
      />

      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        transitionDuration={{ enter: 350, exit: 250 }}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 2,
          '& .MuiBackdrop-root': { bgcolor: 'rgba(0,0,0,0.25)' },
          '& .MuiDrawer-paper': { transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 600 } } }}
      >
        <div className="h-full w-full flex flex-col relative" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: theme.background }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <h2 className="text-lg font-medium" style={{ color: theme.text }}>
              {editingItem ? "Edit Customer" : "Add Customer"}
            </h2>
          </div>
          <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <FormikProvider value={formik}>
              <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                  <TextField label="Name" name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined} required />
                  <TextField label="Email" name="email" value={formik.values.email as any} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined} />
                  <TextField label="Phone" name="phone" value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.phone && formik.errors.phone ? formik.errors.phone : undefined} required />
                  <TextField label="Address" name="address" value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.touched.address && formik.errors.address ? formik.errors.address : undefined} required />
                </div>
              </div>
              <div className="px-5 py-3 border-t flex items-center justify-end space-x-2" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <Button type="button" fullWidth={false} className="px-3 py-1 text-sm" onClick={handleClose} variant="secondary" disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" fullWidth={false} className="px-3 py-1 text-sm" variant="primary" loading={loading}>
                  {editingItem ? "Save Changes" : "Add"}
                </Button>
              </div>
            </FormikProvider>
          </form>
        </div>
      </Drawer>
    </div>
  );
};

export default Customers;
