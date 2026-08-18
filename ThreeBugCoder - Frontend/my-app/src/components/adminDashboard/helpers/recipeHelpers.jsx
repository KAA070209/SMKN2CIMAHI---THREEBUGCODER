import { resolveApiUrl } from "../../../lib/adminApi.js";
import { extractProducts, getCategoryApiId, getCategoryId } from "./categoryHelpers.jsx";
import { formatCompactNumber, pickNumber, toNumber } from "./dashboardHelpers.jsx";

function extractRecipes(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.recipes)) return raw.data.recipes;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.results)) return raw.data.results;
  if (Array.isArray(raw?.recipes)) return raw.recipes;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function normalizeRecipes(source, categories = []) {
  return extractRecipes(source).map((recipe, index) => normalizeRecipe(recipe, index, categories));
}

function normalizeRecipeDetail(raw, fallbackRecipe, categories = []) {
  const payload = raw?.data?.recipe || raw?.data?.detail || raw?.data || raw?.recipe || raw?.detail || raw;
  const base = fallbackRecipe?.raw || fallbackRecipe || {};
  return normalizeRecipe({ ...base, ...(payload || {}) }, 0, categories);
}

function normalizeRecipe(recipe = {}, index = 0, categories = []) {
  const id = getRecipeId(recipe) || `recipe-${index}`;
  const categoryId =
    recipe.category_id ||
    recipe.categoryId ||
    recipe.category?.id ||
    recipe.category?.uuid ||
    "";
  const category = findRecipeCategory(categoryId, categories);
  const materials = normalizeRecipeMaterials(recipe.materials || recipe.ingredients || [], categories);
  const steps = normalizeRecipeSteps(recipe.steps || recipe.instructions || recipe.directions || [], materials);
  const materialCount = pickNumber(recipe, recipe.stats || {}, [
    "material_count",
    "materialCount",
    "ingredients_count",
    "ingredientsCount",
  ]) || materials.length;

  return {
    id,
    apiId: getRecipeId(recipe),
    title: recipe.title || recipe.name || recipe.recipe_title || `Recipe ${index + 1}`,
    description: recipe.description || recipe.desc || "",
    image: resolveApiUrl(recipe.image || recipe.image_url || recipe.imageUrl || recipe.thumbnail) || "",
    categoryId,
    categoryName:
      recipe.category_name ||
      recipe.categoryName ||
      recipe.category?.name ||
      recipe.category?.title ||
      category?.name ||
      "Semua Kategori",
    materialCount,
    materials,
    steps,
    status: recipe.status || (recipe.is_draft || recipe.isDraft ? "draft" : "published"),
    isDraft: Boolean(recipe.is_draft || recipe.isDraft || String(recipe.status || "").toLowerCase() === "draft"),
    createdAt: recipe.created_at || recipe.createdAt || "",
    updatedAt: recipe.updated_at || recipe.updatedAt || "",
    raw: recipe,
  };
}

function normalizeRecipeMaterials(materials, categories = []) {
  if (!Array.isArray(materials)) return [];

  return materials.map((material, index) => {
    const categoryId =
      material.category_id ||
      material.categoryId ||
      material.category?.id ||
      material.category?.uuid ||
      "";
    const category = findRecipeCategory(categoryId, categories);
    const suggestedProduct = normalizeRecipeProduct(material.suggested_product || material.suggestedProduct);
    const recommendedProducts = Array.isArray(material.recommended_products)
      ? material.recommended_products.map(normalizeRecipeProduct).filter(Boolean)
      : [];

    return {
      id: material.id || material.uuid || material.material_id || `material-${index}`,
      materialName: material.material_name || material.materialName || material.name || "",
      quantityNeeded: material.quantity_needed ?? material.quantityNeeded ?? material.quantity ?? 1,
      unit: material.unit || material.satuan || "",
      note: material.note || material.notes || material.description || "",
      categoryId,
      categoryName:
        material.category_name ||
        material.categoryName ||
        material.category?.name ||
        material.category?.title ||
        category?.name ||
        "Kategori bahan",
      suggestedProduct,
      recommendedProducts,
      raw: material,
    };
  });
}

function normalizeRecipeProduct(product) {
  if (!product || typeof product !== "object") return null;
  return {
    id: product.id || product.uuid || product.product_id || product.productId || "",
    name: product.name || product.title || "Produk rekomendasi",
    price: toNumber(product.price ?? product.harga ?? 0),
    image: resolveApiUrl(product.image || product.image_url || product.imageUrl || product.thumbnail) || "",
    stock: product.stock ?? product.stok ?? "",
    raw: product,
  };
}

function normalizeRecipeSteps(steps, materials = []) {
  const sourceSteps = Array.isArray(steps) ? steps : [];
  const normalized = sourceSteps
    .map((step, index) => {
      if (typeof step === "string") {
        return { id: `step-${index}`, title: `Langkah ${index + 1}`, description: step };
      }

      return {
        id: step?.id || step?.uuid || `step-${index}`,
        title: step?.title || step?.name || step?.label || `Langkah ${index + 1}`,
        description: step?.description || step?.instruction || step?.content || step?.text || "",
      };
    })
    .filter((step) => step.description || step.title);

  if (normalized.length) return normalized;

  return materials.map((material, index) => ({
    id: `material-step-${material.id || index}`,
    title: index === 0 ? "Persiapkan Bahan" : `Siapkan ${material.materialName}`,
    description:
      material.note ||
      `Siapkan ${material.quantityNeeded || 1} ${material.unit || ""} ${material.materialName}. Pastikan bahan sesuai kategori ${material.categoryName}.`.replace(/\s+/g, " ").trim(),
  }));
}

function getRecipeId(recipe) {
  return recipe?.id || recipe?.uuid || recipe?.recipe_id || recipe?.recipeId || recipe?._id;
}

function getRecipeApiId(recipe) {
  const rawId = getRecipeId(recipe?.raw);
  if (rawId) return rawId;
  if (recipe?.apiId) return recipe.apiId;
  if (recipe?.id && !/^recipe-\d+$/i.test(String(recipe.id))) return recipe.id;
  return "";
}

function filterRecipes(recipes, query, categoryFilter = "Semua Kategori") {
  const needle = query.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesCategory =
      categoryFilter === "Semua Kategori" ||
      recipe.categoryName === categoryFilter ||
      String(recipe.categoryId) === String(categoryFilter);
    if (!matchesCategory) return false;
    if (!needle) return true;

    return [
      recipe.title,
      recipe.description,
      recipe.categoryName,
      recipe.materials.map((material) => material.materialName).join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

function summarizeRecipes(recipes) {
  const totalMaterials = recipes.reduce((sum, recipe) => sum + (recipe.materialCount || 0), 0);
  const published = recipes.filter((recipe) => !recipe.isDraft).length;

  return {
    total: recipes.length,
    published,
    draft: Math.max(0, recipes.length - published),
    materialText: `${formatCompactNumber(totalMaterials)} bahan terhubung`,
  };
}

function getRecipeCategoryOptions(categories) {
  const options = categories.map((category) => ({
    id: getCategoryApiId(category) || getCategoryId(category),
    name: category.name || category.title || "Kategori",
  })).filter((category) => category.id);

  return options.length ? options : [{ id: "", name: "Belum ada kategori" }];
}

function findRecipeCategory(categoryId, categories) {
  if (!categoryId) return null;
  return categories.find((category) => {
    const id = getCategoryApiId(category) || getCategoryId(category);
    return String(id) === String(categoryId);
  }) || null;
}

function normalizeProductOptions(products) {
  return extractProducts(products).map((product) => ({
    id: product.id || product.uuid || product.product_id || product.productId || "",
    name: product.name || product.title || product.nama_produk || "Produk",
    categoryId:
      product.category_id ||
      product.categoryId ||
      product.category?.id ||
      product.category?.uuid ||
      "",
  })).filter((product) => product.id);
}

function getRecipeFormState(recipe, categories = []) {
  const categoryOptions = getRecipeCategoryOptions(categories);
  const defaultCategoryId = recipe?.categoryId || categoryOptions[0]?.id || "";
  const materials = recipe?.materials?.length
    ? recipe.materials.map((material) => ({
        materialName: material.materialName || "",
        quantityNeeded: material.quantityNeeded ?? 1,
        unit: material.unit || "",
        categoryId: material.categoryId || defaultCategoryId,
        suggestedProductId: material.suggestedProduct?.id || "",
        note: material.note || "",
      }))
    : [getBlankRecipeMaterial(defaultCategoryId)];

  return {
    title: recipe?.title || "",
    description: recipe?.description || "",
    image: recipe?.image || "",
    imageName: "",
    imageFile: null,
    categoryId: defaultCategoryId,
    materials,
  };
}

function getBlankRecipeMaterial(categoryId = "") {
  return {
    materialName: "",
    quantityNeeded: 1,
    unit: "pcs",
    categoryId,
    suggestedProductId: "",
    note: "",
  };
}

function buildRecipePayload(form) {
  const categoryId = String(form.categoryId || "").trim() || null;
  const materials = (form.materials || [])
    .filter((material) => String(material.materialName || "").trim())
    .map((material) => ({
      category_id: String(material.categoryId || form.categoryId || "").trim(),
      material_name: String(material.materialName || "").trim(),
      quantity_needed: toNumber(material.quantityNeeded || 1) || 1,
      unit: String(material.unit || "").trim() || null,
      note: String(material.note || "").trim() || null,
      suggested_product_id: String(material.suggestedProductId || "").trim() || null,
    }));

  const formData = new FormData();
  formData.append("title", String(form.title || "").trim());
  if (String(form.description || "").trim()) {
    formData.append("description", String(form.description || "").trim());
  }
  if (categoryId) {
    formData.append("category_id", categoryId);
  }
  formData.append(
    "materials",
    JSON.stringify(materials.length ? materials : [getBlankRecipePayloadMaterial(form.categoryId)])
  );
  if (form.imageFile instanceof File) {
    formData.append("image", form.imageFile);
  }

  return formData;
}

function getBlankRecipePayloadMaterial(categoryId = "") {
  return {
    category_id: String(categoryId || "").trim(),
    material_name: "",
    quantity_needed: 1,
    unit: null,
    note: null,
    suggested_product_id: null,
  };
}

export {
  extractRecipes,
  normalizeRecipes,
  normalizeRecipeDetail,
  normalizeRecipe,
  normalizeRecipeMaterials,
  normalizeRecipeProduct,
  normalizeRecipeSteps,
  getRecipeId,
  getRecipeApiId,
  filterRecipes,
  summarizeRecipes,
  getRecipeCategoryOptions,
  normalizeProductOptions,
  getRecipeFormState,
  getBlankRecipeMaterial,
  buildRecipePayload,
};
