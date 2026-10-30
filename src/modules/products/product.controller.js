import { Router } from 'express';
import { productService } from './product.service.js';

export const productRouter = Router();

// GET /api/products (supports ?category=...)
productRouter.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    const products = await productService.getProducts({ category });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:identifier (supports numeric ID or slug)
productRouter.get('/products/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product = null;

    if (/^\d+$/.test(identifier)) {
      product = await productService.getProductById(Number(identifier));
    }
    if (!product) {
      product = await productService.getProductBySlug(identifier);
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
productRouter.get('/categories', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/:slug
productRouter.get('/categories/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await productService.getCategoryBySlug(slug);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
