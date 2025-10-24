// Prefer explicit override, otherwise use gateway-relative path for team bookings
// This should point to the gateway-relative team-bookings path without duplicating '/api'
const API_BASE_URL = process.env.REACT_APP_BOOKING_API_URL || '/api/team-bookings';

export const teamBookingService = {
  // Create a new team booking
  async createTeamBooking(bookingData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Request failed:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating team booking:', error);
      throw error;
    }
  },

  // Get team bookings
  async getTeamBookings(teamId, token, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

  const response = await fetch(`${API_BASE_URL}/team/${teamId}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching team bookings:', error);
      throw error;
    }
  },

  // Get available slots for a court
  async getAvailableSlots(courtId, date, token) {
    try {
  const response = await fetch(`${API_BASE_URL}/available-slots/${courtId}?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  // Cancel a team booking
  async cancelTeamBooking(bookingId, token) {
    try {
  const response = await fetch(`${API_BASE_URL}/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error cancelling team booking:', error);
      throw error;
    }
  }
};

export default teamBookingService;