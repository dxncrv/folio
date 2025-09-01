import { ADMIN_IP } from '$env/static/private';

// IP whitelist for admin dashboard
const BASE_WHITELISTED_IPS = [
	'127.0.0.1',        // localhost
	'::1',              // IPv6 localhost
];

export const isIPWhitelisted = (ip: string): boolean => {
	// Create a new array with base IPs and environment IP
	const whitelistedIPs = [...BASE_WHITELISTED_IPS];
	
	// Add environment IP if provided
	if (ADMIN_IP) {
		whitelistedIPs.push(ADMIN_IP);
	}
	
	console.log(`Checking IP: ${ip} against whitelist:`, whitelistedIPs);
	
	return whitelistedIPs.includes(ip);
};
