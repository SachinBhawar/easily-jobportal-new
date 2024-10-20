export const authRec = (req, res, next) => {
    // console.log();
    if (req.session.user.email == req.session.userEmail && req.session.user.role == "Recruiter") {
        next();
    } else {
        res.render("recruiter-login", {
            message: "Login as Recruiter is required...",
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: null,
        });
    }
};
