/**
 * MongoDB Atlas Client & Connection Manager.
 * Native Mongoose implementation for Karakurum Silkrute Traders.
 */
const { connectDB, mongoose } = require("./db");
const models = require("../models");

// Helper to convert queries to MongoDB filter
function toMongoFilter(where = {}) {
  if (!where || typeof where !== "object") return {};
  const filter = {};

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === "id" || key === "_id") {
      if (val && typeof val === "object") {
        if (val.in && Array.isArray(val.in)) {
          filter._id = { $in: val.in.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id) };
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
      filter[key] = fieldCond;
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

function createModelDelegate(Model) {
  return {
    model: Model,

    async findUnique({ where, include, select } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = Model.findOne(filter);
      if (select) query = query.select(Object.keys(select).join(" "));
      const doc = await query.exec();
      return formatResult(doc);
    },

    async findFirst({ where, include, select, orderBy } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = Model.findOne(filter);
      if (orderBy) {
        const sort = {};
        if (Array.isArray(orderBy)) {
          orderBy.forEach((o) => {
            const [k, dir] = Object.entries(o)[0];
            sort[k] = dir === "desc" ? -1 : 1;
          });
        } else {
          for (const [k, dir] of Object.entries(orderBy)) {
            sort[k] = dir === "desc" ? -1 : 1;
          }
        }
        query = query.sort(sort);
      }
      if (select) query = query.select(Object.keys(select).join(" "));
      const doc = await query.exec();
      return formatResult(doc);
    },

    async findMany({ where, include, select, orderBy, skip, take } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      let query = Model.find(filter);
      if (orderBy) {
        const sort = {};
        if (Array.isArray(orderBy)) {
          orderBy.forEach((o) => {
            const [k, dir] = Object.entries(o)[0];
            sort[k] = dir === "desc" ? -1 : 1;
          });
        } else {
          for (const [k, dir] of Object.entries(orderBy)) {
            sort[k] = dir === "desc" ? -1 : 1;
          }
        }
        query = query.sort(sort);
      }
      if (skip) query = query.skip(Number(skip));
      if (take) query = query.limit(Number(take));
      if (select) query = query.select(Object.keys(select).join(" "));
      const docs = await query.exec();
      return formatResult(docs);
    },

    async create({ data } = {}) {
      await connectDB();
      const doc = await Model.create(data);
      return formatResult(doc);
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
      const filter = toMongoFilter(where);
      const res = await Model.deleteMany(filter);
      return { count: res.deletedCount };
    },

    async count({ where } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
      return Model.countDocuments(filter);
    },

    async aggregate({ where, _avg, _count, _sum } = {}) {
      await connectDB();
      const filter = toMongoFilter(where);
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
        _avg: _avg ? Object.keys(_avg).reduce((acc, k) => ({ ...acc, [k]: first[`avg_${k}`] || 0 }), {}) : {},
        _count: _count ? { id: first.count_id || 0 } : {},
        _sum: _sum ? Object.keys(_sum).reduce((acc, k) => ({ ...acc, [k]: first[`sum_${k}`] || 0 }), {}) : {}
      };
    }
  };
}

// Map MongoDB models to database collections
const db = {
  users: createModelDelegate(models.User),
  addresses: createModelDelegate(models.Address),
  categories: createModelDelegate(models.Category),
  products: createModelDelegate(models.Product),
  cart_items: createModelDelegate(models.CartItem),
  orders: createModelDelegate(models.Order),
  order_items: {
    ...createModelDelegate(models.Order),
    async groupBy({ by, where } = {}) {
      await connectDB();
      return [];
    }
  },
  order_history: createModelDelegate(models.Order),
  payments: createModelDelegate(models.Payment),
  reviews: createModelDelegate(models.Review),
  coupons: createModelDelegate(models.Coupon),
  site_settings: createModelDelegate(models.SiteSetting),
  services: createModelDelegate(models.Service),
  team_members: createModelDelegate(models.TeamMember),
  testimonials: createModelDelegate(models.Testimonial),
  notifications: createModelDelegate(models.Notification),
  product_variants: {
    async findFirst({ where } = {}) {
      await connectDB();
      const product = await models.Product.findOne({ "product_variants.label": where?.label });
      if (!product) return null;
      return product.product_variants.find(v => v.label === where.label) || null;
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
      await models.Product.updateOne(
        { _id: data.product_id },
        { $push: { product_variants: data } }
      );
      return data;
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
