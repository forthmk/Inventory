// adjust path to your db connection
// adjust path

class ProductModel {
    constructor() {
        this.tableName = "productTable"; // your table name
        this.categoryTableName = "categoryTable";
    }

    // Validate required fields
    validateFields(body, requiredFields) {
        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
            throw new ApiError(
                `Missing required fields: ${missingFields.join(", ")}`,
                400
            );
        }
    }

    // Format response
    formatResponse(success, message, data = null, statusCode = 200) {
        return {
            success,
            message,
            data,
            statusCode
        };
    }

    /**
     * CREATE - Add a new product
     * Required fields: name, description, categoryId, quantity, price
     */
    async createProduct(body) {
        try {
            // Validate required fields
            this.validateFields(body, ["name", "description", "categoryId", "quantity", "price"]);

            // Validate categoryId exists
            const categoryExists = await db
                .selectFrom(this.categoryTableName)
                .selectAll()
                .where("id", "=", Number(body.categoryId))
                .executeTakeFirst();

            if (!categoryExists) {
                throw new ApiError("Category does not exist", 404);
            }

            // Validate data types
            const categoryId = Number(body.categoryId);
            const quantity = Number(body.quantity);
            const price = parseFloat(body.price);

            if (!Number.isInteger(categoryId) || categoryId <= 0) {
                throw new ApiError("Invalid categoryId", 400);
            }
            if (!Number.isInteger(quantity) || quantity < 0) {
                throw new ApiError("Quantity must be a non-negative integer", 400);
            }
            if (isNaN(price) || price < 0) {
                throw new ApiError("Price must be a valid number", 400);
            }

            // Prepare data (matching your schema)
            const productData = {
                name: body.name.trim(),
                description: body.description.trim(),
                categoryId: categoryId,
                quantity: quantity,
                price: price
            };

            // Insert into database
            const result = await db
                .insertInto(this.tableName)
                .values(productData)
                .executeTakeFirst();

            return this.formatResponse(
                true,
                "Product created successfully",
                {
                    id: result.insertId,
                    ...productData
                }
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to create product",
                error.statusCode || 400
            );
        }
    }

    /**
     * READ - Get all products with category information
     */
    async getAllProducts() {
        try {
            const products = await db
                .selectFrom(this.tableName + " as p")
                .innerJoin(this.categoryTableName + " as c", "p.categoryId", "c.id")
                .select([
                    "p.id",
                    "p.name",
                    "p.description",
                    "p.quantity",
                    "p.price",
                    "c.id as categoryId",
                    "c.categoryName as categoryName"
                ])
                .orderBy("p.id", "desc")
                .execute();

            return this.formatResponse(
                true,
                "Products retrieved successfully",
                products
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve products",
                error.statusCode || 400
            );
        }
    }

    /**
     * READ - Get product by ID with category information
     */
    async getProductById(id) {
        try {
            // Validate ID
            if (!id || isNaN(id)) {
                throw new ApiError("Valid product ID is required", 400);
            }

            const product = await db
                .selectFrom(this.tableName + " as p")
                .innerJoin(this.categoryTableName + " as c", "p.categoryId", "c.id")
                .select([
                    "p.id",
                    "p.name",
                    "p.description",
                    "p.quantity",
                    "p.price",
                    "c.id as categoryId",
                    "c.categoryName as categoryName"
                ])
                .where("p.id", "=", Number(id))
                .executeTakeFirst();

            if (!product) {
                throw new ApiError("Product not found", 404);
            }

            return this.formatResponse(
                true,
                "Product retrieved successfully",
                product
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve product",
                error.statusCode || 400
            );
        }
    }

    /**
     * READ - Get products by category
     */
    async getProductsByCategory(categoryId) {
        try {
            if (!categoryId || isNaN(categoryId)) {
                throw new ApiError("Valid categoryId is required", 400);
            }

            // Verify category exists
            const categoryExists = await db
                .selectFrom(this.categoryTableName)
                .selectAll()
                .where("id", "=", Number(categoryId))
                .executeTakeFirst();

            if (!categoryExists) {
                throw new ApiError("Category does not exist", 404);
            }

            const products = await db
                .selectFrom(this.tableName + " as p")
                .innerJoin(this.categoryTableName + " as c", "p.categoryId", "c.id")
                .select([
                    "p.id",
                    "p.name",
                    "p.description",
                    "p.quantity",
                    "p.price",
                    "c.id as categoryId",
                    "c.categoryName as categoryName"
                ])
                .where("p.categoryId", "=", Number(categoryId))
                .orderBy("p.id", "desc")
                .execute();

            return this.formatResponse(
                true,
                "Products retrieved successfully",
                products
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve products by category",
                error.statusCode || 400
            );
        }
    }

    /**
     * UPDATE - Edit product
     * Can update: name, description, categoryId, quantity, price
     */
    async editProduct(id, body) {
        try {
            // Validate ID
            if (!id || isNaN(id)) {
                throw new ApiError("Valid product ID is required", 400);
            }

            // Check if product exists
            const existingProduct = await db
                .selectFrom(this.tableName)
                .selectAll()
                .where("id", "=", Number(id))
                .executeTakeFirst();

            if (!existingProduct) {
                throw new ApiError("Product not found", 404);
            }

            // Prepare update data - only update provided fields
            const updateData = {};

            if (body.name !== undefined) {
                updateData.name = body.name.trim();
            }

            if (body.description !== undefined) {
                updateData.description = body.description.trim();
            }

            if (body.categoryId !== undefined) {
                const categoryId = Number(body.categoryId);
                if (!Number.isInteger(categoryId) || categoryId <= 0) {
                    throw new ApiError("Invalid categoryId", 400);
                }

                // Verify category exists
                const categoryExists = await db
                    .selectFrom(this.categoryTableName)
                    .selectAll()
                    .where("id", "=", categoryId)
                    .executeTakeFirst();

                if (!categoryExists) {
                    throw new ApiError("Category does not exist", 404);
                }

                updateData.categoryId = categoryId;
            }

            if (body.quantity !== undefined) {
                const quantity = Number(body.quantity);
                if (!Number.isInteger(quantity) || quantity < 0) {
                    throw new ApiError("Quantity must be a non-negative integer", 400);
                }
                updateData.quantity = quantity;
            }

            if (body.price !== undefined) {
                const price = parseFloat(body.price);
                if (isNaN(price) || price < 0) {
                    throw new ApiError("Price must be a valid number", 400);
                }
                updateData.price = price;
            }

            // Only update if there's something to update
            if (Object.keys(updateData).length === 0) {
                throw new ApiError("No valid fields to update", 400);
            }

            // Update product
            await db
                .updateTable(this.tableName)
                .set(updateData)
                .where("id", "=", Number(id))
                .execute();

            return this.formatResponse(
                true,
                "Product updated successfully",
                {
                    id,
                    ...existingProduct,
                    ...updateData
                }
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to update product",
                error.statusCode || 400
            );
        }
    }

    /**
     * DELETE - Delete product by ID
     */
    async deleteProduct(id) {
        try {
            // Validate ID
            if (!id || isNaN(id)) {
                throw new ApiError("Valid product ID is required", 400);
            }

            // Check if product exists
            const existingProduct = await db
                .selectFrom(this.tableName)
                .selectAll()
                .where("id", "=", Number(id))
                .executeTakeFirst();

            if (!existingProduct) {
                throw new ApiError("Product not found", 404);
            }

            // Delete product
            await db
                .deleteFrom(this.tableName)
                .where("id", "=", Number(id))
                .execute();

            return this.formatResponse(
                true,
                "Product deleted successfully",
                { id }
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to delete product",
                error.statusCode || 400
            );
        }
    }

    /**
     * SEARCH - Search products by name or description
     */
    async searchProducts(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new ApiError("Search term is required", 400);
            }

            const term = `%${searchTerm.trim()}%`;

            const products = await db
                .selectFrom(this.tableName + " as p")
                .innerJoin(this.categoryTableName + " as c", "p.categoryId", "c.id")
                .select([
                    "p.id",
                    "p.name",
                    "p.description",
                    "p.quantity",
                    "p.price",
                    "c.id as categoryId",
                    "c.categoryName as categoryName"
                ])
                .where(eb =>
                    eb("p.name", "like", term)
                        .or("p.description", "like", term)
                )
                .orderBy("p.id", "desc")
                .execute();

            return this.formatResponse(
                true,
                "Search completed successfully",
                products
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to search products",
                error.statusCode || 400
            );
        }
    }

    /**
     * GET - Products low on stock (quantity < threshold)
     */
    async getLowStockProducts(threshold = 10) {
        try {
            const minimumStock = Number(threshold);
            if (!Number.isInteger(minimumStock) || minimumStock < 0) {
                throw new ApiError("Threshold must be a non-negative integer", 400);
            }

            const products = await db
                .selectFrom(this.tableName + " as p")
                .innerJoin(this.categoryTableName + " as c", "p.categoryId", "c.id")
                .select([
                    "p.id",
                    "p.name",
                    "p.description",
                    "p.quantity",
                    "p.price",
                    "c.id as categoryId",
                    "c.categoryName as categoryName"
                ])
                .where("p.quantity", "<", minimumStock)
                .orderBy("p.quantity", "asc")
                .execute();

            return this.formatResponse(
                true,
                `Products with stock below ${threshold}`,
                products
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve low stock products",
                error.statusCode || 400
            );
        }
    }

    /**
     * GET - Product statistics (total products, total stock value, etc)
     */
    async getProductStatistics() {
        try {
            const stats = await db
                .selectFrom(this.tableName + " as p")
                .select([
                    eb => eb.fn.count("p.id").as("totalProducts"),
                    eb => eb.fn.sum("p.quantity").as("totalQuantity"),
                    eb => eb.fn.sum(eb.raw("p.quantity * p.price")).as("totalStockValue"),
                    eb => eb.fn.avg("p.price").as("averagePrice"),
                    eb => eb.fn.min("p.price").as("minPrice"),
                    eb => eb.fn.max("p.price").as("maxPrice")
                ])
                .executeTakeFirst();

            return this.formatResponse(
                true,
                "Product statistics retrieved successfully",
                {
                    totalProducts: stats?.totalProducts || 0,
                    totalQuantity: stats?.totalQuantity || 0,
                    totalStockValue: stats?.totalStockValue || 0,
                    averagePrice: stats?.averagePrice || 0,
                    minPrice: stats?.minPrice || 0,
                    maxPrice: stats?.maxPrice || 0
                }
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve statistics",
                error.statusCode || 400
            );
        }
    }
}

module.exports = ProductModel;