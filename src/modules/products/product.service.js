import { productRepository } from './product.repository.js';

function formatProduct(p) {
  if (!p) return null;
  let parsedImages = [];
  if (p.images) {
    try {
      parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
    } catch {
      parsedImages = [];
    }
  }
  if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
    parsedImages = p.image_url ? [p.image_url] : [];
  }

  return {
    ...p,
    image_url: p.image_url || parsedImages[0] || '',
    images: parsedImages,
    specs: p.specs ? (typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs) : [],
    colors: p.colors ? (typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors) : [],
    in_stock: Boolean(p.in_stock)
  };
}

export const productService = {
  getProducts({ category } = {}) {
    const rows = productRepository.findAll({ category });
    return rows.map(formatProduct);
  },

  getProductById(id) {
    const row = productRepository.findById(id);
    return formatProduct(row);
  },

  getProductBySlug(slug) {
    const row = productRepository.findBySlug(slug);
    return formatProduct(row);
  },

  getCategories() {
    const categories = productRepository.findAllCategories();
    return categories.map(cat => {
      const prods = productRepository.findAll({ category: cat.slug });
      return {
        ...cat,
        productCount: prods.length
      };
    });
  },

  getCategoryBySlug(slug) {
    const category = productRepository.findCategoryBySlug(slug);
    if (!category) return null;
    const products = this.getProducts({ category: slug });
    return {
      ...category,
      products,
      productCount: products.length
    };
  },

  createCategory(data) {
    return productRepository.createCategory(data);
  },

  updateCategory(id, data) {
    return productRepository.updateCategory(id, data);
  },

  deleteCategory(id) {
    return productRepository.deleteCategory(id);
  }
};
