export const MONTHLY_PAYROLL_BY_ROLE = {
  admin: 2500,
  agent: 950,
  finance: 1500,
  hr: 1500,
};

export const PAYROLL_ROLE_DEFINITIONS = [
  {
    code: "ADMIN",
    role: "admin",
    description: "Admin Monthly Payroll",
    amount: MONTHLY_PAYROLL_BY_ROLE.admin,
    currency: "DT",
  },
  {
    code: "AGENT",
    role: "agent",
    description: "Agent Monthly Payroll",
    amount: MONTHLY_PAYROLL_BY_ROLE.agent,
    currency: "DT",
  },
  {
    code: "FINANCE",
    role: "finance",
    description: "Finance Monthly Payroll",
    amount: MONTHLY_PAYROLL_BY_ROLE.finance,
    currency: "DT",
  },
  {
    code: "HR",
    role: "hr",
    description: "HR Monthly Payroll",
    amount: MONTHLY_PAYROLL_BY_ROLE.hr,
    currency: "DT",
  },
];

export const calculateMonthlyPayroll = (users = []) =>
  users.reduce(
    (total, user) => total + (MONTHLY_PAYROLL_BY_ROLE[user.role] ?? 0),
    0
  );

export const buildPayrollBreakdown = (users = []) =>
  PAYROLL_ROLE_DEFINITIONS.map((definition) => {
    const employeeCount = users.filter(
      (user) => user.role === definition.role
    ).length;
    return {
      ...definition,
      employeeCount,
      totalAmount: employeeCount * definition.amount,
    };
  });

export const getPayrollRunDate = (year, monthIndex) => {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  const runDay =
    monthIndex === 1 ? lastDayOfMonth : Math.min(29, lastDayOfMonth);
  return new Date(year, monthIndex, runDay);
};

export const buildPayrollCalendar = (
  users = [],
  months = 6,
  startDate = new Date()
) => {
  const breakdown = buildPayrollBreakdown(users);
  const totalPayroll = calculateMonthlyPayroll(users);

  return Array.from({ length: months }, (_, index) => {
    const payrollDate = getPayrollRunDate(
      startDate.getFullYear(),
      startDate.getMonth() + index
    );

    return {
      id: `${payrollDate.getFullYear()}-${String(
        payrollDate.getMonth() + 1
      ).padStart(2, "0")}`,
      monthLabel: payrollDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      payrollDate: payrollDate.toISOString().slice(0, 10),
      totalPayroll,
      employeeCount: users.length,
      breakdown,
    };
  });
};
