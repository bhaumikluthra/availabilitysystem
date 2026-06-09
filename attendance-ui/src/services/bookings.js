import api from "./api";

const bookingsClient = {
  /**
   * Creates a new booking for a specific employee
   * @param {Object} payload - { employeeId, scheduleDate, slotStart, slotEnd, notes }
   */
  createBooking: async (payload) => {
    const response = await api.post("/api/bookings", payload);
    return response.data;
  },

  /**
   * Fetches all bookings for a specific date
   * @param {String} date - YYYY-MM-DD
   */
  getBookingsByDate: async (date) => {
    const response = await api.get("/api/bookings", { params: { date } });
    return response.data;
  }
};

export default bookingsClient;