// This is a wrapper around the native fetch API
export const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    // Prepare the headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers, // Allow custom headers to be passed in
    };

    // If a token exists, add the Authorization header
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Construct the final options object for the fetch call
    const finalOptions = {
        ...options,
        headers,
    };

    const response = await fetch(url, finalOptions);

    if (!response.ok) {
        // If the response is not ok, try to parse the error message from the body
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json(); // Parse the JSON from the response
};