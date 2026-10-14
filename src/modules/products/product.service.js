import { productRepository } from './product.repository.js';

function formatProduct(p) {
  if (!p) return null;
  return {
    ...p,
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

  getCategories() {
    return productRepository.findAllCategories();
  }
};
