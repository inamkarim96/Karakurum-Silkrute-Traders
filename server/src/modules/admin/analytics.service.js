const prisma = require("../../config/mongo");
const cache = require("../../utils/cache");

async function getOverview() {
  return cache.getOrSet("analytics:overview", 60, async () => {
    // Parallelize all 4 aggregate queries instead of running them sequentially
    const [revenueAndOrders, totalCustomers, pendingOrders, lowStockProducts] = await Promise.all([
      prisma.orders.aggregate({
        where: { NOT: { status: "cancelled" } },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true }
      }),
      prisma.users.count({
        where: { role: "customer" }
      }),
      prisma.orders.count({
        where: { status: { in: ["pending", "processing"] } }
      }),
      prisma.product_variants.count({
        where: { stock: { lt: 10 } }
      })
    ]);

    return {
      total_revenue: parseFloat(revenueAndOrders._sum.total || 0).toFixed(2),
      total_orders: revenueAndOrders._count.id,
      total_customers: totalCustomers,
      avg_order_value: parseFloat(revenueAndOrders._avg.total || 0).toFixed(2),
      pending_orders: pendingOrders,
      low_stock_products: lowStockProducts,
    };
  });
}

async function getRevenueAnalytics(period = "daily", dateFrom, dateTo) {
  const cacheKey = `analytics:revenue:${period}:${dateFrom || "all"}:${dateTo || "all"}`;
  
  return cache.getOrSet(cacheKey, 120, async () => {
    let datePart;
    switch (period) {
      case "weekly":
        datePart = "week";
        break;
      case "monthly":
        datePart = "month";
        break;
      default:
        datePart = "day";
    }

    const whereClause = {
      status: { not: "cancelled" }
    };
    if (dateFrom || dateTo) {
      whereClause.created_at = {};
      if (dateFrom) whereClause.created_at.gte = new Date(dateFrom);
      if (dateTo) whereClause.created_at.lte = new Date(dateTo);
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      select: { created_at: true, total: true },
      orderBy: { created_at: "asc" }
    });

    const groups = new Map();
    for (const order of orders) {
      const d = new Date(order.created_at);
      let key;
      if (datePart === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      } else if (datePart === "week") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = startOfWeek.toISOString().slice(0, 10);
      } else {
        key = d.toISOString().slice(0, 10);
      }

      if (!groups.has(key)) {
        groups.set(key, { period_label: key, revenue: 0, order_count: 0 });
      }
      const g = groups.get(key);
      g.revenue += Number(order.total || 0);
      g.order_count += 1;
    }

    return Array.from(groups.values()).map(row => ({
      period_label: row.period_label,
      revenue: row.revenue.toFixed(2),
      order_count: row.order_count
    }));
  });
}

async function getTopProducts() {
  return cache.getOrSet("analytics:top_products", 120, async () => {
    const result = await prisma.order_items.groupBy({
      by: ["product_id", "product_name"],
      where: {
        orders: {
          status: { not: "cancelled" }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: 10
    });

    return result.map(r => ({
      name: r.product_name,
      total_quantity_sold: r._sum.quantity,
      total_revenue: parseFloat(r._sum.subtotal || 0).toFixed(2)
    }));
  });
}

async function getInventoryAnalytics() {
  return cache.getOrSet("analytics:inventory", 60, async () => {
    return prisma.product_variants.findMany({
      where: { stock: { lt: 10 } },
      include: { products: { select: { name: true } } },
      orderBy: { stock: "asc" }
    }).then(items => items.map(wv => ({
      product_name: wv.products.name,
      variant_label: wv.label,
      stock: wv.stock
    })));
  });
}

module.exports = {
  getOverview,
  getRevenueAnalytics,
  getTopProducts,
  getInventoryAnalytics,
};
