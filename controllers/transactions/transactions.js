const Transactions = require("../../models/Transactions")
const User = require("../../models/User")

const createTransaction = async(req,res) =>{
    try {
        const {userId,type,amount} = req.body;

        if(!userId || !type || !amount){
            return res.status(400).json({success:false,message:"All fields are required"});
        }

        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({success:false,message:"User not found"});
        }
        if(type === "ADD_FUNDS"){
            const transaction = new Transactions({
                userId,
                type,
                amount,
                note: "Funds added to wallet"
            });
            await transaction.save();
            return res.status(201).json({success:true,message:"Funds added successfully",transaction});
        }else if(type === "WITHDRAW"){
            if(user.balance < amount){
                return res.status(400).json({success:false,message:"Insufficient balance"});
            }
            user.balance -= amount;
            await user.save();
            const transaction = new Transactions({
                userId,
                type,
                amount,
                note: "Funds withdrawn from wallet"
            });
            await transaction.save();
            return res.status(201).json({success:true,message:"Funds withdrawn successfully",transaction});
        }
        else if(type === "ADJUSTMENT"){
            const transaction = new Transactions({
                userId,
                type,
                amount,
                note: "Wallet balance adjusted"
            });
            await transaction.save();
            return res.status(201).json({success:true,message:"Wallet balance adjusted successfully",transaction});
        }
        return res.status(400).json({success:false,message:"Invalid transaction type"});

    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const getTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { cursor, limit = 20 } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Validate limit to prevent excessive data requests
        const pageLimit = Math.min(parseInt(limit), 100); // Max 100 records per request

        // Build query with cursor for pagination
        let query = { userId };
        
        // If cursor is provided, fetch records older than the cursor (for descending order)
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        const transactions = await Transactions.find(query)
            .sort({ createdAt: -1 }) // Most recent first
            .limit(pageLimit + 1); // Fetch one extra to check if there are more records

        // Check if there are more records
        const hasNextPage = transactions.length > pageLimit;
        
        // Remove the extra record if it exists
        if (hasNextPage) {
            transactions.pop();
        }

        // Get the next cursor (createdAt of the last record)
        const nextCursor = transactions.length > 0 ? transactions[transactions.length - 1].createdAt.toISOString() : null;

        return res.status(200).json({
            success: true,
            transactions,
            pagination: {
                hasNextPage,
                nextCursor,
                limit: pageLimit,
                count: transactions.length
            }
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

module.exports = {
    createTransaction,
    getTransactions
}