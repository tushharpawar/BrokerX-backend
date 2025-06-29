const Order = require("../../models/Orders");

const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cursor, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Validate limit to prevent excessive data requests
    const pageLimit = Math.min(parseInt(limit), 100); 
    // Build query with cursor for pagination
    let query = { userId };
    
    // If cursor is provided, fetch records older than the cursor (for descending order)
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .limit(pageLimit + 1); // Fetch one extra to check if there are more records

    // Check if there are more records
    const hasNextPage = orders.length > pageLimit;
    
    // Remove the extra record if it exists
    if (hasNextPage) {
      orders.pop();
    }

    // Get the next cursor (createdAt of the last record)
    const nextCursor = orders.length > 0 ? orders[orders.length - 1].createdAt.toISOString() : null;

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        hasNextPage,
        nextCursor,
        limit: pageLimit,
        count: orders.length
      }
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = getUserOrders;
