import AccessControlInfo from "../AccessControlInfo";

export default function AccessControlInfoExample() {
  return (
    <AccessControlInfo
      role="ANALYST"
      maskedColumns={["email", "phone_number", "ssn"]}
      restrictedTables={["hr.salaries", "finance.expenses"]}
      rowFilters={["region IN ('NA', 'US', 'CA')", "department = 'Sales'"]}
    />
  );
}
