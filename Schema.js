const mongoose = require("mongoose")
const userdata = new mongoose.Schema(
    {
        phone : String,
        pass : String,
        name : String,
        age : Number,
       
    }
)



const User = mongoose.model("User", userdata);


module.exports = {User};
