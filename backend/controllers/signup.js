const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');
const { User, ProjectManager, Engineer } = require('../models/User');



const signup = async (req, res, next) => {
    try {
        const { name, email, password, role, ...additionalData } = req.body;

        if (!name || !email || !password || !role) {
            return next(new Error('Name, email, password, and role are required'));
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedRole = role.toLowerCase().trim();

        if (!['project_manager', 'project manager', 'engineer'].includes(normalizedRole)) {
            return sendAuthError(
                res,
                next,
                `Invalid role: ${role}. Must be 'project_manager' or 'engineer'`,
                400
            );
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return next(new Error('User with this email already exists'));
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: normalizedRole,
            lastlogin: new Date(),
            ...additionalData
        });

        if (normalizedRole === 'project_manager' || normalizedRole === 'project manager') {
            await ProjectManager.create({
                _id: user._id,
                managed_projects: [],
                managed_engineers: []
            });
        } else if (normalizedRole === 'engineer') {
            await Engineer.create({
                _id: user._id,
                projects: [],
                Tasks: [],
                completedTasks: [],
                currentTask: null,
                currentProject: null,
                availability: {
                    status: 'available'
                }
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'User signed up successfully',
            token: jwt.generateToken(user),
            data: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new Error('User with this email already exists'));
        }

        return next(error);
    }
};

const signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new Error('Email and password are required'));
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            return next(new Error('Invalid email or password'));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return next(new Error('Invalid email or password'));
        }
        console.log("meooow")
        return res.status(200).json({
            status: 'success',
            message: 'User signed in successfully',
            token: jwt.generateToken(user),
            data: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = { signup, signin };