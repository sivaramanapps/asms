-- Sample data for ASMS development and testing

-- Insert sample companies
INSERT INTO companies (id, name, display_name, address, phone, email, subscription_type, status) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'client_a_manufacturing',
    'Client A Manufacturing Ltd',
    '123 Industrial Area, Pudukkottai, Tamil Nadu 622001',
    '+91-9876543210',
    'admin@clienta.com',
    'basic',
    'active'
),
(
    '22222222-2222-2222-2222-222222222222',
    'client_b_textiles',
    'Client B Textiles Pvt Ltd',
    '456 Textile Park, Pudukkottai, Tamil Nadu 622002',
    '+91-9876543211',
    'admin@clientb.com',
    'premium',
    'active'
);

-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, full_name, phone, language_preference) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin@clienta.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.FSC9Vm',
    'Ravi Kumar',
    '+91-9876543210',
    'ta'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'manager@clienta.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.FSC9Vm',
    'Priya Devi',
    '+91-9876543212',
    'ta'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'admin@clientb.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.FSC9Vm',
    'Suresh Babu',
    '+91-9876543213',
    'en'
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'vendor@asms.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.FSC9Vm',
    'ASMS Vendor Admin',
    '+91-9876543214',
    'en'
);

-- Assign user roles
INSERT INTO user_company_roles (user_id, company_id, role, is_active) VALUES
-- Client A users
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'manager', true),
-- Client B users  
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'admin', true),
-- Vendor admin (access to both companies)
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'vendor_admin', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'vendor_admin', true);

-- Insert sample workers for Client A
INSERT INTO workers (id, company_id, worker_code, full_name, phone, worker_type, base_hourly_rate, base_piece_rate, status) VALUES
('w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CA001', 'Murugan S', '+91-9876501001', 'company', 150.00, 0, 'active'),
('w1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'CA002', 'Lakshmi R', '+91-9876501002', 'company', 140.00, 0, 'active'),
('w1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'CA003', 'Vinoth K', '+91-9876501003', 'contract', 0, 25.00, 'active'),
('w1111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'CA004', 'Meena P', '+91-9876501004', 'mixed', 120.00, 20.00, 'active');

-- Insert sample workers for Client B
INSERT INTO workers (id, company_id, worker_code, full_name, phone, worker_type, base_hourly_rate, base_piece_rate, status) VALUES
('w2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'CB001', 'Senthil M', '+91-9876502001', 'company', 160.00, 0, 'active'),
('w2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'CB002', 'Kavitha S', '+91-9876502002', 'contract', 0, 30.00, 'active');

-- Insert default deduction types
INSERT INTO deduction_types (company_id, name, category, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Advance Payment', 'advance', true),
('11111111-1111-1111-1111-111111111111', 'Tea/Snacks', 'food', true),
('11111111-1111-1111-1111-111111111111', 'Loan Deduction', 'loan', true),
('11111111-1111-1111-1111-111111111111', 'Late Fine', 'penalty', true),
('22222222-2222-2222-2222-222222222222', 'Advance Payment', 'advance', true),
('22222222-2222-2222-2222-222222222222', 'Canteen', 'food', true),
('22222222-2222-2222-2222-222222222222', 'Personal Loan', 'loan', true);

-- Insert sample work logs (last 7 days)
INSERT INTO work_logs (company_id, worker_id, work_date, work_type, clock_in, clock_out, hours_worked, pieces_completed, piece_rate, hourly_rate, total_earnings, entry_by) VALUES
-- Client A - Company worker (Murugan)
('11111111-1111-1111-1111-111111111111', 'w1111111-1111-1111-1111-111111111111', CURRENT_DATE - 1, 'hourly', 
 (CURRENT_DATE - 1 + TIME '09:00'), (CURRENT_DATE - 1 + TIME '17:00'), 8.0, 0, 0, 150.00, 1200.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

-- Client A - Contract worker (Vinoth)  
('11111111-1111-1111-1111-111111111111', 'w1111111-1111-1111-1111-111111111113', CURRENT_DATE - 1, 'piece', 
 NULL, NULL, 0, 45, 25.00, 0, 1125.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

-- Client A - Mixed worker (Meena)
('11111111-1111-1111-1111-111111111111', 'w1111111-1111-1111-1111-111111111114', CURRENT_DATE - 1, 'mixed',
 (CURRENT_DATE - 1 + TIME '09:30'), (CURRENT_DATE - 1 + TIME '17:30'), 6.0, 20, 20.00, 120.00, 1120.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add some sample deductions
INSERT INTO worker_deductions (company_id, worker_id, deduction_type_id, amount, description, deduction_date, created_by) 
SELECT 
    '11111111-1111-1111-1111-111111111111',
    'w1111111-1111-1111-1111-111111111111',
    dt.id,
    500.00,
    'Advance for festival expenses',
    CURRENT_DATE - 3,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM deduction_types dt 
WHERE dt.company_id = '11111111-1111-1111-1111-111111111111' 
AND dt.name = 'Advance Payment';