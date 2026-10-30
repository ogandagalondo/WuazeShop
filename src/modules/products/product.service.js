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
