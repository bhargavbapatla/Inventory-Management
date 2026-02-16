import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type ColumnDef } from "@tanstack/react-table";
import * as Yup from "yup";
import { FormikProvider, useFormik } from "formik";
import Drawer from "@mui/material/Drawer";
import Button from "../../../components/Button";
import DataTable from "../../../components/table/DataTable";
import TextField from "../../../components/TextField";
import { addRecipe, deleteRecipe, updateRecipe, setRecipes, type RecipeItem, type RecipeIngredient } from "../../../store/slices/recipesSlice";
import type { RootState, AppDispatch } from "../../../store";
import { toast } from "react-hot-toast";
import { setItems, type InventoryItem, type Unit } from "../../../store/slices/inventorySlice";
import { useAuth } from "../../../features/auth/authContext";
import { deleteProductById, getProductById, getProducts, postProductData, updateProductsbyId } from "../../../api/products";
import Loader from "../../../components/Loader";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { getInventory } from "../../../api/inventory";

const unitToGramsFactor: Record<Unit, number> = {
  GRAMS: 1,
  KGS: 1000,
  POUNDS: 453.592,
  LITERS: 1000,
  MILLILITERS: 1,
  PIECES: 1,
  BOXES: 1,
};

const toGrams = (value: number, unit: Unit): number =>
  value * unitToGramsFactor[unit];

type IngredientForm = {
  id: string;
  inventoryId: string;
  quantityNeeded?: string;
  unit: Unit;
  price: number;
  quantity?: string;
};

const Recipes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.recipes.items);
  const inventoryItems = useSelector((state: RootState) => state.inventory.items);
  const { theme } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<RecipeItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [initiateEdit, setInitiateEdit] = useState(false);


  const handleOpen = () => {
    setInitiateEdit(true);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };



  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingItem?.name ?? "",
      makingCharge: editingItem ? String(editingItem.makingCharge) : "",
      description: editingItem?.description ?? "",
      ingredients: editingItem
        ? editingItem.ingredients.map<IngredientForm>((ing) => ({
          id: ing.id,
          inventoryId: ing.inventoryId ?? "",
          quantityNeeded:
            ing.quantity !== undefined ? String(ing.quantity) : "",
          unit: ing.unit ?? "GRAMS",
          price: ing.price !== undefined ? ing.price : 0,
        }))
        : [],
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Recipe name is required"),
      makingCharge: Yup.number()
        .typeError("Enter a number")
        .positive("Must be positive")
        .required("Making charge is required"),
      description: Yup.string().optional(),
    }),
    onSubmit: async (values, helpers) => {
      setLoading(true);
      let hasInventoryError = false;
      if (values.ingredients.length === 0) {
        toast.error("Add at least one ingredient");
        setLoading(false);
        return;
      }
      values.ingredients.forEach((ing, index) => {
        if (!ing.inventoryId || ing.inventoryId === "") {
          hasInventoryError = true;
          toast.error(`Row ${index + 1}: Select an ingredient`);
          return;
        }

        const inventoryItem = inventoryItems.find(
          (inv) => inv.id === ing.inventoryId
        );

        if (!inventoryItem) {
          return;
        }

        const requestedQuantity = Number(ing.quantityNeeded);

        if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
          hasInventoryError = true;
          toast.error(
            `Row ${index + 1}: Enter a quantity greater than 0 for ${inventoryItem.name
            }`
          );
          return;
        }

        const requestedGrams = toGrams(requestedQuantity, ing.unit);
        const availableTotal = inventoryItem.weight * inventoryItem.quantity;
        const availableGrams = toGrams(availableTotal, inventoryItem.unit);
        console.log("requestedGrams", requestedGrams, ing.unit);
        console.log("availableGrams", availableGrams);
        if (requestedGrams > availableGrams) {
          hasInventoryError = true;
          toast.error(
            `Row ${index + 1}: Required quantity for ${inventoryItem.name} exceeds available stock`
          );
        }
      });

      if (hasInventoryError) {
        setLoading(false);
        return;
      }

      const mappedIngredients: RecipeIngredient[] = values.ingredients.map(
        (ing) => ({
          id: ing.id,
          inventoryId: ing.inventoryId || null,
          quantityNeeded: Number(ing.quantityNeeded) || 0,
          unit: ing.unit,
          price: ing.price || 0,
        })
      );

      const totalCostPrice = getTotalCost();

      if (editingItem) {
        setInitiateEdit(false);
        const { data, status, message } = await updateProductsbyId({
          id: editingItem.id,
          name: values.name,
          makingCharge: Number(values.makingCharge),
          description: values.description,
          ingredients: mappedIngredients,
          totalCostPrice,
        }, editingItem.id || "")
        if (status === 201 || status === 200) {
          console.log("datadatadata", data);
          dispatch(
            updateRecipe({ ...data })
          );
          toast.success(message || "Recipe updated");
          helpers.resetForm();
          handleClose();
        } else {
          toast.error(message || "Error updating recipe");
        }
      } else {
        setInitiateEdit(false);
        const { data, status, message } = await postProductData({
          name: values.name,
          makingCharge: Number(values.makingCharge),
          description: values.description,
          ingredients: mappedIngredients,
          totalCostPrice,
        })
        console.log("message", message);
        if (status === 201 || status === 200) {
          dispatch(
            addRecipe({
              ...data,
              // ingredients: mappedIngredients,
            })
          );
          toast.success(message || "Recipe added");
          helpers.resetForm();
          handleClose();

        } else {
          toast.error(message || "Error adding recipe");
        }

      }
      setLoading(false);
    },
  });

  console.log("editingItem.ingredients", editingItem?.ingredients, formik?.values?.ingredients);


  const handleEdit = async (item: RecipeItem) => {
    handleOpen();
    setLoading(true);
    const { data, status, message } = await getProductById(item.id || "");
    if (status === 200) {
      console.log("datadatadata", data);
      setEditingItem(data);
      // handleOpen();
    } else {
      toast.error(message || "Error fetching recipe");
    }
    setLoading(false);
  };

  const handleDeleteClick = (id?: string) => {
    if (!id) return;
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setLoading(true);

    const { status, message } = await deleteProductById(deleteId);
    if (status === 200 || status === 204) {
      dispatch(deleteRecipe(deleteId));
      toast.success("Recipe deleted");
      setDeleteModalOpen(false);
    } else {
      toast.error(message || "Error deleting recipe");
    }

    setLoading(false);
    setDeleteId(null);
  };

  const handleAddIngredientRow = () => {
    const next: IngredientForm = {
      id: String(Date.now()),
      inventoryId: "",
      quantityNeeded: "",
      unit: "GRAMS",
      price: 0,
    };
    formik.setFieldValue("ingredients", [...formik.values.ingredients, next]);
  };

  const handleChangeIngredientInventory = (id: string, inventoryId: string, price: any) => {
    formik.setFieldValue(
      "ingredients",
      formik.values.ingredients.map((ing) =>
        ing.id === id ? { ...ing, inventoryId, price } : ing
      )
    );
  };

  const handleChangeIngredientQuantityNeeded = (id: string, quantity: string) => {
    formik.setFieldValue(
      "ingredients",
      formik.values.ingredients.map((ing) =>
        ing.id === id ? { ...ing, quantityNeeded: quantity } : ing
      )
    );
  };

  const handleChangeIngredientUnit = (id: string, unit: Unit) => {
    formik.setFieldValue(
      "ingredients",
      formik.values.ingredients.map((ing) =>
        ing.id === id ? { ...ing, unit } : ing
      )
    );
  };

  const handleRemoveIngredientRow = (id: string) => {
    formik.setFieldValue(
      "ingredients",
      formik.values.ingredients.filter((ing) => ing.id !== id)
    );
  };

  const columns: ColumnDef<RecipeItem, unknown>[] = [
    { header: "Name", accessorKey: "name" },
    {
      header: "Total Cost",
      accessorKey: "totalCostPrice",
      cell: ({ row }) =>
        Number(row.original.totalCostPrice ?? 0).toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
        }),
    },
    {
      header: "Ingredients",
      cell: ({ row }) => row.original.ingredients.length,
    },
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
            </Button>
            <Button
              type="button"
              title="Delete"
              variant="ghost"
              onClick={() => handleDeleteClick(item.id)}
              className="inline-flex items-center justify-center rounded-full p-1.5 transition-colors"
              style={{ color: theme.secondary }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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

  const getTotalCost = () => {
    const makingCharge = Number(formik.values.makingCharge) || 0;

    const ingredientsCost = formik.values.ingredients.reduce((acc, ing) => {
      const inventoryItem = inventoryItems.find((inv) => inv.id === ing.inventoryId);

      if (!inventoryItem || !inventoryItem.price || !inventoryItem.quantity) {
        return acc;
      }

      let totalHistoricalBaseUnits = 0;

      if (inventoryItem.category === 'INGREDIENTS') {
        const weightInGrams = toGrams(inventoryItem.weight, inventoryItem.unit);
        totalHistoricalBaseUnits = weightInGrams * inventoryItem.quantity;
      } else {
        totalHistoricalBaseUnits = inventoryItem.quantity;
      }

      if (totalHistoricalBaseUnits === 0) return acc;

      const averageCostPerBaseUnit = inventoryItem.price / totalHistoricalBaseUnits;

      let quantityNeededInBaseUnits = 0;
      if (inventoryItem.category === 'INGREDIENTS') {
        quantityNeededInBaseUnits = toGrams(Number(ing.quantityNeeded) || 0, ing.unit);
      } else {
        quantityNeededInBaseUnits = Number(ing.quantityNeeded) || 0;
      }
      console.log("quantityNeededInBaseUnits", quantityNeededInBaseUnits, inventoryItem, averageCostPerBaseUnit);
      const finalIngredientCost = quantityNeededInBaseUnits * averageCostPerBaseUnit;

      return acc + finalIngredientCost;
    }, 0);

    return Number((makingCharge + ingredientsCost).toFixed(2));
  };


  const loadInventoryItems = async () => {
    setLoading(true);
    const [inventoryRes, productsRes] = await Promise.all([
      getInventory(),
      getProducts()
    ]);
    if (inventoryRes.status === 200 && productsRes.status === 200) {
      dispatch(setItems(inventoryRes.data));
      dispatch(setRecipes(productsRes.data));
    } else {
      toast.error(inventoryRes.message || productsRes.message || "Error loading inventory items");
      console.error("Error loading inventory items:", inventoryRes.message || productsRes.message);
    }
    setLoading(false);

  };

  const getUnitOptions = (category: any) => {
    if (category === 'INGREDIENTS') {
      return <Fragment>
        <option value="GRAMS">grams</option>
        <option value="KGS">kgs</option>
        <option value="POUNDS">pounds</option>
        <option value="LITERS">liters</option>
        <option value="MILLILITERS">ml</option>
        <option value="PIECES">pieces</option>
      </Fragment>
    } else {
      return <Fragment>
        <option value="PIECES">pieces</option>
        <option value="BOXES">Boxes</option>
      </Fragment>
    }
  }
  useEffect(() => {
    // loadInitialData();
    loadInventoryItems();
  }, []);

  return (
    <div
      className="p-2"
      style={{ color: theme.text, fontFamily: theme.fontFamily }}
    >
      <div className="w-full flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
          Recipes
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
          Add New Recipe
        </Button>
      </div>
      <div className="relative">
        {loading && !open && !deleteModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
            <Loader />
          </div>
        )}
        <DataTable columns={columns} data={items} isLoading={loading} />
      </div>

      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => !loading && setDeleteModalOpen(false)}
        title="Delete Recipe"
        description="Are you sure you want to delete this recipe? This action cannot be undone."
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
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 2 }}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 600 } },
        }}
      >
        <div
          className="h-full w-full flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundColor: theme.background }}
        >
          {loading && initiateEdit && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <Loader />
            </div>
          )}
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: theme.border, backgroundColor: theme.surface }}
          >
            <h2
              className="text-lg font-medium"
              style={{ color: theme.text }}
            >
              {editingItem ? "Edit Recipe" : "Add Recipe"}
            </h2>
          </div>
          <form
            onSubmit={formik.handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <FormikProvider value={formik}>
              <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
                <div
                  className="rounded-lg border shadow-sm"
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
                      className="text-lg font-semibold"
                      style={{ color: theme.text }}
                    >
                      Recipe Details
                    </h3>
                  </div>
                  <div className="px-4 py-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <TextField
                        label="Recipe Name"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.name && formik.errors.name
                            ? formik.errors.name
                            : undefined
                        }
                        required
                      />
                      <TextField
                        label="Making Charge"
                        name="makingCharge"
                        type="number"
                        value={formik.values.makingCharge}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.makingCharge &&
                            formik.errors.makingCharge
                            ? formik.errors.makingCharge
                            : undefined
                        }
                        required
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label
                        className="text-sm font-medium text-left"
                        style={{ color: theme.text }}
                      >
                        Description/Notes
                      </label>
                      <textarea
                        name="description"
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md bg-white text-left border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                        style={{
                          color: theme.text,
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-lg border shadow-sm"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  }}
                >
                  <div
                    className="px-4 py-2 border-b flex items-center justify-between"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.surfaceAlt,
                    }}
                  >
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: theme.text }}
                      >
                        Ingredients &amp; Costing
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: theme.textMuted }}
                      >
                        Raw Materials Required
                      </p>
                    </div>
                    <Button
                      type="button"
                      fullWidth={false}
                      className="px-3 py-1 text-sm"
                      onClick={handleAddIngredientRow}
                    >
                      Add Ingredient Row
                    </Button>
                  </div>
                  <div className="px-4 py-3">
                    <div
                      className="overflow-x-auto rounded-lg border"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                      }}
                    >
                      <table className="min-w-full divide-y" style={{ borderColor: theme.border }}>
                        <thead
                          style={{
                            backgroundColor: theme.surfaceAlt,
                          }}
                        >
                          <tr>
                            <th
                              className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider"
                              style={{ color: theme.textMuted }}
                            >
                              Ingredient Name
                            </th>
                            <th
                              className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider"
                              style={{ color: theme.textMuted }}
                            >
                              Quantity Needed
                            </th>
                            <th
                              className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider"
                              style={{ color: theme.textMuted }}
                            >
                              Unit
                            </th>
                            <th
                              className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider"
                              style={{ color: theme.textMuted }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className="divide-y"
                          style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          }}
                        >
                          {formik.values.ingredients.map((ing) => {
                            const inventoryItem: InventoryItem | undefined = inventoryItems.find(
                              (inv) => inv.id === ing.inventoryId
                            );
                            return (
                              <tr key={ing.id}>
                                <td className="px-4 py-2 text-sm">
                                  <select
                                    value={ing.inventoryId}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const selectedItem = inventoryItems.find((inv) => inv.id === val);
                                      handleChangeIngredientInventory(
                                        ing.id,
                                        val,
                                        selectedItem?.price || 0,
                                      );
                                    }}
                                    className="w-full px-3 py-2 border rounded-md bg-white text-left border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                    style={{
                                      color: theme.text,
                                      backgroundColor: theme.surface,
                                      borderColor: theme.border,
                                    }}
                                  >
                                    <option value="">
                                      {inventoryItems.length === 0
                                        ? "No inventory items"
                                        : "Select ingredient"}
                                    </option>
                                    {inventoryItems.map((inv) => (
                                      <option key={inv.id} value={inv.id}>
                                        {inv.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <input
                                    type="number"
                                    min="0"
                                    value={ing.quantityNeeded}
                                    onChange={(e) =>
                                      handleChangeIngredientQuantityNeeded(
                                        ing.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-28 px-3 py-2 border rounded-md bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                    style={{
                                      color: theme.text,
                                      backgroundColor: theme.surface,
                                      borderColor: theme.border,
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <select
                                    value={ing.unit}
                                    onChange={(e) =>
                                      handleChangeIngredientUnit(
                                        ing.id,
                                        e.target.value as Unit
                                      )
                                    }
                                    className="w-28 px-3 py-2 border rounded-md bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                    style={{
                                      color: theme.text,
                                      backgroundColor: theme.surface,
                                      borderColor: theme.border,
                                    }}
                                  >
                                    {getUnitOptions(inventoryItem?.category)}
                                  </select>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <button
                                    type="button"
                                    title="Remove"
                                    onClick={() =>
                                      handleRemoveIngredientRow(ing.id)
                                    }
                                    className="inline-flex items-center justify-center rounded-full p-1.5 transition-colors"
                                    style={{ color: theme.textMuted }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-4 h-4"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4h8v2" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                      <path d="M10 11v6" />
                                      <path d="M14 11v6" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {formik.values.ingredients.length === 0 && (
                            <tr>
                              <td
                                className="px-4 py-4 text-sm text-center"
                                style={{ color: theme.textMuted }}
                                colSpan={4}
                              >
                                No ingredients added yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="px-5 py-3 border-t"
                style={{ borderColor: theme.border, backgroundColor: theme.surfaceAlt }}
              >
                <h3
                  className="text-lg font-semibold"
                  style={{ color: theme.text }}
                >
                  Total Cost: {getTotalCost().toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </h3>
              </div>
              <div
                className="px-5 py-3 border-t flex items-center justify-end space-x-2"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <Button
                  type="button"
                  fullWidth={false}
                  className="px-3 py-1 text-sm"
                  onClick={handleClose}
                  variant="secondary"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" fullWidth={false} className="px-3 py-1 text-sm" variant="primary" loading={loading}>
                  {editingItem ? "Save Changes" : "Add"}
                </Button>
              </div>
            </FormikProvider>
          </form>
        </div>
      </Drawer >
    </div >
  );
};

export default Recipes;

