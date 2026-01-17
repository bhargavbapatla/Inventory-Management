import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type ColumnDef } from "@tanstack/react-table";
import * as Yup from "yup";
import { FormikProvider, useFormik } from "formik";
import Drawer from "@mui/material/Drawer";
import Button from "../../../components/Button";
import DataTable from "../../../components/table/DataTable";
import TextField from "../../../components/TextField";
import { addRecipe, deleteRecipe, updateRecipe, type RecipeItem, type RecipeIngredient } from "../../../store/slices/recipesSlice";
import type { RootState, AppDispatch } from "../../../store";
import { toast } from "react-hot-toast";
import type { Unit } from "../../../store/slices/inventorySlice";
import { useAuth } from "../../../features/auth/authContext";

const unitToGramsFactor: Record<Unit, number> = {
  grams: 1,
  kgs: 1000,
  pounds: 453.592,
};

const toGrams = (value: number, unit: Unit): number =>
  value * unitToGramsFactor[unit];

type IngredientForm = {
  id: string;
  inventoryId: string;
  quantityNeeded: string;
  unit: Unit;
};

const Recipes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.recipes.items);
  const inventoryItems = useSelector((state: RootState) => state.inventory.items);
  const { theme } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecipeItem | null>(null);

  const handleOpen = () => {
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
      sellingPrice: editingItem ? String(editingItem.sellingPrice) : "",
      description: editingItem?.description ?? "",
      ingredients: editingItem
        ? editingItem.ingredients.map<IngredientForm>((ing) => ({
          id: ing.id,
          inventoryId: ing.inventoryId ?? "",
          quantityNeeded:
            ing.quantityNeeded !== undefined ? String(ing.quantityNeeded) : "",
          unit: ing.unit ?? "grams",
        }))
        : [],
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Recipe name is required"),
      sellingPrice: Yup.number()
        .typeError("Enter a number")
        .positive("Must be positive")
        .required("Selling price is required"),
      description: Yup.string().optional(),
    }),
    onSubmit: (values, helpers) => {
      let hasInventoryError = false;
      if (values.ingredients.length === 0) {
        toast.error("Add at least one ingredient");
        return;
      }
      console.log("VALLLL", values.ingredients);
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

        if (requestedGrams > availableGrams) {
          hasInventoryError = true;
          toast.error(
            `Row ${index + 1}: Required quantity for ${inventoryItem.name} exceeds available stock`
          );
        }
      });

      if (hasInventoryError) {
        return;
      }

      const mappedIngredients: RecipeIngredient[] = values.ingredients.map(
        (ing) => ({
          id: ing.id,
          inventoryId: ing.inventoryId || null,
          quantityNeeded: Number(ing.quantityNeeded) || 0,
          unit: ing.unit,
        })
      );

      if (editingItem) {
        dispatch(
          updateRecipe({
            id: editingItem.id,
            name: values.name,
            sellingPrice: Number(values.sellingPrice),
            description: values.description,
            ingredients: mappedIngredients,
          })
        );
        toast.success("Recipe updated");
      } else {
        dispatch(
          addRecipe({
            name: values.name,
            sellingPrice: Number(values.sellingPrice),
            description: values.description,
            ingredients: mappedIngredients,
          })
        );
        toast.success("Recipe added");
      }
      helpers.resetForm();
      handleClose();
    },
  });

  const handleEdit = (item: RecipeItem) => {
    setEditingItem(item);
    handleOpen();
  };

  const handleDelete = (id: string) => {
    dispatch(deleteRecipe(id));
    toast.success("Recipe deleted");
  };

  const handleAddIngredientRow = () => {
    const next: IngredientForm = {
      id: String(Date.now()),
      inventoryId: "",
      quantityNeeded: "",
      unit: "grams",
    };
    formik.setFieldValue("ingredients", [...formik.values.ingredients, next]);
  };

  const handleChangeIngredientInventory = (id: string, inventoryId: string) => {
    formik.setFieldValue(
      "ingredients",
      formik.values.ingredients.map((ing) =>
        ing.id === id ? { ...ing, inventoryId } : ing
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
    { header: "Selling Price", accessorKey: "sellingPrice" },
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
          <div className="flex items-center space-x-2">
            <button
              type="button"
              title="Edit"
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
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => handleDelete(item.id)}
              className="inline-flex items-center justify-center rounded-full p-1.5 transition-colors"
              style={{ color: theme.secondary }}
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
      <DataTable columns={columns} data={items} />

      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 600 } },
        }}
      >
        <div
          className="h-full w-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundColor: theme.background }}
        >
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
                      className="text-sm font-semibold"
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
                        label="Selling Price"
                        name="sellingPrice"
                        type="number"
                        value={formik.values.sellingPrice}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.sellingPrice &&
                          formik.errors.sellingPrice
                            ? formik.errors.sellingPrice
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
                        className="text-sm font-semibold"
                        style={{ color: theme.text }}
                      >
                        Ingredients &amp; Costing
                      </h3>
                      <p
                        className="text-xs"
                        style={{ color: theme.textMuted }}
                      >
                        Raw Materials Required
                      </p>
                    </div>
                    <Button
                      type="button"
                      fullWidth={false}
                      className="px-3 py-1 text-xs"
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
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: theme.textMuted }}
                            >
                              Ingredient Name
                            </th>
                            <th
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: theme.textMuted }}
                            >
                              Quantity Needed
                            </th>
                            <th
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                              style={{ color: theme.textMuted }}
                            >
                              Unit
                            </th>
                            <th
                              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
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
                            const inventoryItem = inventoryItems.find(
                              (inv) => inv.id === ing.inventoryId
                            );

                            return (
                              <tr key={ing.id}>
                                <td className="px-4 py-2 text-sm">
                                  <select
                                    value={ing.inventoryId}
                                    onChange={(e) =>
                                      handleChangeIngredientInventory(
                                        ing.id,
                                        e.target.value
                                      )
                                    }
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
                                    <option value="grams">grams</option>
                                    <option value="kgs">kgs</option>
                                    <option value="pounds">pounds</option>
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
                className="px-5 py-3 border-t flex items-center justify-end space-x-2"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <Button
                  type="button"
                  fullWidth={false}
                  className="px-3 py-1 text-sm"
                  onClick={handleClose}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit" fullWidth={false} className="px-3 py-1 text-sm" variant="primary">
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

export default Recipes;
