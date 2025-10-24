// Service for court API calls
import axios from 'axios';

// Ensure we always use a gateway-relative path. If an env var contains a full URL
// (for example 'http://localhost' or 'http://localhost/api/courts') strip the
// protocol+host so the client makes requests relative to the current origin
// (which the nginx gateway will proxy). This prevents requests like
// 'http://localhost/api/...' which can fail when the port is different.
const RAW_API_URL = process.env.REACT_APP_COURT_SERVICE_URL || '/api/courts';
// Normalize the value so the client always uses a gateway-relative path.
// Acceptable inputs:
// - '/api/courts' -> '/api/courts'
// - 'http://localhost:5003/api/courts' -> '/api/courts'
// - 'https://example.com/api/courts?foo=1' -> '/api/courts?foo=1'
let API_URL = RAW_API_URL;
try {
  if (/^https?:\/\//i.test(API_URL)) {
    // Use URL to safely extract pathname + search (handles ports, hosts, etc.)
    const parsed = new URL(API_URL);
    API_URL = parsed.pathname + (parsed.search || '');
  }
} catch (e) {
  // Fallback: strip protocol+host if URL parsing fails for any reason
  API_URL = API_URL.replace(/^https?:\/\/[0-9a-zA-Z.:_-]+/, '');
}
if (!API_URL.startsWith('/')) API_URL = '/' + API_URL;
// Helpful runtime debug to confirm which API URL the client will call.
if (typeof console !== 'undefined' && console.debug) console.debug('[courtService] API_URL ->', API_URL);

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  return { headers };
};

const createFormData = (data) => {
  const formData = new FormData();
  
  // Handle nested objects
  Object.keys(data).forEach(key => {
    if (key === 'location' && typeof data[key] === 'object') {
      formData.append('location[address]', data[key].address || '');
      formData.append('location[city]', data[key].city || '');
    } else if (key === 'amenities' && Array.isArray(data[key])) {
      data[key].forEach((amenity, index) => {
        formData.append(`amenities[${index}]`, amenity);
      });
    } else if (key === 'image' && data[key] instanceof File) {
      formData.append('image', data[key]);
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  return formData;
};

export const createCourt = (data) => {
  const hasFile = data.image instanceof File;
  if (hasFile) {
    const formData = createFormData(data);
    return axios.post(API_URL, formData, getAuthHeaders(true));
  }
  return axios.post(API_URL, data, getAuthHeaders());
};

export const updateCourt = (id, data) => {
  const hasFile = data.image instanceof File;
  if (hasFile) {
    const formData = createFormData(data);
    return axios.put(`${API_URL}/${id}`, formData, getAuthHeaders(true));
  }
  return axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
};

export const getCourts = () => axios.get(API_URL);
export const getAllCourts = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};
export const getCourtsByCompany = (companyId) => axios.get(`${API_URL}/company/${companyId}`, getAuthHeaders());
export const getCourtsByUser = (userId) => axios.get(`${API_URL}/user/${userId}`, getAuthHeaders());
export const getCourtById = (id) => axios.get(`${API_URL}/${id}`);
export const deleteCourt = (id) => axios.delete(`${API_URL}/${id}`, getAuthHeaders());

// Rating services
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  
  // First check if user object has ID
  if (user && (user._id || user.id)) {
    return user._id || user.id;
  }
  
  // If not, try to get it from token
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  }
  
  return null;
};

export const addRating = (courtId, ratingData) => {
  const userId = getUserId();
  if (!userId) {
    return Promise.reject(new Error('User not authenticated'));
  }
  const data = { ...ratingData, userId };
  console.log('Sending rating data:', data);
  return axios.post(`${API_URL}/${courtId}/ratings`, data, getAuthHeaders());
};

export const updateRating = (courtId, ratingId, ratingData) => {
  const userId = getUserId();
  if (!userId) {
    return Promise.reject(new Error('User not authenticated'));
  }
  const data = { ...ratingData, userId };
  return axios.put(`${API_URL}/${courtId}/ratings/${ratingId}`, data, getAuthHeaders());
};

export const deleteRating = (courtId, ratingId) => {
  const userId = getUserId();
  if (!userId) {
    return Promise.reject(new Error('User not authenticated'));
  }
  const data = { userId };
  return axios.delete(`${API_URL}/${courtId}/ratings/${ratingId}`, { 
    ...getAuthHeaders(), 
    data 
  });
};

export const getCourtRatings = (courtId) => axios.get(`${API_URL}/${courtId}/ratings`);

// Create courtService object for compatibility
export const courtService = {
  createCourt,
  updateCourt,
  getCourts,
  getAllCourts,
  getCourtsByCompany,
  getCourtsByUser,
  getCourtById,
  deleteCourt,
  addRating,
  updateRating,
  deleteRating,
  getCourtRatings
};

export default courtService;