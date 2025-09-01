// IP whitelist for admin dashboard
const WHITELISTED_IPS = [
	'127.0.0.1',        // localhost
	'::1',              // IPv6 localhost
];

export const isIPWhitelisted = (ip: string): boolean => {
	// Add environment IP if provided
	const envIP = import.meta.env.ADMIN_IP;
	if (envIP) {
		WHITELISTED_IPS.push(envIP);
	}
	
	return WHITELISTED_IPS.includes(ip);
};
