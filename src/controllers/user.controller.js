const User = require("../models/user.js");

const register = async (req, res) => {
    const { name, password, email, phone, } = req.body;
    console.log(req.body);

    const user = await User.create({
        name: name,
        email: email,
        password: password,
        phone: phone,
    });

    console.log("user created");

    return res.json({
        message: "user created successfully"
    });
};

module.exports = register;
