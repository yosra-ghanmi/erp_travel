import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// Add a request interceptor to inject agency and user headers
api.interceptors.request.use(
  (config) => {
    const savedSession = localStorage.getItem("erp_session");
    if (savedSession) {
      const session = JSON.parse(savedSession);
      if (session.agency_id) {
        config.headers["X-Agency-ID"] = session.agency_id;
      }
      if (session.role) {
        config.headers["X-User-Role"] = session.role;
      }
      if (session.id) {
        config.headers["X-User-ID"] = session.id;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const syncOffers = async () => {
  const { data } = await api.get("/api/sync-offers");
  return data;
};

export const generateItinerary = async (travelOfferId) => {
  const { data } = await api.post("/api/generate-itinerary", { travelOfferId });
  return data;
};

export const createTravelOffer = async (offerData) => {
  const { data } = await api.post("/api/travel-offers", offerData);
  return data;
};

export const deleteTravelOffer = async (offerId) => {
  const { data } = await api.delete(`/api/travel-offers/${offerId}`);
  return data;
};

export const updateTravelOffer = async (offerId, offerData) => {
  const { data } = await api.patch(`/api/travel-offers/${offerId}`, offerData);
  return data;
};

// HR ENDPOINTS
export const fetchStaff = async () => {
  const { data } = await api.get("/api/staff");
  return data.staff;
};

export const createStaff = async (staffData) => {
  const { data } = await api.post("/api/staff", staffData);
  return data;
};

export const updateStaff = async (staffId, staffData) => {
  const { data } = await api.patch(`/api/staff/${staffId}`, staffData);
  return data;
};

export const deleteStaff = async (staffId) => {
  const { data } = await api.delete(`/api/staff/${staffId}`);
  return data;
};

export const fetchSalaryGrades = async () => {
  const { data } = await api.get("/api/salary-grades");
  return data.salary_grades;
};

export const createSalaryGrade = async (gradeData) => {
  const { data } = await api.post("/api/salary-grades", gradeData);
  return data;
};

export const updateSalaryGrade = async (gradeId, gradeData) => {
  const { data } = await api.patch(`/api/salary-grades/${gradeId}`, gradeData);
  return data;
};

export const deleteSalaryGrade = async (gradeId) => {
  const { data } = await api.delete(`/api/salary-grades/${gradeId}`);
  return data;
};

export const fetchContracts = async () => {
  const { data } = await api.get("/api/contracts");
  return data.contracts;
};

export const createContract = async (contractData) => {
  const { data } = await api.post("/api/contracts", contractData);
  return data;
};

export const updateContract = async (contractId, contractData) => {
  const { data } = await api.patch(
    `/api/contracts/${contractId}`,
    contractData
  );
  return data;
};

export const deleteContract = async (contractId) => {
  const { data } = await api.delete(`/api/contracts/${contractId}`);
  return data;
};

// Agency AdminClients
export const fetchClients = async () => {
  const { data } = await api.get("/api/clients");
  return data.clients;
};

export const createClient = async (clientData) => {
  const { data } = await api.post("/api/clients", clientData);
  return data;
};

// Bookings
export const fetchBookings = async () => {
  const { data } = await api.get("/api/bookings");
  return data.bookings;
};

export const createBooking = async (bookingData) => {
  const { data } = await api.post("/api/bookings", bookingData);
  return data;
};

// Payments
export const fetchPayments = async () => {
  const { data } = await api.get("/api/payments");
  return data.payments;
};

export const createPayment = async (paymentData) => {
  const { data } = await api.post("/api/payments", paymentData);
  return data;
};

// Expenses
export const fetchExpenses = async () => {
  const { data } = await api.get("/api/expenses");
  return data.expenses;
};

export const createExpense = async (expenseData) => {
  const { data } = await api.post("/api/expenses", expenseData);
  return data;
};

export const syncExpensesFromInvoices = async () => {
  const { data } = await api.post("/api/expenses/sync-invoices");
  return data;
};

// Services
export const fetchServices = async () => {
  const { data } = await api.get("/api/services");
  return data.services;
};

export const createService = async (serviceData) => {
  const { data } = await api.post("/api/services", serviceData);
  return data;
};

export const deleteService = async (serviceCode) => {
  const { data } = await api.delete(`/api/services/${serviceCode}`);
  return data;
};

// Reservations
export const fetchReservations = async () => {
  const { data } = await api.get("/api/reservations");
  return data.reservations;
};

export const createReservation = async (reservationData) => {
  const { data } = await api.post("/api/reservations", reservationData);
  return data;
};

// Quotes
export const fetchQuotes = async () => {
  const { data } = await api.get("/api/quotes");
  return data.quotes;
};

export const createQuote = async (quoteData) => {
  const { data } = await api.post("/api/quotes", quoteData);
  return data;
};

export const updateQuoteStatus = async (quoteNo, status) => {
  const { data } = await api.patch(`/api/quotes/${quoteNo}`, { status });
  return data;
};

export const fetchQuoteLines = async (quoteNo) => {
  const { data } = await api.get(`/api/quotes/${quoteNo}/lines`);
  return data.lines;
};

export const deleteQuote = async (quoteNo) => {
  const { data } = await api.delete(`/api/quotes/${quoteNo}`);
  return data;
};

// Invoices
export const fetchInvoices = async () => {
  const { data } = await api.get("/api/invoices");
  return data.invoices;
};

export const createInvoice = async (invoiceData) => {
  const { data } = await api.post("/api/invoices", invoiceData);
  return data;
};

export const fetchInvoiceLines = async (invoiceNo) => {
  const { data } = await api.get(`/api/invoices/${invoiceNo}/lines`);
  return data.lines;
};

// Agency Admin
export const createAgencyAdmin = async (agencyId, agencyName, adminEmail) => {
  const { data } = await api.post("/api/agency-admin", {
    agency_id: agencyId,
    agency_name: agencyName,
    admin_email: adminEmail,
  });
  return data;
};

// Users
export const fetchUsers = async () => {
  const { data } = await api.get("/api/users");
  return data.users;
};

export const loginUser = async (credentials) => {
  const { data } = await api.post("/api/login", credentials);
  return data.user;
};

export const requestPasswordReset = async (resetRequest) => {
  const { data } = await api.post("/api/reset-password/request", resetRequest);
  return data;
};

export const resetPassword = async (resetData) => {
  const { data } = await api.post("/api/reset-password", resetData);
  return data;
};

// Agencies
export const fetchAgencies = async () => {
  const { data } = await api.get("/api/agencies");
  return data.agencies;
};

export const createAgency = async (agencyData) => {
  const { data } = await api.post("/api/agencies", agencyData);
  return data;
};

export const updateAgency = async (agencyId, patch) => {
  const { data } = await api.patch(`/api/agencies/${agencyId}`, patch);
  return data;
};

export const deleteAgency = async (agencyId) => {
  const { data } = await api.delete(`/api/agencies/${agencyId}`);
  return data;
};

export const deleteInvoice = async (invoiceNo) => {
  const { data } = await api.delete(`/api/invoices/${invoiceNo}`);
  return data;
};

// Mailing
export const sendEmail = async (emailData) => {
  const { data } = await api.post("/api/send-email", emailData);
  return data;
};
