import cookieParser from "cookie-parser";
import moment from "moment-timezone";

const trackLastVisit = (req, res, next) => {
  // Check if the user has a lastVisit cookie
  if (req.cookies.lastVisit) {
    // Retrieve the last visit timestamp from the cookie

    const unformateddate = new Date(req.cookies.lastVisit);
    const lastVisit = moment(unformateddate).tz("Asia/Kolkata").format("Do MMM,YYYY h:mma");

    console.log(`Welcome back! Your last visit was at ${lastVisit}`);
  } else {
    console.log("Welcome! It seems like your first visit.");
  }

  // Set a new lastVisit cookie with the current timestamp
  res.cookie("lastVisit", moment(new Date()).tz("Asia/Kolkata").format("Do MMM,YYYY h:mma"), {
    maxAge: 900000,
    httpOnly: true,
  }); // Expiry after 15 minutes

  next();
};

export default trackLastVisit;
