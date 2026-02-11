/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate OTP expiration time
 * @param {number} minutes - Minutes until expiration
 * @returns {Date} Expiration timestamp
 */
const getOTPExpiration = (minutes = 10) => {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + minutes);
    return expiration;
};

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - OTP expiration timestamp
 * @returns {boolean} True if OTP is expired
 */
const isOTPExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
};

module.exports = {
    generateOTP,
    getOTPExpiration,
    isOTPExpired,
};
