import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Box,
  ChevronDown,
  Eye,
  ImagePlus,
  Menu,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  buildRecipePayload,
  getBlankRecipeMaterial,
  getRecipeCategoryOptions,
  getRecipeFormState,
  normalizeProductOptions,
} from "../helpers.jsx";

function RecipeManagementPage({
  categories,
  recipes,
  error,
  isLoading,
  onAdd,
  onDelete,
  onDetail,
  onEdit,
  onRefresh,
  query,
  rawCount,
  categoryFilter,
  onCategoryFilterChange,
  onQueryChange,
}) {
  const categoryOptions = useMemo(() => getRecipeCategoryOptions(categories), [categories]);
  const categoryFilters = ["Semua Kategori", ...categoryOptions.map((category) => category.name)];

  return (
    <section className="admin-content admin-content--recipes">
      <div className="admin-recipe-heading">
        <div>
          <h1>Recipe Crafting</h1>
          <p>Kelola panduan kreasi tangan dan bahan yang dibutuhkan.</p>
        </div>
        <button type="button" className="admin-recipe-add" onClick={onAdd}>
          <Plus size={19} strokeWidth={2.7} />
          <span>Tambah Resep Baru</span>
        </button>
      </div>

      <div className="admin-recipe-toolbar">
        <div className="admin-recipe-tabs" role="tablist" aria-label="Filter kategori recipe">
          {categoryFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={filter === categoryFilter ? "is-active" : ""}
              onClick={() => onCategoryFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <label className="admin-recipe-search">
          <Search size={20} strokeWidth={2.4} />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Cari resep..."
            aria-label="Cari recipe"
          />
        </label>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      {isLoading ? (
        <div className="admin-recipe-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="admin-recipe-card admin-recipe-card--loading">
              <span className="admin-skeleton" />
              <div>
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            </article>
          ))}
        </div>
      ) : recipes.length ? (
        <div className="admin-recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={() => onDelete(recipe)}
              onDetail={() => onDetail(recipe)}
              onEdit={() => onEdit(recipe)}
            />
          ))}
        </div>
      ) : (
        <div className="admin-recipe-empty">
          <BookOpen size={34} strokeWidth={2.2} />
          <strong>Belum ada recipe yang cocok.</strong>
          <span>{rawCount ? "Coba ubah filter atau kata kunci." : "Tambahkan recipe crafting pertama."}</span>
        </div>
      )}
    </section>
  );
}

function RecipeCard({ recipe, onDelete, onDetail, onEdit }) {
  return (
    <article className="admin-recipe-card">
      <div className="admin-recipe-card__media">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} loading="lazy" />
        ) : (
          <span><ImagePlus size={30} strokeWidth={2.2} /></span>
        )}
        <span className={`admin-recipe-status ${recipe.isDraft ? "is-draft" : ""}`}>
          <i />
          {recipe.isDraft ? "Draft" : "Published"}
        </span>
      </div>
      <div className="admin-recipe-card__body">
        <span className="admin-recipe-chip">{recipe.categoryName}</span>
        <h2>{recipe.title}</h2>
        <p>{recipe.description || "Belum ada deskripsi recipe."}</p>
        <div className="admin-recipe-card__meta">
          <Box size={16} strokeWidth={2.4} />
          <span>{recipe.materialCount} Bahan dibutuhkan</span>
        </div>
      </div>
      <div className="admin-recipe-card__actions">
        <button type="button" className="admin-recipe-card__detail" onClick={onDetail}>
          <Eye size={15} strokeWidth={2.5} />
          <span>Lihat Detail</span>
        </button>
        <button type="button" aria-label={`Edit ${recipe.title}`} onClick={onEdit}>
          <Pencil size={16} strokeWidth={2.5} />
        </button>
        <button type="button" aria-label={`Hapus ${recipe.title}`} onClick={onDelete}>
          <Trash2 size={16} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}

function RecipeDetailPage({
  recipe,
  error,
  isLoading,
  onBack,
  onEdit,
  onRefresh,
  onToggleSidebar,
  isSidebarOpen,
}) {
  return (
    <section className="admin-recipe-detail-page">
      <div className="admin-recipe-detail-head">
        <div>
          <button type="button" className="admin-order-back" onClick={onBack}>
            <ArrowLeft size={17} strokeWidth={2.4} />
            <span>Kembali</span>
          </button>
          <button
            type="button"
            className="admin-mobile-menu admin-mobile-menu--form"
            aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            onClick={onToggleSidebar}
          >
            <Menu size={22} />
          </button>
          <span className="admin-recipe-chip">{recipe?.categoryName || "Recipe Crafting"}</span>
          <h1>{recipe?.title || "Detail Recipe"}</h1>
          <p>{recipe?.description || "Detail recipe crafting dan bahan yang dibutuhkan."}</p>
        </div>
        <div className="admin-recipe-detail-actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onEdit} disabled={!recipe}>
            <Pencil size={16} strokeWidth={2.4} />
            <span>Edit Resep</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      {isLoading ? (
        <div className="admin-recipe-detail-loading">
          <span className="admin-skeleton" />
          <span className="admin-skeleton" />
          <span className="admin-skeleton" />
        </div>
      ) : (
        <>
          <div className="admin-recipe-hero-image">
            {recipe?.image ? <img src={recipe.image} alt={recipe.title} /> : <ImagePlus size={42} strokeWidth={2.2} />}
          </div>

          <div className="admin-recipe-detail-layout">
            <aside className="admin-recipe-ingredients-card">
              <div className="admin-recipe-section-title">
                <h2>Bahan-bahan</h2>
                <span>{recipe?.materials?.length || 0} item</span>
              </div>
              <div className="admin-recipe-ingredient-list">
                {(recipe?.materials || []).map((material, index) => (
                  <RecipeIngredientItem key={material.id || index} material={material} />
                ))}
              </div>
            </aside>

            <section className="admin-recipe-steps-section">
              <h2>Langkah-langkah</h2>
              <div className="admin-recipe-steps-list">
                {(recipe?.steps || []).map((step, index) => (
                  <RecipeStepItem key={step.id || index} step={step} index={index} />
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}

function RecipeIngredientItem({ material }) {
  return (
    <div className="admin-recipe-ingredient-item">
      <strong>{material.materialName}</strong>
      <span>{material.quantityNeeded} {material.unit}</span>
      <small>{material.categoryName}</small>
    </div>
  );
}

function RecipeStepItem({ step, index }) {
  return (
    <article className="admin-recipe-step-item">
      <span className="admin-recipe-step-number">{index + 1}</span>
      <div>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </div>
    </article>
  );
}

function RecipeFormPage({
  categories,
  error,
  isLoading,
  isSaving,
  mode,
  products,
  recipe,
  onCancel,
  onSubmit,
  onToggleSidebar,
  isSidebarOpen,
}) {
  const isCreate = mode === "create";
  const categoryOptions = useMemo(() => getRecipeCategoryOptions(categories), [categories]);
  const productOptions = useMemo(() => normalizeProductOptions(products), [products]);
  const [form, setForm] = useState(() => getRecipeFormState(recipe, categories));

  useEffect(() => {
    setForm(getRecipeFormState(recipe, categories));
  }, [recipe, categories]);

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: typeof reader.result === "string" ? reader.result : "",
        imageName: file.name,
        imageFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const setMaterialField = (index, field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      materials: current.materials.map((material, materialIndex) =>
        materialIndex === index ? { ...material, [field]: value } : material
      ),
    }));
  };

  const addMaterial = () => {
    setForm((current) => ({
      ...current,
      materials: [...current.materials, getBlankRecipeMaterial(current.categoryId)],
    }));
  };

  const removeMaterial = (index) => {
    setForm((current) => ({
      ...current,
      materials: current.materials.length > 1
        ? current.materials.filter((_, materialIndex) => materialIndex !== index)
        : current.materials,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(buildRecipePayload(form));
  };

  return (
    <section className="admin-recipe-form-page">
      <button
        type="button"
        className="admin-mobile-menu admin-mobile-menu--form"
        aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
        onClick={onToggleSidebar}
      >
        <Menu size={22} />
      </button>
      <form className="admin-recipe-form" onSubmit={handleSubmit}>
        <div className="admin-recipe-form-panel">
          <div className="admin-recipe-form__head">
            <div>
              <h1>{isCreate ? "Tambah recipe" : "Edit recipe"}</h1>
              <p>Isi info resep lalu tambahkan bahan-bahan yang dibutuhkan.</p>
            </div>
          </div>

        {error && <div className="admin-error admin-error--form" role="alert"><span>{error}</span></div>}
        {isLoading && (
          <div className="admin-recipe-form-loading">
            <span className="admin-skeleton" />
            <span className="admin-skeleton" />
          </div>
        )}

        <div className="admin-recipe-form-card">
          <label className="admin-category-field">
            <span>Judul</span>
            <input
              type="text"
              value={form.title}
              onChange={setField("title")}
              placeholder="Gelang Manik-manik Pelangi"
              required
            />
          </label>

          <label className="admin-category-field">
            <span>Deskripsi</span>
            <textarea
              value={form.description}
              onChange={setField("description")}
              placeholder="Panduan langkah demi langkah untuk membuat kreasi tangan."
            />
          </label>

          <div className="admin-recipe-form-row">
            <label className="admin-category-field">
              <span>Kategori</span>
              <div className="admin-select-wrap">
                <select value={form.categoryId} onChange={setField("categoryId")} aria-label="Kategori recipe">
                  {categoryOptions.map((category) => (
                    <option key={category.id || category.name} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
            </label>

            <label className="admin-category-field">
              <span>Gambar</span>
              <span className="admin-recipe-upload">
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                <Upload size={15} strokeWidth={2.7} />
                <strong>{form.imageName || "Unggah gambar"}</strong>
              </span>
            </label>
          </div>

          {form.image && (
            <div className="admin-recipe-image-preview">
              <img src={form.image} alt="Preview recipe" />
            </div>
          )}
        </div>

        <div className="admin-recipe-form-card admin-recipe-form-card--materials">
          <div className="admin-recipe-material-head">
            <h2>Bahan-bahan</h2>
            <button type="button" onClick={addMaterial}>
              <Plus size={16} strokeWidth={2.7} />
              <span>Tambah bahan</span>
            </button>
          </div>

          <div className="admin-recipe-material-editor">
            {form.materials.map((material, index) => (
              <div className="admin-recipe-material-row" key={`${index}-${material.materialName}`}>
                <label className="admin-category-field">
                  <span>Nama bahan</span>
                  <input
                    type="text"
                    value={material.materialName}
                    onChange={setMaterialField(index, "materialName")}
                    placeholder="Manik-manik kaca"
                    required
                  />
                </label>
                <label className="admin-category-field">
                  <span>Jumlah</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={material.quantityNeeded}
                    onChange={setMaterialField(index, "quantityNeeded")}
                    required
                  />
                </label>
                <label className="admin-category-field">
                  <span>Satuan</span>
                  <input
                    type="text"
                    value={material.unit}
                    onChange={setMaterialField(index, "unit")}
                    placeholder="pcs"
                  />
                </label>
                <label className="admin-category-field">
                  <span>Kategori bahan</span>
                  <div className="admin-select-wrap">
                    <select value={material.categoryId} onChange={setMaterialField(index, "categoryId")} required>
                      {categoryOptions.map((category) => (
                        <option key={category.id || category.name} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </label>
                <label className="admin-category-field">
                  <span>Produk disarankan</span>
                  <div className="admin-select-wrap">
                    <select value={material.suggestedProductId} onChange={setMaterialField(index, "suggestedProductId")}>
                      <option value="">Pilih produk</option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </label>
                <button
                  type="button"
                  className="admin-recipe-material-remove"
                  aria-label="Hapus bahan"
                  onClick={() => removeMaterial(index)}
                  disabled={form.materials.length <= 1}
                >
                  <X size={17} strokeWidth={2.6} />
                </button>
              </div>
            ))}
          </div>
        </div>

          <div className="admin-recipe-form__actions">
            <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onCancel} disabled={isSaving}>
              Batal
            </button>
            <button type="submit" className="admin-form-button admin-form-button--primary" disabled={isSaving || isLoading}>
              {isSaving ? "Menyimpan..." : "Simpan recipe"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function RecipeDeleteDialog({ recipe, error, isDeleting, onCancel, onConfirm }) {
  return (
    <div className="admin-category-delete-scrim" role="presentation">
      <section className="admin-category-delete" role="dialog" aria-modal="true" aria-labelledby="recipe-delete-title">
        <div className="admin-category-delete__head">
          <span>
            <Trash2 size={34} strokeWidth={2.6} />
          </span>
        </div>
        <div className="admin-category-delete__body">
          <h2 id="recipe-delete-title">Hapus Recipe?</h2>
          <p>Apakah Anda yakin ingin menghapus recipe "{recipe.title}"? Tindakan ini tidak dapat dibatalkan.</p>
          {error && <div className="admin-category-modal__error" role="alert">{error}</div>}
          <div className="admin-category-delete__actions">
            <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onCancel} disabled={isDeleting}>
              Batal
            </button>
            <button type="button" className="admin-category-button admin-category-button--danger" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export {
  RecipeManagementPage,
  RecipeCard,
  RecipeDetailPage,
  RecipeFormPage,
  RecipeDeleteDialog,
};
