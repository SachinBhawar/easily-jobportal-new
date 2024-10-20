import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import ejsLayouts from "express-ejs-layouts";
import session from "express-session";

import { auth } from "./middlewares/auth.middleware.js";
import { authRec } from "./middlewares/auth.recruiter.middleware.js";
import validateRequest from "./middlewares/validation.middleware.js";
import trackLastVisit from "./middlewares/trackLastVisit.middleware.js";
import validateJobDetails from "./middlewares/validate.jobdetails.middleware.js";
import { uploadFile } from "./middlewares/file-upload.middleware.js";
import RecuiterController from "./controllers/rec.cntrlr.new.js";
import JobSeekerController from "./controllers/jobSeeker.cntrlr.new.js";
//rest object
const app = express();

app.use(express.static("./public"));
app.use(ejsLayouts);

// configure ejs view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// setting-up ejs layout it should be after ejs view engine configured

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// setting up express session
app.use(
    session({
        secret: "SecretKey",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

// Apply the trackLastVisit middleware to all routes
app.use(cookieParser());

app.use(trackLastVisit);

const Recruiter = new RecuiterController();
const JobSeeker = new JobSeekerController();

app.get("/", Recruiter.renderFrontPage);
app.get("/home", Recruiter.renderHomePage);

app.get("/recruiter-register", Recruiter.renderRegistrationPage);
app.post("/recruiter-register", validateRequest, Recruiter.getRegistration);
app.get("/recruiter-login", Recruiter.renderLoginPage);
app.post("/recruiter-login", Recruiter.loginRecruiter);

app.get("/user-register", JobSeeker.renderJobSeekerRegistrationPage);
app.post("/user-register", validateRequest, JobSeeker.getJobSeekerRegistration);
app.get("/user-login", JobSeeker.renderJobSeekerLoginPage);
app.post("/user-login", JobSeeker.loginJobSeeker);

app.get("/create-new-job", authRec, Recruiter.renderCreateJobPage);
app.post("/create-new-job", authRec, validateJobDetails, Recruiter.addNewJob);

app.get("/update-job/:id", authRec, Recruiter.renderUpdateJobPage);
app.post("/update-job", authRec, validateRequest, Recruiter.updateJob);

app.get("/delete-job/:id", authRec, Recruiter.deleteJob);
// app.post("/update-job", authRec, Recruiter.deleteJob);

app.get("/all-jobs", Recruiter.renderAllJobsPage);

app.get("/applied-jobs", auth, JobSeeker.viewAppliedJobs);
app.get("/applicants", authRec, Recruiter.viewApplicants);

app.get("/logout", Recruiter.logout);
app.get("/logout", JobSeeker.logout);

app.get("/apply-job/:id", auth, JobSeeker.isProfileUpdated, JobSeeker.applyJob);

app.get("/update-profile", auth, JobSeeker.renderUpdateProfilePage);
app.post("/update-profile", auth, uploadFile.single("resume"), validateRequest, JobSeeker.updateProfile);

app.get("/send-emailnotification/:recruiterEmail", auth, JobSeeker.renderSendEmailNotification);
app.post("/send-emailnotification/:recruiterEmail", auth, validateRequest, JobSeeker.postEmailNotification);

// app.post("/apply-job/:id", JobSeeker.applyJob);

export default app;
