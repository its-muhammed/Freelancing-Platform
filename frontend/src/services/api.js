import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    },
});

export const registerUser = async (userData) => {
    try {
        const response = await API.post("/api/users/register", userData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { message: "Signup failed" };
    }
};

export default API;
