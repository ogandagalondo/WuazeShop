import { Router } from 'express';
import { productService } from './product.service.js';

export const productRouter = Router();

// GET /api/products (supports ?category=...)
productRouter.get('/products', (req, res) => {
  try {
    const { category } = req.query;
    const products = productService.getProducts({ category });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:identifier (supports numeric ID or slug)
productRouter.get('/products/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    let product = null;

    if (/^\d+$/.test(identifier)) {
      product = productService.getProductById(Number(identifier));
    }
    if (!product) {
      product = productService.getProductBySlug(identifier);
    }

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories
productRouter.get('/categories', (req, res) => {
  try {
    const categories = productService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/:slug
productRouter.get('/categories/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const category = productService.getCategoryBySlug(slug);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
