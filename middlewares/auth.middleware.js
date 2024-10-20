export const auth = (req, res, next) => {
    console.log(req.session);
    if (req.session.userEmail && req.session.user.role.toLowerCase() == "jobseeker") {
        next();
    } else {
        res.render("user-login", {
            message: "Login is required...",
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: null,
        });
    }
};
