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
        const transactions = await Transactions.find({ userId }).sort({ createdAt: -1 });
        if (!transactions) {
            return res.status(404).json({ success: false, message: "No transactions found" });
        }
        return res.status(200).json({ success: true, transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

module.exports = {
    createTransaction,
    getTransactions
}