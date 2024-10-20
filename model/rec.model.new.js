import mongoose from "mongoose";
import bcrypt from "bcrypt";

const jobSchema = new mongoose.Schema(
    {
        recruiter_email: { type: String, required: true },
        company: { type: String, required: true },
        type: { type: String, required: true },
        designation: { type: String, required: true },
        salary: { type: String, required: true },
        location: { type: String, required: true },
        vacancies: { type: Number, required: true },
        experience: { type: String, required: true },
        skills: [String],
        description: { type: String, required: true },
        applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "JobSeeker" }],
    },
    { collection: "Job" }
);

const recruiterSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        role: { type: String, required: true },
        password: { type: String, required: true },
        jobPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
        lastVisit: { type: Date },
    },
    { collection: "Recruiter" }
);

export const JobModel = mongoose.model("Job", jobSchema);
const RecruiterModel = mongoose.model("Recruiter", recruiterSchema);

export default class Recruiter {
    static async addRecruiter(recruiterObj) {
        const newRecruiter = new RecruiterModel({ ...recruiterObj, lastVisit: new Date() });
        return await newRecruiter.save();
    }

    static async isRegisteredRecruiter(email, password) {
        return await RecruiterModel.findOne({ email, password });
    }

    static async updateLastVisit(email) {
        await RecruiterModel.findOneAndUpdate(
            { email },
            { lastVisit: new Date() },
            { new: true, upsert: true }
        );
    }
    static async searchRecruiterByEmail(email) {
        return await RecruiterModel.findOne({ email }).populate("jobPosted");
    }

    static async addNewJob(jobDetails, recruiterEmail) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const skillsArray = jobDetails.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill !== "");

            const newJob = new JobModel({
                ...jobDetails,
                skills: skillsArray,
                recruiter_email: recruiterEmail,
            });
            await newJob.save({ session });

            const recruiter = await RecruiterModel.findOne({ email: recruiterEmail });
            if (!recruiter) {
                await session.abortTransaction();
                return { result: false, message: "Recruiter not found" };
            }

            recruiter.jobPosted.push(newJob._id);
            await recruiter.save({ session });

            await session.commitTransaction();
            return { result: true, job: newJob };
        } catch (error) {
            console.error(error);
            await session.abortTransaction();
            return { result: false, message: "An error occurred while adding the job" };
        } finally {
            session.endSession();
        }
    }

    static async deleteJob(jobId, recruiterEmail) {
        const recruiter = await RecruiterModel.findOne({ email: recruiterEmail });
        const job = await JobModel.findByIdAndDelete(jobId);

        if (job) {
            recruiter.jobPosted.pull(job._id);
            await recruiter.save();
            return { success: true };
        }
        return { success: false };
    }

    static async updateJob(updatedJob, recruiter) {
        // console.log(updatedJob._id);
        const skillsArray = updatedJob.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill !== "");
        await JobModel.findByIdAndUpdate(
            updatedJob._id,
            { ...updatedJob, skills: skillsArray },
            { new: true, runValidators: true }
        );
    }

    static async getAllJobs() {
        const allJobs = await JobModel.find();
        return allJobs;
    }

    static async searchJobById(jobId, recruiter) {
        return await JobModel.findById(jobId);
    }

    static async getRecruiterApplicants(recruiterEmail) {
        try {
            const recruiter = await RecruiterModel.findOne({ email: recruiterEmail });
            if (!recruiter) {
                throw new Error("Recruiter not found");
            }

            const jobs = await JobModel.find({
                applicants: { $ne: [] },
                recruiter_email: recruiterEmail,
            }).populate("applicants");

            return jobs;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    static async isValidRecruiter(recruiterObj) {
        const recruiter = await RecruiterModel.findOne({ email: recruiterObj.email });
        return !!recruiter;
    }
}
