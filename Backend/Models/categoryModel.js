const db = require("../path/to/your/database"); // adjust path
const ApiError = require("../path/to/your/apiError"); // adjust path

class CategoryModel {
    constructor() {
        this.tableName = "categoryTable";
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
     * CREATE - Add a new category
     * Required: categoryName (must be unique)
     */
    async createCategory(body) {
        try {
            // Validate required fields
            this.validateFields(body, ["categoryName"]);

            const categoryName = body.categoryName.trim();

            if (categoryName.length === 0) {
                throw new ApiError("Category name cannot be empty", 400);
            }

            // Check if category already exists (UNIQUE constraint)
            const existingCategory = await db
                .selectFrom(this.tableName)
                .selectAll()
                .where("categoryName", "=", categoryName)
                .executeTakeFirst();

            if (existingCategory) {
                throw new ApiError("Category name already exists", 409); // 409 Conflict
            }

            // Insert new category
            const result = await db
                .insertInto(this.tableName)
                .values({ categoryName })
                .executeTakeFirst();

            return this.formatResponse(
                true,
                "Category created successfully",
                {
                    id: result.insertId,
                    categoryName
                }
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to create category",
                error.statusCode || 400
            );
        }
    }

    /**
     * READ - Get all categories
     */
    async getAllCategories() {
        try {
            const categories = await db
                .selectFrom(this.tableName)
                .selectAll()
                .orderBy("categoryName", "asc")
                .execute();

            return this.formatResponse(
                true,
                "Categories retrieved successfully",
                categories
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve categories",
                error.statusCode || 400
            );
        }
    }

    /**
     * READ - Get category by ID
     */
    async getCategoryById(id) {
        try {
            // Validate ID
            if (!id || isNaN(id)) {
                throw new ApiError("Valid category ID is required", 400);
            }

            const category = await db
                .selectFrom(this.tableName)
                .selectAll()
                .where("id", "=", Number(id))
                .executeTakeFirst();

            if (!category) {
                throw new ApiError("Category not found", 404);
            }

            return this.formatResponse(
                true,
                "Category retrieved successfully",
                category
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve category",
                error.statusCode || 400
            );
        }
    }

    /**
     * UPDATE - Edit category name
     */
    async editCategory(id, body) {
        try {
            // Validate ID
            if (!id || isNaN(id)) {
                throw new ApiError("Valid category ID is required", 400);
            }

            // Validate fields
            this.validateFields(body, ["categoryName"]);

            const categoryName = body.categoryName.trim();

            if (categoryName.length === 0) {
                throw new ApiError("Category name cannot be empty", 400);
            }

            // Check if category exists
            const existingCategory = await db
                .selectFrom(this.tableName)
                .selectAll()
                .where("id", "=", Number(id))
                .executeTakeFirst();

            if (!existingCategory) {
                throw new ApiError("Category not found", 404);
            }

            // Check if new name already exists (if it's different)
            if (categoryName !== existingCategory.categoryName) {
                const duplicateCategory = await db
                    .selectFrom(this.tableName)
                    .selectAll()
                    .where("categoryName", "=", categoryName)
                    .executeTakeFirst();

                if (duplicateCategory) {
                    throw new ApiError("Category name already exists", 409);
                }
            }

            // Update category
            await db
                .updateTable(this.tableName)
                .set({ categoryName })
                .where("id", "=", Number(id))
                .execute();

            return this.formatResponse(
                true,
                "Category updated successfully",
                {
                    id,
                    categoryName
                }
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to update category",
                error.statusCode || 400
            );
        }
    }

    /**
     * DELETE - Delete category by ID
     * Note: This will fail if products reference this category (FOREIGN KEY constraint)
     */
    async deleteCategory(id) {
        try {
            // Validate ID
            if (!id || isNaN(id)) {
                throw new ApiError("Valid category ID is required", 400);
            }

            // Check if category exists
            const existingCategory = await db
                .selectFrom(this.tableName)
                .selectAll()
                .where("id", "=", Number(id))
                .executeTakeFirst();

            if (!existingCategory) {
                throw new ApiError("Category not found", 404);
            }

            // Check if products reference this category
            const productCount = await db
                .selectFrom("productTable")
                .select(eb => eb.fn.count("id").as("count"))
                .where("categoryId", "=", Number(id))
                .executeTakeFirst();

            if (productCount?.count > 0) {
                throw new ApiError(
                    `Cannot delete category. ${productCount.count} product(s) reference this category.`,
                    409 // Conflict
                );
            }

            // Delete category
            await db
                .deleteFrom(this.tableName)
                .where("id", "=", Number(id))
                .execute();

            return this.formatResponse(
                true,
                "Category deleted successfully",
                { id }
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to delete category",
                error.statusCode || 400
            );
        }
    }

    /**
     * GET - Category with product count
     */
    async getCategoryWithProductCount(id) {
        try {
            if (!id || isNaN(id)) {
                throw new ApiError("Valid category ID is required", 400);
            }

            const category = await db
                .selectFrom(this.tableName + " as c")
                .leftJoin("productTable as p", "c.id", "p.categoryId")
                .select([
                    "c.id",
                    "c.categoryName",
                    eb => eb.fn.count("p.id").as("productCount")
                ])
                .where("c.id", "=", Number(id))
                .groupBy("c.id")
                .executeTakeFirst();

            if (!category) {
                throw new ApiError("Category not found", 404);
            }

            return this.formatResponse(
                true,
                "Category retrieved successfully",
                category
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve category",
                error.statusCode || 400
            );
        }
    }

    /**
     * GET - All categories with product count
     */
    async getAllCategoriesWithProductCount() {
        try {
            const categories = await db
                .selectFrom(this.tableName + " as c")
                .leftJoin("productTable as p", "c.id", "p.categoryId")
                .select([
                    "c.id",
                    "c.categoryName",
                    eb => eb.fn.count("p.id").as("productCount")
                ])
                .groupBy("c.id")
                .orderBy("c.categoryName", "asc")
                .execute();

            return this.formatResponse(
                true,
                "Categories retrieved successfully",
                categories
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to retrieve categories",
                error.statusCode || 400
            );
        }
    }

    /**
     * SEARCH - Search categories by name
     */
    async searchCategories(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new ApiError("Search term is required", 400);
            }

            const term = `%${searchTerm.trim()}%`;

            const categories = await db
                .selectFrom(this.tableName)
                .selectAll()
                .where("categoryName", "like", term)
                .orderBy("categoryName", "asc")
                .execute();

            return this.formatResponse(
                true,
                "Search completed successfully",
                categories
            );

        } catch (error) {
            throw new ApiError(
                error.message || "Failed to search categories",
                error.statusCode || 400
            );
        }
    }
}

module.exports = CategoryModel;