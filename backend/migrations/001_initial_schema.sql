-- ASMS Database Schema - Initial Migration
-- Companies table (multi-tenant foundation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE subscription_type AS ENUM ('trial', 'basic', 'premium');
CREATE TYPE status_type AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer', 'vendor_admin');
CREATE TYPE worker_type AS ENUM ('company', 'contract', 'mixed');
CREATE TYPE work_type AS ENUM ('hourly', 'piece', 'mixed');
CREATE TYPE entry_method AS ENUM ('manual', 'biometric', 'import');
CREATE TYPE period_type AS ENUM ('weekly', 'monthly');
CREATE TYPE payroll_status AS ENUM ('draft', 'calculated', 'approved', 'paid');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'check');
CREATE TYPE deduction_category AS ENUM ('advance', 'food', 'loan', 'penalty', 'other');
CREATE TYPE disbursement_type AS ENUM ('salary', 'advance', 'bonus');
CREATE TYPE language_pref AS ENUM ('en', 'ta');

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    subscription_type subscription_type DEFAULT 'trial',
    subscription_expires_at TIMESTAMP,
    settings JSONB DEFAULT '{}',
    status status_type DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    language_preference language_pref DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User company roles (many-to-many with roles)
CREATE TABLE user_company_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_id)
);

-- Workers table
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    worker_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    worker_type worker_type DEFAULT 'company',
    base_hourly_rate DECIMAL(10,2) DEFAULT 0,
    base_piece_rate DECIMAL(10,2) DEFAULT 0,
    overtime_multiplier DECIMAL(3,2) DEFAULT 1.5,
    bank_details JSONB DEFAULT '{}',
    biometric_data JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    status status_type DEFAULT 'active',
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, worker_code)
);

-- Work logs (attendance and work tracking)
CREATE TABLE work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    work_type work_type DEFAULT 'hourly',
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    pieces_completed INTEGER DEFAULT 0,
    piece_rate DECIMAL(10,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    entry_method entry_method DEFAULT 'manual',
    entry_by UUID REFERENCES users(id),
    notes TEXT,
    custom_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, worker_id, work_date)
);

-- Save and continue with more tables...

-- Payroll periods
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_type period_type DEFAULT 'monthly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status payroll_status DEFAULT 'draft',
    total_amount DECIMAL(12,2) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll entries (individual worker payroll)
CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    base_amount DECIMAL(10,2) DEFAULT 0,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    piece_amount DECIMAL(10,2) DEFAULT 0,
    gross_amount DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',
    payment_method payment_method DEFAULT 'cash',
    paid_amount DECIMAL(10,2) DEFAULT 0,
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deduction types
CREATE TABLE deduction_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category deduction_category DEFAULT 'other',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Worker deductions
CREATE TABLE worker_deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    payroll_entry_id UUID REFERENCES payroll_entries(id),
    deduction_type_id UUID NOT NULL REFERENCES deduction_types(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    deduction_date DATE DEFAULT CURRENT_DATE,
    status status_type DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disbursements (payments to workers)
CREATE TABLE disbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    payroll_entry_id UUID REFERENCES payroll_entries(id),
    disbursement_type disbursement_type DEFAULT 'salary',
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method DEFAULT 'cash',
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_number VARCHAR(100),
    denomination_breakdown JSONB DEFAULT '{}',
    status status_type DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs (3 month retention)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create audit log partitions (current and next 3 months)
CREATE TABLE audit_logs_current PARTITION OF audit_logs
    FOR VALUES FROM (CURRENT_DATE) TO (CURRENT_DATE + INTERVAL '1 month');

CREATE TABLE audit_logs_month1 PARTITION OF audit_logs
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '1 month') TO (CURRENT_DATE + INTERVAL '2 months');

CREATE TABLE audit_logs_month2 PARTITION OF audit_logs
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '2 months') TO (CURRENT_DATE + INTERVAL '3 months');