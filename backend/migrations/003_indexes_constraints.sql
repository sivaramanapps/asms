-- Performance indexes for ASMS
-- Company and tenant isolation indexes
CREATE INDEX idx_user_company_roles_company ON user_company_roles(company_id);
CREATE INDEX idx_user_company_roles_user ON user_company_roles(user_id);

-- Worker related indexes
CREATE INDEX idx_workers_company ON workers(company_id);
CREATE INDEX idx_workers_status ON workers(company_id, status);
CREATE INDEX idx_workers_code ON workers(company_id, worker_code);

-- Work logs indexes (heavy table)
CREATE INDEX idx_work_logs_company_date ON work_logs(company_id, work_date);
CREATE INDEX idx_work_logs_worker_date ON work_logs(worker_id, work_date);
CREATE INDEX idx_work_logs_date_range ON work_logs(work_date);

-- Payroll indexes
CREATE INDEX idx_payroll_periods_company ON payroll_periods(company_id, period_start, period_end);
CREATE INDEX idx_payroll_entries_period ON payroll_entries(payroll_period_id);
CREATE INDEX idx_payroll_entries_worker ON payroll_entries(worker_id);

-- Deductions indexes
CREATE INDEX idx_worker_deductions_company ON worker_deductions(company_id);
CREATE INDEX idx_worker_deductions_worker ON worker_deductions(worker_id);
CREATE INDEX idx_worker_deductions_date ON worker_deductions(deduction_date);

-- Disbursements indexes
CREATE INDEX idx_disbursements_company ON disbursements(company_id);
CREATE INDEX idx_disbursements_worker ON disbursements(worker_id);
CREATE INDEX idx_disbursements_date ON disbursements(payment_date);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id, created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Updated at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_logs_updated_at BEFORE UPDATE ON work_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON payroll_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();