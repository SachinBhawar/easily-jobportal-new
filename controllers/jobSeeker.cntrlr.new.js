import JobSeeker from "../model/jobS.model.new.js";
import Recruiter, { JobModel } from "../model/rec.model.new.js";
import { formatDate } from "../utils/dateFormat.js";

import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

export default class JobSeekerController {
    renderJobSeekerRegistrationPage(req, res) {
        res.render("user-register", {
            message: null,
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: formatDate(req.session.lastVisit),
        });
    }

    renderJobSeekerLoginPage(req, res) {
        res.render("user-login", {
            message: null,
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: null,
        });
    }

    async getJobSeekerRegistration(req, res) {
        const status = await JobSeeker.isValidJobSeeker(req.body);

        if (status) {
            return res.render("user-register", {
                message: "OOP's This Email is already registered....\nPlease try again.",
                role: null,
                userName: null,
                userEmail: null,
                lastVisit: null,
            });
        }
        await JobSeeker.addJobSeeker(req.body);
        return res.render("user-login", {
            message: "Registration successful. Now you can login.",
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: req.cookies.lastVisit || null,
        });
    }

    async isProfileUpdated(req, res, next) {
        const jobseekerEmail = req.session.userEmail;
        const jobSeeker = await JobSeeker.searchJobSeekerByEmail(jobseekerEmail);

        if (jobSeeker.profile.resume) {
            return next();
        }

        res.render("update-profile", {
            message: "Please update profile before Applying to the job.",
            role: "jobseeker",
            userName: req.session.user.name,
            userEmail: req.session.userEmail,
            lastVisit: formatDate(req.session.lastVisit),
        });
    }

    renderUpdateProfilePage(req, res) {
        res.render("update-profile", {
            message: null,
            role: "jobseeker",
            userName: req.session.user.name,
            userEmail: req.session.userEmail,
            lastVisit: formatDate(req.session.lastVisit),
        });
    }

    async updateProfile(req, res) {
        try {
            const { name, email, phone, gender, education, experience, skills } = req.body;

            // Check if file exists
            if (!req.file) {
                return res.status(400).send("Resume PDF file is required.");
            }

            // Read the file (assumes the file is uploaded using multer)
            const resumePath = req.file.path;
            const resumeData = fs.readFileSync(resumePath);

            // Create profile object
            const profileData = {
                name,
                email,
                phone,
                gender,
                education,
                experience,
                skills: skills ? skills.split(",").filter((skill) => skill !== " ") : [],
                resume: resumeData,
            };

            // Call the model method to store profile data with the PDF
            await JobSeeker.updateProfile(req.session.userEmail, profileData);
            const allJobs = await JobSeeker.getAllJobs();
            return res.render("all-jobs", {
                allJobs,
                message: `Profile Updated for ${req.session.user.name} successfully.`,
                role: "JobSeeker",
                userName: req.session.user.name,
                userEmail: req.session.userEmail,
                lastVisit: formatDate(req.session.lastVisit),
                appliedJobList: req.session.user.jobsApplied,
            });
        } catch (error) {
            console.error("Error uploading profile:", error);
            res.status(500).send("Error uploading profile.");
        }
    }

    renderSendEmailNotification(req, res) {
        const recruiterEmail = req.params.recruiterEmail;
        res.render("send-email", {
            message: null,
            role: "jobseeker",
            userName: req.session.user.name,
            userEmail: req.session.userEmail,
            lastVisit: formatDate(req.session.lastVisit),
            recruiterEmail,
        });
    }

    async applyJob(req, res) {
        try {
            const jobId = req.params.id;

            if (!req.session.userEmail || req.session.user.role.toLowerCase() !== "jobseeker") {
                return res.render("user-login", { message: "Login as Job Seeker to apply.", role: null });
            }

            const jobSeekerEmail = req.session.userEmail;
            const response = await JobSeeker.applyJob(jobId, jobSeekerEmail);
            const allJobs = await JobSeeker.getAllJobs();

            const options = {
                message: response.result === true ? "Job applied successfully." : response.message,
                role: "JobSeeker",
                userName: req.session.user.name,
                userEmail: jobSeekerEmail,
                lastVisit: formatDate(req.session.lastVisit),
                appliedJobList: response.jobsApplied,
            };

            if (response === "profile not updated") {
                return res.render("update-profile", options);
            }

            return res.render("all-jobs", { ...options, allJobs, path: req.path });
        } catch (error) {
            console.error("Error applying for job:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    async postEmailNotification(req, res) {
        const recuiter_email = req.params.recruiterEmail;
        const { senderEmail, subject, body } = req.body;
        console.log("rec em,senderEmail", recuiter_email, senderEmail, subject, body);

        try {
            await JobSeeker.sendEmailNotification(recuiter_email, senderEmail, subject, body);
            return res.redirect("/all-jobs");
        } catch (error) {
            res.render("error", { message: "Failed to send email notification" });
        }
    }

    async viewAppliedJobs(req, res) {
        const jobs = await JobSeeker.getAllJobsAppliedByJobSeeker(req.session.userEmail);

        const arr = req.session.user.jobsApplied;

        return res.render("all-jobs", {
            allJobs: jobs,
            message: `Showing all jobs applied by ${req.session.user.name}.`,
            role: "JobSeeker",
            userName: req.session.user.name,
            userEmail: req.session.userEmail,
            lastVisit: formatDate(req.session.lastVisit),
            appliedJobList: arr,
            path: req.path,
        });
    }

    async loginJobSeeker(req, res) {
        const { email, password } = req.body;
        const user = await JobSeeker.isRegisteredJobSeeker(email, password);

        if (!user) {
            return res.render("user-login", {
                message: "Invalid Credentials",
                role: null,
                userName: null,
                userEmail: null,
                lastVisit: null,
            });
        }
        req.session.user = user;
        req.session.userEmail = email;
        req.session.lastVisit = user.lastVisit;
        // console.log(formatDate(req.session.lastVisit));
        await JobSeeker.updateLastVisit(email);

        const allJobs = await JobSeeker.getAllJobs();
        return res.render("all-jobs", {
            allJobs,
            message: "Login Successful",
            role: "JobSeeker",
            userName: req.session.user.name,
            userEmail: email,
            lastVisit: formatDate(req.session.lastVisit),
            appliedJobList: req.session.user.jobsApplied,
            path: req.path,
        });
    }

    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error(err);
                return res.render("error", { message: "Failed to logout" });
            }
            res.redirect("/user-login");
        });
    }

    // Helper methods
    renderJobSeekerRegistrationPageWithError(req, res, message) {
        res.render("user-register", {
            message,
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: formatDate(req.session.lastVisit),
        });
    }

    renderJobSeekerLoginPageWithMessage(req, res, message) {
        res.render("user-login", {
            message,
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: formatDate(req.session.lastVisit),
        });
    }
}
