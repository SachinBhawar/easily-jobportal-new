import { body, validationResult } from "express-validator";

const validateJobDetails = async (req, res, next) => {
  // console.log(req.body);
  const routePath = req.path;
  const viewName = routePath.substring(1) + "-form";
  // 1. Setup rules for validation.
  const rules = [
    // Validate email
    body("company").notEmpty().withMessage("Please enter company name"),
    body("type").notEmpty().withMessage("Please select company type"),
    body("salary").notEmpty().withMessage("Please enter salary"),
    body("designation").notEmpty().withMessage("Please select designation from dropdown menu"),
    body("vacancies").notEmpty().withMessage("Please enter no of Vacancies for this Job"),
    body("location").notEmpty().withMessage("Please enter Job Location"),
    body("skills").notEmpty().withMessage("Please enter Skills required saperated by comma"),
    body("experience").notEmpty().withMessage("Please enter Experience required for this job."),
  ];

  // 2. run those rules.
  await Promise.all(rules.map((rule) => rule.run(req)));

  // 3. check if there are any errors after running the rules.
  var validationErrors = validationResult(req);
  // console.log(validationErrors);
  // 4. if errros, return the error message
  if (!validationErrors.isEmpty()) {
    console.log(viewName);
    return res.render(`${viewName}`, {
      job: jobToUpdate,
      message: validationErrors.array()[0].msg,
      role: "recruiter",
      userName: req.session.user.name,
      userEmail: req.session.userEmail,
    });
  }
  next();
};

export default validateJobDetails;
