export const openapiSpec = {
  openapi: "3.0.3",
  info: { title: "Ecommerce API", version: "1.0.0" },
  servers: [{ url: "http://localhost:8000" }],
  tags: [
    { name: "Auth" },
    { name: "Products" },
    { name: "Admin" },
    { name: "Orders" },
    { name: "Payments" },
    { name: "Webhooks" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          images: { type: "array", items: { type: "string" } },
          colors: { type: "array", items: { type: "string" } },
          stock: { type: "number" },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                size: { type: "string" },
                stock: { type: "number" },
                color: { type: "string" },
              },
            },
          },
          category: { type: "string" },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          product: { type: "string" },
          title: { type: "string" },
          price: { type: "number" },
          quantity: { type: "number" },
          size: { type: "string" },
          color: { type: "string" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { oneOf: [{ type: "string" }, { type: "object" }] },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          totalAmount: { type: "number" },
          paymentMethod: { type: "string", enum: ["cod", "card"] },
          paymentStatus: { type: "string", enum: ["unpaid", "paid", "refunded"] },
          status: { type: "string", enum: ["pending", "accepted", "rejected", "shipped", "delivered", "cancelled"] },
          shippingAddress: {
            type: "object",
            properties: {
              name: { type: "string" },
              phone: { type: "string" },
              addressLine1: { type: "string" },
              addressLine2: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              postalCode: { type: "string" },
              country: { type: "string" },
            },
          },
          estimatedDeliveryDate: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          notes: { type: "string" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/api/v1/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Signup (requires OTP)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  otpCode: { type: "string" },
                },
                required: ["name", "email", "password", "otpCode"],
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/v1/auth/admin/login": {
      post: {
        tags: ["Auth"],
        summary: "Admin Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        responses: { 200: { description: "OK" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/auth/otp/send": {
      post: {
        tags: ["Auth"],
        summary: "Send OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string" } },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    code: { type: "string" },
                  },
                },
              },
            },
          },
          409: { description: "Email already in use" },
        },
      },
    },
    "/api/v1/auth/otp/verify": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  code: { type: "string" },
                },
                required: ["email", "code"],
              },
            },
          },
        },
        responses: {
          200: { description: "Verified" },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/v1/products": {
      get: {
        tags: ["Products"],
        summary: "List products",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/v1/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "OK" },
          404: { description: "Not found" },
        },
      },
    },
    "/api/v1/admin/products": {
      post: {
        tags: ["Admin"],
        summary: "Create product",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" },
            },
          },
        },
        responses: { 201: { description: "Created" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/admin/orders": {
      delete: {
        tags: ["Admin"],
        summary: "Delete all orders",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", properties: { deletedCount: { type: "integer" } } },
                example: { deletedCount: 123 }
              }
            }
          }
        },
        security: [{ BearerAuth: [] }]
      }
    },
    "/api/v1/admin/products/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update product",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" },
            },
          },
        },
        responses: {
          200: { description: "OK" },
          404: { description: "Not found" },
        },
        security: [{ BearerAuth: [] }],
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete product",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Deleted" },
          404: { description: "Not found" },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/admin/products/images": {
      post: {
        tags: ["Admin"],
        summary: "Upload images",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    urls: { type: "array", items: { type: "string", format: "uri" } },
                  },
                },
              },
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/orders": {
      post: {
        tags: ["Orders"],
        summary: "Create order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product: { type: "string" },
                      quantity: { type: "number" },
                      size: { type: "string" },
                      color: { type: "string" },
                    },
                    required: ["product", "quantity"],
                  },
                },
                  paymentMethod: { type: "string", enum: ["cod", "card"], default: "cod" },
                  shippingAddress: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      phone: { type: "string" },
                      addressLine1: { type: "string" },
                      addressLine2: { type: "string" },
                      city: { type: "string" },
                      state: { type: "string" },
                      postalCode: { type: "string" },
                      country: { type: "string" },
                    },
                  },
                },
                required: ["items", "shippingAddress"],
              },
              example: {
                items: [
                  { product: "69246e3996cfaaad9b16ad4d", quantity: 2, size: "M", color: "red" }
                ],
                paymentMethod: "cod",
                shippingAddress: {
                  name: "order data",
                  phone: "1234567890",
                  addressLine1: "123 Main St",
                  city: "Metropolis",
                  postalCode: "12345",
                  country: "US",
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { order: { $ref: "#/components/schemas/Order" } },
                },
                example: {
                  order: {
                    user: "692271a17ff91c90ab7dc04d",
                    items: [
                      {
                        product: "69246e3996cfaaad9b16ad4d",
                        title: "Sample Tee",
                        price: 19.99,
                        quantity: 2,
                        size: "M",
                        color: "red",
                      },
                    ],
                    totalAmount: 39.98,
                    paymentMethod: "cod",
                    paymentStatus: "unpaid",
                    status: "pending",
                    shippingAddress: {
                      name: "order data",
                      phone: "1234567890",
                      addressLine1: "123 Main St",
                      city: "Metropolis",
                      postalCode: "12345",
                      country: "US",
                    },
                    _id: "69246e4196cfaaad9b16ad51",
                    createdAt: "2025-11-24T14:40:01.482Z",
                    updatedAt: "2025-11-24T14:40:01.482Z",
                  },
                },
              },
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
      get: {
        tags: ["Admin"],
        summary: "List orders (admin)",
        responses: { 200: { description: "OK" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/orders/my": {
      get: {
        tags: ["Orders"],
        summary: "List my orders",
        responses: { 200: { description: "OK" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order detail",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { order: { $ref: "#/components/schemas/Order" } },
                },
              },
            },
          },
          404: { description: "Not found" },
        },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/orders/{id}/accept": {
      put: {
        tags: ["Admin"],
        summary: "Accept order",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  estimatedDeliveryDays: { type: "integer", default: 3 },
                  notes: { type: "string" },
                },
              },
              example: { estimatedDeliveryDays: 3 },
            },
          },
        },
        responses: { 200: { description: "OK" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/orders/{id}/reject": {
      put: {
        tags: ["Admin"],
        summary: "Reject order",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  notes: { type: "string" },
                },
              },
              example: { notes: "Out of stock" },
            },
          },
        },
        responses: { 200: { description: "OK" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/payments/intent": {
      post: {
        tags: ["Payments"],
        summary: "Create PaymentIntent",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orderId: { type: "string" },
                  currency: { type: "string" },
                  receiptEmail: { type: "string" },
                },
                required: ["orderId"],
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/payments/checkout-session": {
      post: {
        tags: ["Payments"],
        summary: "Create Checkout Session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orderId: { type: "string" },
                  currency: { type: "string" },
                  successUrl: { type: "string" },
                  cancelUrl: { type: "string" },
                },
                required: ["orderId"],
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
        security: [{ BearerAuth: [] }],
      },
    },
    "/api/v1/payments/webhook": {
      post: {
        tags: ["Webhooks"],
        summary: "Stripe webhook",
        responses: { 200: { description: "OK" } },
      },
    },
  },
};
