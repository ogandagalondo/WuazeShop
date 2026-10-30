import { productRepository } from './product.repository.js';

function safeJsonParse(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return fallback;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [val];
  }
}

function formatProduct(p) {
  if (!p) return null;
  let parsedImages = safeJsonParse(p.images, []);
  if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
    parsedImages = p.image_url ? [p.image_url] : [];
  }

  return {
    ...p,
    image_url: p.image_url || parsedImages[0] || '',
    images: parsedImages,
    specs: safeJsonParse(p.specs, []),
    colors: safeJsonParse(p.colors, []),
    in_stock: Boolean(p.in_stock)
  };
}

export const productService = {
  async getProducts({ category } = {}) {
    const rows = await productRepository.findAll({ category });
    return rows.map(formatProduct);
  },

  async getProductById(id) {
    const row = await productRepository.findById(id);
    return formatProduct(row);
  },

  async getProductBySlug(slug) {
    const row = await productRepository.findBySlug(slug);
    return formatProduct(row);
  },

  async getCategories() {
    const categories = await productRepository.findAllCategories();
    const allProducts = await productRepository.findAll();
    return categories.map(cat => {
      const prods = allProducts.filter(p => p.category === cat.slug);
      return {
        ...cat,
        productCount: prods.length
      };
    });
  },

  async getCategoryBySlug(slug) {
    const category = await productRepository.findCategoryBySlug(slug);
    if (!category) return null;
    const products = await this.getProducts({ category: slug });
    return {
      ...category,
      products,
      productCount: products.length
    };
  },

  async createCategory(data) {
    return await productRepository.createCategory(data);
  },

  async updateCategory(id, data) {
    return await productRepository.updateCategory(id, data);
  },

  async deleteCategory(id) {
    return await productRepository.deleteCategory(id);
  }
};
