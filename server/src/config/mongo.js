/**
 * MongoDB Atlas Client & Connection Manager.
 * Native Mongoose implementation for Karakurum Silkrute Traders.
 */
const { connectDB, mongoose } = require("./db");
const models = require("../models");

// Helper to convert Prisma-style where to MongoDB filter
function toMongoFilter(where = {}) {
  if (!where || typeof where !== "object") return {};
  const filter = {};

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === "id" || key === "_id") {
      if (val && typeof val === "object") {
        if (val.in && Array.isArray(val.in)) {
          filter._id = { $in: val.in.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id) };
        } else if (val.notIn && Array.isArray(val.notIn)) {
          filter._id = { $nin: val.notIn.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id) };
        } else if (val.not) {
          filter._id = { $ne: mongoose.Types.ObjectId.isValid(val.not) ? new mongoose.Types.ObjectId(val.not) : val.not };
        }
      } else if (mongoose.Types.ObjectId.isValid(val)) {
        filter._id = new mongoose.Types.ObjectId(val);
      } else {
        filter._id = val;
      }
      continue;
    }

    if (key === "OR" && Array.isArray(val)) {
      filter.$or = val.map(toMongoFilter);
      continue;
    }
    if (key === "AND" && Array.isArray(val)) {
      filter.$and = val.map(toMongoFilter);
      continue;
    }
    if (key === "NOT") {
      filter.$nor = [toMongoFilter(val)];
      continue;
    }

    if (val && typeof val === "object" && !(val instanceof Date)) {
      const fieldCond = {};
      if (val.equals !== undefined) fieldCond.$eq = val.equals;
      if (val.not !== undefined) fieldCond.$ne = val.not;
      if (val.in !== undefined) fieldCond.$in = val.in;
      if (val.notIn !== undefined) fieldCond.$nin = val.notIn;
      if (val.lt !== undefined) fieldCond.$lt = val.lt;
      if (val.lte !== undefined) fieldCond.$lte = val.lte;
      if (val.gt !== undefined) fieldCond.$gt = val.gt;
      if (val.gte !== undefined) fieldCond.$gte = val.gte;
      if (val.contains !== undefined) {
        fieldCond.$regex = new RegExp(val.contains, val.mode === "insensitive" ? "i" : "");
      }
      if (Object.keys(fieldCond).length > 0) {
        filter[key] = fieldCond;
      } else {
        // Nested object — recurse (e.g. relation filters)
        filter[key] = val;
      }
    } else {
      filter[key] = val;
    }
  }

  return filter;
}

// Convert Mongoose doc to plain object with string id
function formatResult(doc) {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map(formatResult);
  if (typeof doc.toObject === "function") {
    const obj = doc.toObject({ virtuals: true });
    obj.id = obj._id?.toString() || obj.id;
    return obj;
  }
  if (doc._id && !doc.id) {
    doc.id = doc._id.toString();
  }
  return doc;
}

function toMongoSort(orderBy) {
  if (!orderBy) return null;
  const sort = {};
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  for (const o of entries) {
    for (const [k, dir] of Object.entries(o)) {
      sort[k] = dir === "desc" ? -1 : 1;
    }
  }
  return sort;
}

function createModelDelegate(Model) {
  return {
    model: Model,

    async findUnique({ where, include, select } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = Model.findOne(filter);
      if (select) query = query.select(Object.keys(select).filter(k => !["categories", "product_variants", "users"].includes(k)).join(" "));
      const doc = await query.exec();
      return formatResult(doc);
    },

    async findFirst({ where, include, select, orderBy } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = Model.findOne(filter);
      const sort = toMongoSort(orderBy);
      if (sort) query = query.sort(sort);
      if (select) query = query.select(Object.keys(select).filter(k => !["categories", "product_variants", "users"].includes(k)).join(" "));
      const doc = await query.exec();
      return formatResult(doc);
    },

    async findMany({ where, include, select, orderBy, skip, take } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = Model.find(filter);
      const sort = toMongoSort(orderBy);
      if (sort) query = query.sort(sort);
      if (skip) query = query.skip(Number(skip));
      if (take) query = query.limit(Number(take));
      if (select) query = query.select(Object.keys(select).filter(k => !["categories", "product_variants", "users"].includes(k)).join(" "));
      const docs = await query.exec();
      return formatResult(docs);
    },

    async create({ data } = {}) {
      await connectDB();
      // Handle Prisma nested create (e.g. product_variants: { create: [...] })
      const cleanData = { ...data };
      if (cleanData.product_variants && typeof cleanData.product_variants === "object" && cleanData.product_variants.create) {
        cleanData.product_variants = cleanData.product_variants.create;
      }
      const doc = await Model.create(cleanData);
      return formatResult(doc);
    },

    async createMany({ data, skipDuplicates } = {}) {
      await connectDB();
      const items = Array.isArray(data) ? data : [data];
      const opts = skipDuplicates ? { ordered: false } : {};
      const result = await Model.insertMany(items, opts).catch(err => {
        if (skipDuplicates && err.code === 11000) return [];
        throw err;
      });
      return { count: Array.isArray(result) ? result.length : 0 };
    },

    async update({ where, data } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      const doc = await Model.findOneAndUpdate(filter, { $set: data }, { returnDocument: "after" });
      return formatResult(doc);
    },

    async upsert({ where, update, create } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      const existing = await Model.findOne(filter);
      if (existing) {
        const doc = await Model.findOneAndUpdate(filter, { $set: update }, { returnDocument: "after" });
        return formatResult(doc);
      } else {
        const doc = await Model.create({ ...where, ...create });
        return formatResult(doc);
      }
    },

    async delete({ where } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      const doc = await Model.findOneAndDelete(filter);
      return formatResult(doc);
    },

    async deleteMany({ where } = {}) {
      await connectDB();
      const filter = where ? toMongoFilter(where) : {};
      const res = await Model.deleteMany(filter);
      return { count: res.deletedCount };
    },

    async count({ where } = {}) {
      await connectDB();
      const filter = where ? toMongoFilter(where) : {};
      return Model.countDocuments(filter);
    },

    async aggregate({ where, _avg, _count, _sum } = {}) {
      await connectDB();
      const filter = where ? toMongoFilter(where) : {};
      const groupStage = { _id: null };
      if (_avg) {
        for (const k of Object.keys(_avg)) {
          groupStage[`avg_${k}`] = { $avg: `$${k}` };
        }
      }
      if (_count) {
        groupStage.count_id = { $sum: 1 };
      }
      if (_sum) {
        for (const k of Object.keys(_sum)) {
          groupStage[`sum_${k}`] = { $sum: `$${k}` };
        }
      }

      const res = await Model.aggregate([{ $match: filter }, { $group: groupStage }]);
      const first = res[0] || {};
      return {
        _avg: _avg ? Object.keys(_avg).reduce((acc, k) => ({ ...acc, [k]: first[`avg_${k}`] ?? null }), {}) : {},
        _count: _count ? { id: first.count_id || 0 } : {},
        _sum: _sum ? Object.keys(_sum).reduce((acc, k) => ({ ...acc, [k]: first[`sum_${k}`] || 0 }), {}) : {}
      };
    },

    async groupBy({ by, where, _avg, _count, _sum, orderBy, take } = {}) {
      await connectDB();
      const filter = where ? toMongoFilter(where) : {};
      const byFields = Array.isArray(by) ? by : [by];

      // Build _id group key
      const idGroup = byFields.reduce((acc, field) => {
        acc[field] = `$${field}`;
        return acc;
      }, {});

      const groupStage = { _id: idGroup };
      if (_avg) {
        for (const k of Object.keys(_avg)) {
          groupStage[`avg_${k}`] = { $avg: `$${k}` };
        }
      }
      if (_count) {
        groupStage.count_id = { $sum: 1 };
      }
      if (_sum) {
        for (const k of Object.keys(_sum)) {
          groupStage[`sum_${k}`] = { $sum: `$${k}` };
        }
      }

      const pipeline = [{ $match: filter }, { $group: groupStage }];
      if (orderBy) {
        const sort = toMongoSort(orderBy) || {};
        pipeline.push({ $sort: sort });
      }
      if (take) {
        pipeline.push({ $limit: Number(take) });
      }

      const results = await Model.aggregate(pipeline);

      return results.map(row => {
        const out = {};
        // Unpack _id group fields
        for (const field of byFields) {
          out[field] = row._id[field];
        }
        if (_avg) {
          out._avg = {};
          for (const k of Object.keys(_avg)) {
            out._avg[k] = row[`avg_${k}`] ?? null;
          }
        }
        if (_count) {
          out._count = { id: row.count_id || 0 };
        }
        if (_sum) {
          out._sum = {};
          for (const k of Object.keys(_sum)) {
            out._sum[k] = row[`sum_${k}`] || 0;
          }
        }
        return out;
      });
    }
  };
}

// Map MongoDB models to database collections
const db = {
  users: createModelDelegate(models.User),
  addresses: createModelDelegate(models.Address),

  // categories with product_count support via $lookup
  categories: {
    ...createModelDelegate(models.Category),
    async findMany({ where, include, select, orderBy, skip, take } = {}) {
      await connectDB();
      const filter = where ? toMongoFilter(where) : {};
      const sort = toMongoSort(orderBy) || { created_at: -1 };

      const pipeline = [{ $match: filter }];

      // If _count.products requested, add lookup
      if (include?._count?.select?.products !== undefined) {
        pipeline.push({
          $lookup: { from: "products", localField: "_id", foreignField: "category_id", as: "_products" }
        });
        pipeline.push({
          $addFields: { "_count.products": { $size: "$_products" } }
        });
        pipeline.push({ $project: { _products: 0 } });
      }

      pipeline.push({ $sort: sort });
      if (skip) pipeline.push({ $skip: Number(skip) });
      if (take) pipeline.push({ $limit: Number(take) });

      const docs = await models.Category.aggregate(pipeline);
      return docs.map(doc => {
        doc.id = doc._id?.toString();
        return doc;
      });
    },

    async findUnique({ where, include, select } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      const doc = await models.Category.findOne(filter).exec();
      if (!doc) return null;
      const result = formatResult(doc);
      if (include?._count?.select?.products !== undefined) {
        const count = await models.Product.countDocuments({ category_id: doc._id });
        result._count = { products: count };
      }
      return result;
    }
  },

  // products with category population
  products: {
    ...createModelDelegate(models.Product),
    async findUnique({ where, include, select } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      const doc = await models.Product.findOne(filter).exec();
      if (!doc) return null;
      const result = formatResult(doc);
      if (include?.categories || select?.categories) {
        const cat = result.category_id ? await models.Category.findById(result.category_id).exec() : null;
        result.categories = cat ? formatResult(cat) : null;
      }
      return result;
    },
    async findFirst({ where, include, select, orderBy } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = models.Product.findOne(filter);
      const sort = toMongoSort(orderBy);
      if (sort) query = query.sort(sort);
      const doc = await query.exec();
      if (!doc) return null;
      const result = formatResult(doc);
      if (include?.categories || select?.categories) {
        const cat = result.category_id ? await models.Category.findById(result.category_id).exec() : null;
        result.categories = cat ? formatResult(cat) : null;
      }
      return result;
    },
    async findMany({ where, include, select, orderBy, skip, take } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = models.Product.find(filter);
      const sort = toMongoSort(orderBy);
      if (sort) query = query.sort(sort);
      if (skip) query = query.skip(Number(skip));
      if (take) query = query.limit(Number(take));
      const docs = await query.exec();
      const results = formatResult(docs);
      if (include?.categories || select?.categories) {
        const catIds = [...new Set(results.map(r => r.category_id).filter(Boolean))];
        const cats = await models.Category.find({ _id: { $in: catIds } }).exec();
        const catMap = {};
        for (const c of cats) { catMap[c._id.toString()] = formatResult(c); }
        for (const r of results) {
          r.categories = r.category_id ? (catMap[r.category_id.toString()] || null) : null;
        }
      }
      return results;
    }
  },

  cart_items: createModelDelegate(models.CartItem),
  orders: createModelDelegate(models.Order),
  order_items: {
    ...createModelDelegate(models.Order),
    async groupBy({ by, where, _sum, orderBy, take } = {}) {
      await connectDB();
      const pipeline = [];
      if (where?.orders?.status) {
        const orderFilter = toMongoFilter(where.orders);
        pipeline.push({ $match: orderFilter });
      }
      pipeline.push({ $unwind: "$order_items" });
      pipeline.push({
        $group: {
          _id: {
            product_id: "$order_items.product_id",
            product_name: "$order_items.product_name"
          },
          quantity: { $sum: "$order_items.quantity" },
          subtotal: { $sum: "$order_items.subtotal" }
        }
      });
      if (orderBy?._sum?.quantity) {
        pipeline.push({ $sort: { quantity: orderBy._sum.quantity === "desc" ? -1 : 1 } });
      }
      if (take) {
        pipeline.push({ $limit: Number(take) });
      }
      const res = await models.Order.aggregate(pipeline);
      return res.map(r => ({
        product_id: r._id.product_id?.toString(),
        product_name: r._id.product_name,
        _sum: {
          quantity: r.quantity || 0,
          subtotal: r.subtotal || 0
        }
      }));
    }
  },
  order_history: createModelDelegate(models.Order),
  payments: createModelDelegate(models.Payment),

  // reviews with user population
  reviews: {
    ...createModelDelegate(models.Review),
    async findMany({ where, include, select, orderBy, skip, take } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = models.Review.find(filter);
      const sort = toMongoSort(orderBy);
      if (sort) query = query.sort(sort);
      if (skip) query = query.skip(Number(skip));
      if (take) query = query.limit(Number(take));
      const docs = await query.exec();
      const results = formatResult(docs);
      if (include?.users || select?.users) {
        const userIds = [...new Set(results.map(r => r.user_id).filter(Boolean))];
        const users = await models.User.find({ _id: { $in: userIds } }).select("name email").exec();
        const userMap = {};
        for (const u of users) { userMap[u._id.toString()] = formatResult(u); }
        for (const r of results) {
          r.users = r.user_id ? (userMap[r.user_id.toString()] || null) : null;
        }
      }
      return results;
    }
  },

  coupons: createModelDelegate(models.Coupon),
  site_settings: createModelDelegate(models.SiteSetting),
  services: createModelDelegate(models.Service),
  team_members: createModelDelegate(models.TeamMember),
  testimonials: createModelDelegate(models.Testimonial),
  notifications: createModelDelegate(models.Notification),

  product_variants: {
    async count({ where } = {}) {
      await connectDB();
      const pipeline = [
        { $unwind: "$product_variants" }
      ];
      if (where?.stock !== undefined) {
        const cond = {};
        if (typeof where.stock === "number") cond.$eq = where.stock;
        if (where.stock.lt !== undefined) cond.$lt = where.stock.lt;
        if (where.stock.lte !== undefined) cond.$lte = where.stock.lte;
        if (where.stock.gt !== undefined) cond.$gt = where.stock.gt;
        if (where.stock.gte !== undefined) cond.$gte = where.stock.gte;
        pipeline.push({ $match: { "product_variants.stock": cond } });
      }
      pipeline.push({ $count: "total" });
      const res = await models.Product.aggregate(pipeline);
      return res[0]?.total || 0;
    },

    async findMany({ where, include, orderBy } = {}) {
      await connectDB();
      const pipeline = [
        { $unwind: "$product_variants" }
      ];
      if (where?.stock !== undefined) {
        const cond = {};
        if (typeof where.stock === "number") cond.$eq = where.stock;
        if (where.stock.lt !== undefined) cond.$lt = where.stock.lt;
        if (where.stock.lte !== undefined) cond.$lte = where.stock.lte;
        if (where.stock.gt !== undefined) cond.$gt = where.stock.gt;
        if (where.stock.gte !== undefined) cond.$gte = where.stock.gte;
        pipeline.push({ $match: { "product_variants.stock": cond } });
      }
      if (orderBy?.stock) {
        pipeline.push({ $sort: { "product_variants.stock": orderBy.stock === "desc" ? -1 : 1 } });
      }
      pipeline.push({
        $project: {
          _id: "$product_variants._id",
          label: "$product_variants.label",
          attribute_name: "$product_variants.attribute_name",
          attribute_value: "$product_variants.attribute_value",
          price: "$product_variants.price",
          wholesale_price: "$product_variants.wholesale_price",
          stock: "$product_variants.stock",
          sort_order: "$product_variants.sort_order",
          product_id: "$_id",
          product_name: "$name"
        }
      });
      const res = await models.Product.aggregate(pipeline);
      return res.map(doc => ({
        id: doc._id?.toString(),
        label: doc.label,
        attribute_name: doc.attribute_name,
        attribute_value: doc.attribute_value,
        price: doc.price,
        wholesale_price: doc.wholesale_price,
        stock: doc.stock,
        sort_order: doc.sort_order,
        product_id: doc.product_id?.toString(),
        products: {
          name: doc.product_name
        }
      }));
    },

    async findFirst({ where } = {}) {
      await connectDB();
      if (!where) return null;
      const productFilter = {};
      if (where.product_id) {
        productFilter._id = mongoose.Types.ObjectId.isValid(where.product_id)
          ? new mongoose.Types.ObjectId(where.product_id)
          : where.product_id;
      }
      const product = await models.Product.findOne(productFilter);
      if (!product) return null;
      return product.product_variants.find(v =>
        (!where.label || v.label === where.label) &&
        (!where.id || v._id.toString() === where.id)
      ) || null;
    },
    async update({ where, data } = {}) {
      await connectDB();
      await models.Product.updateOne(
        { "product_variants._id": where.id },
        { $set: { "product_variants.$": data } }
      );
      return data;
    },
    async create({ data } = {}) {
      await connectDB();
      const pid = data.product_id;
      const { product_id, ...variantData } = data;
      await models.Product.updateOne(
        { _id: mongoose.Types.ObjectId.isValid(pid) ? new mongoose.Types.ObjectId(pid) : pid },
        { $push: { product_variants: variantData } }
      );
      return data;
    },
    async deleteMany({ where } = {}) {
      await connectDB();
      if (!where?.product_id) return { count: 0 };
      const pid = where.product_id;
      const excludeIds = where.id?.notIn || [];
      const filter = { _id: mongoose.Types.ObjectId.isValid(pid) ? new mongoose.Types.ObjectId(pid) : pid };
      const product = await models.Product.findOne(filter);
      if (!product) return { count: 0 };
      const before = product.product_variants.length;
      if (excludeIds.length > 0) {
        product.product_variants = product.product_variants.filter(v =>
          excludeIds.includes(v._id.toString())
        );
      } else {
        product.product_variants = [];
      }
      await product.save();
      return { count: before - product.product_variants.length };
    }
  },

  models,
  mongoose,

  async $transaction(arg) {
    if (typeof arg === "function") {
      return arg(db);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg;
  },

  async $runCommandRaw(cmd) {
    await connectDB();
    return mongoose.connection.db.command(cmd);
  },

  async $connect() {
    return connectDB();
  },

  async $disconnect() {
    return mongoose.disconnect();
  }
};

module.exports = db;
