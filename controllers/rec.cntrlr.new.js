import Recruiter from "../model/rec.model.new.js";
import { formatDate } from "../utils/dateFormat.js";

export default class RecruiterController {
    async renderHomePage(req, res) {
        try {
            const allJobs = await Recruiter.getAllJobs();
            const user = req.session && req.session.user ? req.session.user : {};
            const message = user.name ? `Welcome, ${user.name}` : "Welcome to easily Job Portal.";
            const lastVisit = req.cookies.lastVisit || null;
            // console.log(user);
            return res.render("all-jobs", {
                allJobs,
                message,
                role: user.role || null,
                userName: user.name || null,
                userEmail: user.email || null,
                lastVisit: lastVisit,
                appliedJobList: user.jobsApplied || [],
                path: req.path,
            });
        } catch (error) {
            console.error("Error rendering home page:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    renderFrontPage(req, res) {
        const user = req.session.user || {};
        const message = user.name ? `Welcome, ${user.name}` : null;
        const lastvisit = req.cookies.lastVisit || null;

        return res.render("front-page.ejs", {
            message: null,
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: lastvisit,
        });
    }

    renderRegistrationPage(req, res) {
        const lastvisit = req.cookies.lastVisit || null;
        return res.render("recruiter-register", {
            message: null,
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: lastvisit,
        });
    }

    renderLoginPage(req, res) {
        const lastvisit = req.cookies.lastVisit || null;
        return res.render("recruiter-login", {
            message: null,
            role: null,
            userName: null,
            userEmail: null,
            lastVisit: lastvisit || null,
        });
    }

    async viewApplicants(req, res) {
        try {
            // const recruitingPerson = await Recruiter.searchRecruiterByEmail(req.session.userEmail);
            // const applicants = await Recruiter.getAllApplicants(recruitingPerson);
            const applicants = await Recruiter.getRecruiterApplicants(req.session.userEmail);

            return res.render("all-jobseekers", {
                jobs: applicants,
                message: "Displaying all Applicants to the Jobs you have posted....",
                role: "recruiter",
                userName: req.session.user.name,
                userEmail: req.session.userEmail,
                lastVisit: formatDate(req.session.lastVisit),
            });
        } catch (error) {
            console.error("Error retrieving applicants:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    async addNewJob(req, res) {
        const { company, type, designation, salary, location, vacancies, experience, skills, description } =
            req.body;

        try {
            const employer = await Recruiter.searchRecruiterByEmail(req.session.userEmail);
            await Recruiter.addNewJob(
                { company, type, designation, salary, location, vacancies, experience, skills, description },
                employer.email
            );
            const allJobs = await Recruiter.getAllJobs();

            return res.render("all-jobs", {
                allJobs,
                message: "Job successfully added.",
                role: req.session.user.role,
                userName: req.session.user.name,
                userEmail: req.session.userEmail,
                lastVisit: formatDate(req.session.lastVisit),
                appliedJobList: [],
                path: req.path,
            });
        } catch (err) {
            console.log("Controller Method addNewJob Failed...", err);
            res.status(500).send("Internal Server Error");
        }
    }

    async deleteJob(req, res) {
        const jobId = req.params.id;
        try {
            const result = await Recruiter.deleteJob(jobId, req.session.userEmail);
            const allJobs = await Recruiter.getAllJobs();
            const message = result.success
                ? "The Job has been Successfully Deleted..."
                : "The Job you want to delete not found in the record...";

            return res.render("all-jobs", {
                allJobs,
                message,
                role: "recruiter",
                userName: req.session.user.name,
                userEmail: req.session.userEmail,
                lastVisit: formatDate(req.session.lastVisit),
                appliedJobList: [],
                path: req.path,
            });
        } catch (error) {
            console.error("Error deleting job:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    async renderUpdateJobPage(req, res) {
        try {
            const jobId = req.params.id;
            const recruiter = await Recruiter.searchRecruiterByEmail(req.session.userEmail);
            const jobToUpdate = await Recruiter.searchJobById(jobId, recruiter);

            return res.render("update-job-form", {
                job: jobToUpdate,
                message: null,
                role: "recruiter",
                userName: req.session.user.name,
                userEmail: req.session.userEmail,
                lastVisit: formatDate(req.session.lastVisit),
            });
        } catch (error) {
            console.error("Error rendering update job page:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    async updateJob(req, res) {
        const updatedJob = req.body;
        try {
            const jobOwner = await Recruiter.searchRecruiterByEmail(req.session.userEmail);
            await Recruiter.updateJob(updatedJob, jobOwner);
            const allJobs = await Recruiter.getAllJobs();

            return res.render("all-jobs", {
                allJobs,
                message: `${updatedJob.company}'s Job has been Successfully Updated...`,
                role: "recruiter",
                userName: req.session.user.name,
                userEmail: req.session.userEmail,
                lastVisit: formatDate(req.session.lastVisit),
                appliedJobList: [],
                path: req.path,
            });
        } catch (error) {
            console.error("Error updating job:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    renderCreateJobPage(req, res) {
        return res.render("create-job-form", {
            role: "recruiter",
            message: null,
            userName: req.session.user.name,
            userEmail: req.session.userEmail,
            lastVisit: formatDate(req.session.lastVisit),
        });
    }

    async getRegistration(req, res) {
        const status = await Recruiter.isValidRecruiter(req.body);

        if (status) {
            return res.render("recruiter-register", {
                message:
                    "OOP's This Email is already registered....\nClick on the Register button to try again.",
                role: null,
                userName: null,
                userEmail: null,
                lastVisit: null,
            });
        } else {
            await Recruiter.addRecruiter(req.body);
            return res.render("recruiter-login", {
                message: "Registration successful....\nNow you can login.",
                role: null,
                userName: null,
                userEmail: null,
                lastVisit: null,
            });
        }
    }

    async renderAllJobsPage(req, res) {
        const allJobs = await Recruiter.getAllJobs();
        const user = await Recruiter.searchRecruiterByEmail(req.session.userEmail);

        return res.render("all-jobs", {
            allJobs,
            message: null,
            role: user ? user.role : null,
            userName: user ? user.name : null,
            userEmail: req.session.userEmail,
            lastVisit: formatDate(req.session.lastVisit),
            appliedJobList: [],
            path: req.path,
        });
    }

    async loginRecruiter(req, res) {
        const { email, password } = req.body;

        const user = await Recruiter.isRegisteredRecruiter(email, password);

        if (!user) {
            return res.render("recruiter-login", {
                message: "Invalid Credentials",
                role: "recruiter",
                userName: null,
                userEmail: null,
                lastVisit: null,
            });
        } else {
            req.session.lastVisit = user.lastVisit;
            // console.log(req.session.lastVisit.toDateString());
            req.session.userEmail = email;
            req.session.user = user;

            await Recruiter.updateLastVisit(email);

            const allJobs = await Recruiter.getAllJobs();

            const options = {
                allJobs,
                message: "Login Successful...",
                role: "recruiter",
                userName: user.name,
                userEmail: req.session.userEmail,
                lastVisit: formatDate(req.session.lastVisit),
                appliedJobList: [],
                path: req.path,
            };

            return res.render("all-jobs", options);
        }
    }

    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/recruiter-login");
            }
        });
    }
}
