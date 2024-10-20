import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { JobModel } from "./rec.model.new.js";

const jobSeekerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        role: { type: String, required: true },
        password: { type: String, required: true },
        jobsApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
        profile: {
            name: { type: String, default: null },
            email: { type: String, default: null },
            phone: { type: String, default: null },
            gender: { type: String, default: null },
            education: { type: String, default: null },
            experience: { type: String, default: null },
            skills: { type: [String], default: [] },
            resume: { type: String, default: null },
        },
        lastVisit: { type: Date },
    },
    { collection: "JobSeeker" }
);

const JobSeekerModel = mongoose.model("JobSeeker", jobSeekerSchema);

export default class JobSeeker {
    static async addJobSeeker(jobSeekerObj) {
        const newJobSeeker = new JobSeekerModel({ ...jobSeekerObj, lastVisit: new Date() });
        return await newJobSeeker.save();
    }

    static async updateLastVisit(email) {
        await JobSeekerModel.findOneAndUpdate(
            { email },
            { lastVisit: new Date() },
            { new: true, upsert: true }
        );
    }

    static async isRegisteredJobSeeker(email, password) {
        return await JobSeekerModel.findOne({ email, password });
    }

    static async updateProfile(jobSeekerEmail, profileData) {
        const resumeBase64 = profileData.resume.toString("base64");
        return await JobSeekerModel.findOneAndUpdate(
            { email: jobSeekerEmail },
            {
                profile: {
                    name: profileData.name,
                    email: profileData.email,
                    phone: profileData.phone,
                    gender: profileData.gender,
                    education: profileData.education,
                    experience: profileData.experience,
                    skills: profileData.skills,
                    resume: resumeBase64,
                },
            },
            { new: true }
        );
    }

    static async applyJob(jobId, jobseekerEmail) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const jobSeeker = await JobSeekerModel.findOne({ email: jobseekerEmail });
            if (!jobSeeker || !jobSeeker.profile) {
                return { result: false, message: "Profile not updated", jobsApplied: [] };
            }

            if (jobSeeker.jobsApplied.includes(jobId)) {
                return { result: false, message: "Job already applied for", jobsApplied: [] };
            }

            jobSeeker.jobsApplied.push(jobId);
            const user = await jobSeeker.save({ session });

            const job = await JobModel.findById(jobId);
            if (!job.applicants.includes(user._id)) {
                job.applicants.push(user._id);
            }
            await job.save({ session });

            await session.commitTransaction();
            return { result: true, message: "", jobsApplied: user.jobsApplied };
        } catch (error) {
            console.error(error);
            await session.abortTransaction();
            return {
                result: false,
                message: "An error occurred while applying for the job",
                jobsApplied: [],
            };
        } finally {
            session.endSession();
        }
    }

    static async searchJobSeekerByEmail(email) {
        return await JobSeekerModel.findOne({ email });
    }

    static async sendEmailNotification(recuiter_email, senderEmail, subject, body) {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "sachinbhavar@gmail.com",
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: senderEmail,
            to: recuiter_email,
            subject: subject,
            text: body,
        };

        console.log("mailOptions", mailOptions);

        try {
            const info = await transporter.sendMail(mailOptions);
            return info.messageId;
        } catch (error) {
            throw new Error("Email not sent");
        }
    }

    static async isValidJobSeeker(jobSeekerObj) {
        return await JobSeekerModel.exists({ email: jobSeekerObj.email });
    }

    static async getAllJobs() {
        const allJobs = await JobModel.find();
        return allJobs;
    }

    static async getAllJobsAppliedByJobSeeker(jobSeekerEmail) {
        const jobSeeker = await JobSeekerModel.findOne({ email: jobSeekerEmail });

        if (!jobSeeker) return [];

        const arrayOfJobObjectIds = jobSeeker.jobsApplied;
        const objectIds = arrayOfJobObjectIds.map((id) => new mongoose.Types.ObjectId(id));
        return await JobModel.find({ _id: { $in: objectIds } });
    }
}
