export class CatalogRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async listCategories() {
    const [rows] = await this.pool.query(
      'SELECT id, name, slug, publisher, image_url FROM categories ORDER BY name ASC'
    );
    return rows;
  }

  async listActiveProductsByCategorySlug(slug) {
    const [rows] = await this.pool.query(
      `SELECT p.id, p.sku_code, p.name, p.buyer_price, p.seller_price, p.status
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE c.slug = ? AND p.status = 'active'
       ORDER BY p.seller_price ASC`,
      [slug]
    );
    return rows;
  }

  async findProductById(id) {
    const [rows] = await this.pool.query(
      `SELECT p.*, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.status = 'active'
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async upsertCategory({ name, slug, publisher, image_url }) {
    const [result] = await this.pool.query(
      `INSERT INTO categories (name, slug, publisher, image_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         publisher = VALUES(publisher),
         image_url = VALUES(image_url)`,
      [name, slug, publisher || 'Nacth Partner', image_url || null]
    );
    if (result.insertId) return result.insertId;
    const [rows] = await this.pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    return rows[0].id;
  }

  async upsertProduct(product) {
    await this.pool.query(
      `INSERT INTO products (category_id, sku_code, name, buyer_price, seller_price, status)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         category_id = VALUES(category_id),
         name = VALUES(name),
         buyer_price = VALUES(buyer_price),
         seller_price = VALUES(seller_price),
         status = VALUES(status)`,
      [
        product.category_id,
        product.sku_code,
        product.name,
        product.buyer_price,
        product.seller_price,
        product.status
      ]
    );
  }

  async deleteCategoriesExceptSlugs(slugs) {
    if (!slugs.length) return { deletedProducts: 0, deletedCategories: 0 };

    const placeholders = slugs.map(() => '?').join(',');
    const [productResult] = await this.pool.query(
      `DELETE p FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE c.slug NOT IN (${placeholders})`,
      slugs
    );
    const [categoryResult] = await this.pool.query(
      `DELETE FROM categories
       WHERE slug NOT IN (${placeholders})`,
      slugs
    );

    return {
      deletedProducts: productResult.affectedRows,
      deletedCategories: categoryResult.affectedRows
    };
  }
}
