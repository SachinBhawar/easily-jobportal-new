import { body, validationResult } from "express-validator";

const validateRequest = async (req, res, next) => {
    // console.log(req.body);
    const routePath = req.path;
    const viewName = routePath.substring(1);
    // 1. Setup rules for validation.
    const rules = [
        // Validate email
        body("email").optional().isEmail().withMessage("Please enter a valid email."),
        // Validate password with specific requirements
        body("password")
            .optional()
            .isString()
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters long.")
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, "i")
            .withMessage(
                "Password must contain at least one lowercase letter, one uppercase letter, and one number."
            ),
        // Validate name with minimum length requirement
        body("name").optional().isLength({ min: 3 }).withMessage("Name must be at least 3 characters long."),
        body("service").optional().notEmpty().withMessage("Please enter Serive name for sendin email"),
        body("Password").optional().notEmpty().withMessage("Please enter Password for sendin email"),
        body("senderEmail").optional().isEmail().withMessage("Please enter sender Email"),
        body("education").optional().notEmpty().withMessage("Please enter education"),
        body("salary").optional().notEmpty().withMessage("Please enter salary"),
        body("experience").optional().notEmpty().withMessage("Please enter experience"),
        body("location").optional().notEmpty().withMessage("Please enter location"),
        body("skills").optional().notEmpty().withMessage("Please enter skills"),
        body("receiverEmail").optional().isEmail().withMessage("Please enter receiver Email"),
        body("service").optional().notEmpty().withMessage("Please enter Serive name for sendin email"),
        body("phone").optional().isNumeric().withMessage("Phone must be a number"),

        body("resume")
            .optional()
            .custom((value, { req }) => {
                if (!req.file) {
                    throw new Error("resume is required");
                }
                return true;
            }),
    ];

    // 2. run those rules.
    await Promise.all(rules.map((rule) => rule.run(req)));

    // 3. check if there are any errors after running the rules.
    var validationErrors = validationResult(req);
    // console.log(validationErrors);
    // 4. if errros, return the error message
    if (!validationErrors.isEmpty()) {
        console.log(validationErrors);
        return res.render(viewName, {
            message: validationErrors.array()[0].msg,
            role: null,
            userName: null,
            userEmail: null,
        });
    }
    console.log("Validation Passed");
    next();
};

export default validateRequest;
