import axios from 'axios';
import { config } from '../config/config';

const API_URL = `${config.apiBaseUrl}/api`;

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create axios instance with auth header
const createAuthHeaders = () => {
    const token = getAuthToken();
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export interface SignatureTemplate {
    id: number;
    userId: number;
    name: string;
    signatureUrl: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export const signatureTemplateApi = {
    // Get all templates for current user
    getAll: async () => {
        const response = await axios.get(
            `${API_URL}/signature-templates`,
            createAuthHeaders()
        );
        return response;
    },

    // Get default template
    getDefault: async () => {
        const response = await axios.get(
            `${API_URL}/signature-templates/default`,
            createAuthHeaders()
        );
        return response;
    },

    // Create new template
    create: async (data: {
        name: string;
        signatureData: string;
        isDefault?: boolean;
    }) => {
        const response = await axios.post(
            `${API_URL}/signature-templates`,
            data,
            createAuthHeaders()
        );
        return response;
    },

    // Update template
    update: async (
        id: number,
        data: {
            name?: string;
            isDefault?: boolean;
        }
    ) => {
        const response = await axios.put(
            `${API_URL}/signature-templates/${id}`,
            data,
            createAuthHeaders()
        );
        return response;
    },

    // Delete template
    delete: async (id: number) => {
        const response = await axios.delete(
            `${API_URL}/signature-templates/${id}`,
            createAuthHeaders()
        );
        return response;
    },

    // Set template as default
    setDefault: async (id: number) => {
        const response = await axios.post(
            `${API_URL}/signature-templates/${id}/set-default`,
            {},
            createAuthHeaders()
        );
        return response;
    },
};
