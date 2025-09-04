import { ADMIN_IP } from '$env/static/private';

// IP whitelist for admin dashboard
const BASE_WHITELISTED_IPS = [
    '127.0.0.1',        // localhost
    '::1',              // IPv6 localhost
];

// Check if the given IP is whitelisted
export const isIPWhitelisted = (ip: string): boolean => {
    console.log(`Checking IP: ${ip} against whitelist:`, [...BASE_WHITELISTED_IPS, ...(ADMIN_IP ? [ADMIN_IP] : [])]);
    return [...BASE_WHITELISTED_IPS, ...(ADMIN_IP ? [ADMIN_IP] : [])].includes(ip);
};

