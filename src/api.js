import axios from 'axios';
import config from './config';

const API_BASE_URL = config.API_BASE_URL;

export const searchRestaurants = async (query, userLocation, userId) => {
    try {
        const payload = { text: query };
        if (userLocation) {
            payload.userLocation = userLocation;
        }
        if (userId) {
            payload.userId = userId;
        }
        const response = await axios.post(`${API_BASE_URL}/query`, payload);
        return response.data;
    } catch (error) {
        if (error.response) {
            // Server responded with a status code outside the 2xx range
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request:', error.request);
        } else {
            // Something happened in setting up the request
            console.error('Error:', error.message);
        }
        throw error;
    }
};
export const getSimilarRestaurants = async (restaurantId, userLocation) => {
    try {
        const payload = { restaurantId };
        if (userLocation) {
            payload.userLocation = userLocation;
        }
        const response = await axios.post(`${API_BASE_URL}/query/similar`, payload);
        return response.data;
    } catch (error) {
        console.error("Error fetching similar restaurants:", error);
        throw error;
    }
};

export const getRoute = async (origin, destination) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/route`, {
            origin,
            destination
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching route:", error);
        throw error;
    }
};
