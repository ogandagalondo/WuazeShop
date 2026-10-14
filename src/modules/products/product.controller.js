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

// GET /api/products/:id
productRouter.get('/products/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = productService.getProductById(id);
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
