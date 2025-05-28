import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();

const seedUsers = [
    // Female Users
    {
        email: "emma.thompson@gmail.com",
        fullName: "Emma Thompson",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
        email: "olivia.miller@gmail.com",
        fullName: "Olivia Miller",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    {
        email: "sophia.davis@gmail.com",
        fullName: "Sophia Davis",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
        email: "ava.wilson@gmail.com",
        fullName: "Ava Wilson",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
        email: "isabella.brown@gmail.com",
        fullName: "Isabella Brown",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/5.jpg",
    },
    {
        email: "mia.johnson@gmail.com",
        fullName: "Mia Johnson",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/6.jpg",
    },
    {
        email: "charlotte.williams@gmail.com",
        fullName: "Charlotte Williams",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/7.jpg",
    },
    {
        email: "amelia.garcia@gmail.com",
        fullName: "Amelia Garcia",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/women/8.jpg",
    },

    // Male Users
    {
        email: "james.anderson@gmail.com",
        fullName: "James Anderson",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
        email: "william.clark@gmail.com",
        fullName: "William Clark",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
        email: "benjamin.taylor@gmail.com",
        fullName: "Benjamin Taylor",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/men/3.jpg",
    },
    {
        email: "lucas.moore@gmail.com",
        fullName: "Lucas Moore",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/men/4.jpg",
    },
    {
        email: "henry.jackson@gmail.com",
        fullName: "Henry Jackson",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    {
        email: "alexander.martin@gmail.com",
        fullName: "Alexander Martin",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/men/6.jpg",
    },
    {
        email: "daniel.rodriguez@gmail.com",
        fullName: "Daniel Rodriguez",
        password: "Example123@",
        profilePicture: "https://randomuser.me/api/portraits/men/7.jpg",
    },
];

const seedDatabase = async () => {
    try {
        await connectDB();

        await User.insertMany(seedUsers);
        console.log("Database seeded successfully");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};

// Call the function
seedDatabase();
