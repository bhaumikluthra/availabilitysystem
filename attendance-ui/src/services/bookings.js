import api from "./api";

export const createBooking = (payload) => {
  return api.post('/api/bookings', payload);
};

export default { createBooking };
