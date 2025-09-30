--
-- PostgreSQL database dump
--

\restrict te1dkoMPwc33ic3bx0hifKepNqSEkLyrKfR67Lthx89DVfgu2JfG8mXq0q6Yice

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: deduction_category; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.deduction_category AS ENUM (
    'advance',
    'food',
    'loan',
    'penalty',
    'other'
);


ALTER TYPE public.deduction_category OWNER TO admin;

--
-- Name: disbursement_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.disbursement_type AS ENUM (
    'salary',
    'advance',
    'bonus'
);


ALTER TYPE public.disbursement_type OWNER TO admin;

--
-- Name: entry_method; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.entry_method AS ENUM (
    'manual',
    'biometric',
    'import'
);


ALTER TYPE public.entry_method OWNER TO admin;

--
-- Name: language_pref; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.language_pref AS ENUM (
    'en',
    'ta'
);


ALTER TYPE public.language_pref OWNER TO admin;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'bank_transfer',
    'check'
);


ALTER TYPE public.payment_method OWNER TO admin;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'partial',
    'paid'
);


ALTER TYPE public.payment_status OWNER TO admin;

--
-- Name: payroll_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payroll_status AS ENUM (
    'draft',
    'calculated',
    'approved',
    'paid'
);


ALTER TYPE public.payroll_status OWNER TO admin;

--
-- Name: period_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.period_type AS ENUM (
    'weekly',
    'monthly'
);


ALTER TYPE public.period_type OWNER TO admin;

--
-- Name: status_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.status_type AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE public.status_type OWNER TO admin;

--
-- Name: subscription_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.subscription_type AS ENUM (
    'trial',
    'basic',
    'premium'
);


ALTER TYPE public.subscription_type OWNER TO admin;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'manager',
    'viewer',
    'vendor_admin'
);


ALTER TYPE public.user_role OWNER TO admin;

--
-- Name: work_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.work_type AS ENUM (
    'hourly',
    'piece',
    'mixed'
);


ALTER TYPE public.work_type OWNER TO admin;

--
-- Name: worker_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.worker_type AS ENUM (
    'company',
    'contract',
    'mixed'
);


ALTER TYPE public.worker_type OWNER TO admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255),
    address text,
    phone character varying(20),
    email character varying(255),
    subscription_type public.subscription_type DEFAULT 'trial'::public.subscription_type,
    subscription_expires_at timestamp without time zone,
    settings jsonb DEFAULT '{}'::jsonb,
    status public.status_type DEFAULT 'active'::public.status_type,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO admin;

--
-- Name: deduction_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.deduction_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    category public.deduction_category DEFAULT 'other'::public.deduction_category,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.deduction_types OWNER TO admin;

--
-- Name: disbursements; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.disbursements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    worker_id uuid NOT NULL,
    payroll_entry_id uuid,
    disbursement_type public.disbursement_type DEFAULT 'salary'::public.disbursement_type,
    amount numeric(10,2) NOT NULL,
    payment_method public.payment_method DEFAULT 'cash'::public.payment_method,
    payment_date date DEFAULT CURRENT_DATE,
    reference_number character varying(100),
    denomination_breakdown jsonb DEFAULT '{}'::jsonb,
    status public.status_type DEFAULT 'active'::public.status_type,
    created_by uuid NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.disbursements OWNER TO admin;

--
-- Name: payroll_entries; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payroll_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payroll_period_id uuid NOT NULL,
    worker_id uuid NOT NULL,
    base_amount numeric(10,2) DEFAULT 0,
    overtime_amount numeric(10,2) DEFAULT 0,
    piece_amount numeric(10,2) DEFAULT 0,
    gross_amount numeric(10,2) DEFAULT 0,
    total_deductions numeric(10,2) DEFAULT 0,
    net_amount numeric(10,2) DEFAULT 0,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    payment_method public.payment_method DEFAULT 'cash'::public.payment_method,
    paid_amount numeric(10,2) DEFAULT 0,
    paid_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_entries OWNER TO admin;

--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payroll_periods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    period_type public.period_type DEFAULT 'monthly'::public.period_type,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status public.payroll_status DEFAULT 'draft'::public.payroll_status,
    total_amount numeric(12,2) DEFAULT 0,
    created_by uuid NOT NULL,
    approved_by uuid,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_periods OWNER TO admin;

--
-- Name: user_company_roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_company_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role public.user_role NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_company_roles OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    language_preference public.language_pref DEFAULT 'en'::public.language_pref,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: work_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.work_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    worker_id uuid NOT NULL,
    work_date date NOT NULL,
    work_type public.work_type DEFAULT 'hourly'::public.work_type,
    clock_in timestamp without time zone,
    clock_out timestamp without time zone,
    hours_worked numeric(4,2) DEFAULT 0,
    pieces_completed integer DEFAULT 0,
    piece_rate numeric(10,2) DEFAULT 0,
    hourly_rate numeric(10,2) DEFAULT 0,
    overtime_hours numeric(4,2) DEFAULT 0,
    total_earnings numeric(10,2) DEFAULT 0,
    entry_method public.entry_method DEFAULT 'manual'::public.entry_method,
    entry_by uuid,
    notes text,
    custom_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.work_logs OWNER TO admin;

--
-- Name: worker_deductions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.worker_deductions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    worker_id uuid NOT NULL,
    payroll_entry_id uuid,
    deduction_type_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    deduction_date date DEFAULT CURRENT_DATE,
    status public.status_type DEFAULT 'active'::public.status_type,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.worker_deductions OWNER TO admin;

--
-- Name: workers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.workers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    worker_code character varying(50) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    address text,
    worker_type public.worker_type DEFAULT 'company'::public.worker_type,
    base_hourly_rate numeric(10,2) DEFAULT 0,
    base_piece_rate numeric(10,2) DEFAULT 0,
    overtime_multiplier numeric(3,2) DEFAULT 1.5,
    bank_details jsonb DEFAULT '{}'::jsonb,
    biometric_data jsonb DEFAULT '{}'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    status public.status_type DEFAULT 'active'::public.status_type,
    joined_date date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workers OWNER TO admin;

--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.companies (id, name, display_name, address, phone, email, subscription_type, subscription_expires_at, settings, status, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	client_a_manufacturing	Client A Manufacturing Ltd	123 Industrial Area, Pudukkottai, Tamil Nadu 622001	+91-9876543210	admin@clienta.com	basic	\N	{}	active	2025-09-26 07:04:04.662253	2025-09-26 07:04:04.662253
22222222-2222-2222-2222-222222222222	client_b_textiles	Client B Textiles Pvt Ltd	456 Textile Park, Pudukkottai, Tamil Nadu 622002	+91-9876543211	admin@clientb.com	premium	\N	{}	active	2025-09-26 07:04:04.662253	2025-09-26 07:04:04.662253
\.


--
-- Data for Name: deduction_types; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.deduction_types (id, company_id, name, category, is_active, created_at) FROM stdin;
b6260181-713c-41f7-8207-f2f52c8553c1	11111111-1111-1111-1111-111111111111	Advance Payment	advance	t	2025-09-26 07:04:04.787302
d4f82c47-d4d4-4e60-80d6-7b44f2e62ca6	11111111-1111-1111-1111-111111111111	Tea/Snacks	food	t	2025-09-26 07:04:04.787302
e70b52a0-9106-44a1-93df-de67035ac5b9	11111111-1111-1111-1111-111111111111	Loan Deduction	loan	t	2025-09-26 07:04:04.787302
20b73c8b-2d7e-4c02-aa7e-46a6e5f5999a	11111111-1111-1111-1111-111111111111	Late Fine	penalty	t	2025-09-26 07:04:04.787302
fec54f3e-29af-490b-93e5-87a8daadcd4d	22222222-2222-2222-2222-222222222222	Advance Payment	advance	t	2025-09-26 07:04:04.787302
53251a29-ae6f-415f-b687-0697da3e3705	22222222-2222-2222-2222-222222222222	Canteen	food	t	2025-09-26 07:04:04.787302
682c3e6c-738b-47d6-86f5-fa0b41c3ac0c	22222222-2222-2222-2222-222222222222	Personal Loan	loan	t	2025-09-26 07:04:04.787302
\.


--
-- Data for Name: disbursements; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.disbursements (id, company_id, worker_id, payroll_entry_id, disbursement_type, amount, payment_method, payment_date, reference_number, denomination_breakdown, status, created_by, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_entries; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.payroll_entries (id, payroll_period_id, worker_id, base_amount, overtime_amount, piece_amount, gross_amount, total_deductions, net_amount, payment_status, payment_method, paid_amount, paid_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.payroll_periods (id, company_id, period_type, period_start, period_end, status, total_amount, created_by, approved_by, approved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_company_roles; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.user_company_roles (id, user_id, company_id, role, permissions, is_active, created_at, updated_at) FROM stdin;
b73d4753-f297-40d9-9bba-609332beeec4	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	11111111-1111-1111-1111-111111111111	admin	{}	t	2025-09-26 07:04:04.736023	2025-09-26 07:04:04.736023
2a46b6fd-9981-4114-80e4-7769f8fbeff6	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	11111111-1111-1111-1111-111111111111	manager	{}	t	2025-09-26 07:04:04.736023	2025-09-26 07:04:04.736023
bb23b58b-9fc0-457a-8535-5b537eebdbe5	cccccccc-cccc-cccc-cccc-cccccccccccc	22222222-2222-2222-2222-222222222222	admin	{}	t	2025-09-26 07:04:04.736023	2025-09-26 07:04:04.736023
7806570c-c302-4f16-876d-2294d6612054	dddddddd-dddd-dddd-dddd-dddddddddddd	11111111-1111-1111-1111-111111111111	vendor_admin	{}	t	2025-09-26 07:04:04.736023	2025-09-26 07:04:04.736023
0129ac64-e81c-4fad-a393-52185a59782d	dddddddd-dddd-dddd-dddd-dddddddddddd	22222222-2222-2222-2222-222222222222	vendor_admin	{}	t	2025-09-26 07:04:04.736023	2025-09-26 07:04:04.736023
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, email, password_hash, full_name, phone, language_preference, is_active, last_login_at, created_at, updated_at) FROM stdin;
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	manager@clienta.com	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.FSC9Vm	Priya Devi	+91-9876543212	ta	t	\N	2025-09-26 07:04:04.699053	2025-09-26 07:04:04.699053
dddddddd-dddd-dddd-dddd-dddddddddddd	vendor@asms.com	$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.FSC9Vm	ASMS Vendor Admin	+91-9876543214	en	t	\N	2025-09-26 07:04:04.699053	2025-09-26 07:04:04.699053
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	admin@clienta.com	$2a$12$XW2kjnJzmC2je6WN.Vxbj.sMVxVN4mhVOhh35q/ZSe.4vvFwT9byu	Ravi Kumar	+91-9876543210	ta	t	2025-09-27 04:55:52.06709	2025-09-26 07:04:04.699053	2025-09-27 04:55:52.06709
cccccccc-cccc-cccc-cccc-cccccccccccc	admin@clientb.com	\\\\\\.Vxbj.sMVxVN4mhVOhh35q/ZSe.4vvFwT9byu	Suresh Babu	+91-9876543213	en	t	\N	2025-09-26 07:04:04.699053	2025-09-27 05:02:43.64412
\.


--
-- Data for Name: work_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.work_logs (id, company_id, worker_id, work_date, work_type, clock_in, clock_out, hours_worked, pieces_completed, piece_rate, hourly_rate, overtime_hours, total_earnings, entry_method, entry_by, notes, custom_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: worker_deductions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.worker_deductions (id, company_id, worker_id, payroll_entry_id, deduction_type_id, amount, description, deduction_date, status, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: workers; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.workers (id, company_id, worker_code, full_name, phone, address, worker_type, base_hourly_rate, base_piece_rate, overtime_multiplier, bank_details, biometric_data, custom_fields, status, joined_date, created_at, updated_at) FROM stdin;
c4d73047-61d6-4013-b1ed-e636248e23eb	11111111-1111-1111-1111-111111111111	CA001	Murugan S	+91-9876501001	\N	company	150.00	0.00	1.50	{}	{}	{}	active	2025-09-27	2025-09-27 04:50:33.386116	2025-09-27 04:50:33.386116
27efe405-2168-46a3-8d4f-669529217a55	11111111-1111-1111-1111-111111111111	CA002	Lakshmi R	+91-9876501002	\N	company	140.00	0.00	1.50	{}	{}	{}	active	2025-09-27	2025-09-27 04:50:33.386116	2025-09-27 04:50:33.386116
c0c692ef-d23a-4124-8af8-365d97c5cc45	11111111-1111-1111-1111-111111111111	CA003	Vinoth K	+91-9876501003	\N	contract	0.00	25.00	1.50	{}	{}	{}	active	2025-09-27	2025-09-27 04:50:33.386116	2025-09-27 04:50:33.386116
37a46656-6151-4e12-a71d-ca3886bea2e6	11111111-1111-1111-1111-111111111111	CA004	Meena P	+91-9876501004	\N	mixed	120.00	20.00	1.50	{}	{}	{}	active	2025-09-27	2025-09-27 04:50:33.386116	2025-09-27 04:50:33.386116
93b60c3d-0589-4b51-a66c-33346405d8b6	22222222-2222-2222-2222-222222222222	CB001	Senthil M	+91-9876502001	\N	company	160.00	0.00	1.50	{}	{}	{}	active	2025-09-27	2025-09-27 04:50:40.471139	2025-09-27 04:50:40.471139
0bc14431-b9f9-49f1-8a59-03336e4c333b	22222222-2222-2222-2222-222222222222	CB002	Kavitha S	+91-9876502002	\N	contract	0.00	30.00	1.50	{}	{}	{}	active	2025-09-27	2025-09-27 04:50:40.471139	2025-09-27 04:50:40.471139
\.


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: deduction_types deduction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.deduction_types
    ADD CONSTRAINT deduction_types_pkey PRIMARY KEY (id);


--
-- Name: disbursements disbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_pkey PRIMARY KEY (id);


--
-- Name: payroll_entries payroll_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: user_company_roles user_company_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_company_roles
    ADD CONSTRAINT user_company_roles_pkey PRIMARY KEY (id);


--
-- Name: user_company_roles user_company_roles_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_company_roles
    ADD CONSTRAINT user_company_roles_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_logs work_logs_company_id_worker_id_work_date_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_company_id_worker_id_work_date_key UNIQUE (company_id, worker_id, work_date);


--
-- Name: work_logs work_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_pkey PRIMARY KEY (id);


--
-- Name: worker_deductions worker_deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.worker_deductions
    ADD CONSTRAINT worker_deductions_pkey PRIMARY KEY (id);


--
-- Name: workers workers_company_id_worker_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_company_id_worker_code_key UNIQUE (company_id, worker_code);


--
-- Name: workers workers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_pkey PRIMARY KEY (id);


--
-- Name: idx_disbursements_company; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_disbursements_company ON public.disbursements USING btree (company_id);


--
-- Name: idx_disbursements_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_disbursements_date ON public.disbursements USING btree (payment_date);


--
-- Name: idx_disbursements_worker; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_disbursements_worker ON public.disbursements USING btree (worker_id);


--
-- Name: idx_payroll_entries_period; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payroll_entries_period ON public.payroll_entries USING btree (payroll_period_id);


--
-- Name: idx_payroll_entries_worker; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payroll_entries_worker ON public.payroll_entries USING btree (worker_id);


--
-- Name: idx_payroll_periods_company; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payroll_periods_company ON public.payroll_periods USING btree (company_id, period_start, period_end);


--
-- Name: idx_user_company_roles_company; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_company_roles_company ON public.user_company_roles USING btree (company_id);


--
-- Name: idx_user_company_roles_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_company_roles_user ON public.user_company_roles USING btree (user_id);


--
-- Name: idx_work_logs_company_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_work_logs_company_date ON public.work_logs USING btree (company_id, work_date);


--
-- Name: idx_work_logs_date_range; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_work_logs_date_range ON public.work_logs USING btree (work_date);


--
-- Name: idx_work_logs_worker_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_work_logs_worker_date ON public.work_logs USING btree (worker_id, work_date);


--
-- Name: idx_worker_deductions_company; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_worker_deductions_company ON public.worker_deductions USING btree (company_id);


--
-- Name: idx_worker_deductions_date; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_worker_deductions_date ON public.worker_deductions USING btree (deduction_date);


--
-- Name: idx_worker_deductions_worker; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_worker_deductions_worker ON public.worker_deductions USING btree (worker_id);


--
-- Name: idx_workers_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_workers_code ON public.workers USING btree (company_id, worker_code);


--
-- Name: idx_workers_company; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_workers_company ON public.workers USING btree (company_id);


--
-- Name: idx_workers_status; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_workers_status ON public.workers USING btree (company_id, status);


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payroll_periods update_payroll_periods_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON public.payroll_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: work_logs update_work_logs_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_work_logs_updated_at BEFORE UPDATE ON public.work_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workers update_workers_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deduction_types deduction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.deduction_types
    ADD CONSTRAINT deduction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: disbursements disbursements_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: disbursements disbursements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: disbursements disbursements_payroll_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_payroll_entry_id_fkey FOREIGN KEY (payroll_entry_id) REFERENCES public.payroll_entries(id);


--
-- Name: disbursements disbursements_worker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE;


--
-- Name: payroll_entries payroll_entries_payroll_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_payroll_period_id_fkey FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE CASCADE;


--
-- Name: payroll_entries payroll_entries_worker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE;


--
-- Name: payroll_periods payroll_periods_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: payroll_periods payroll_periods_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: payroll_periods payroll_periods_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_company_roles user_company_roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_company_roles
    ADD CONSTRAINT user_company_roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: user_company_roles user_company_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_company_roles
    ADD CONSTRAINT user_company_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: work_logs work_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: work_logs work_logs_entry_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_entry_by_fkey FOREIGN KEY (entry_by) REFERENCES public.users(id);


--
-- Name: work_logs work_logs_worker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE;


--
-- Name: worker_deductions worker_deductions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.worker_deductions
    ADD CONSTRAINT worker_deductions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: worker_deductions worker_deductions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.worker_deductions
    ADD CONSTRAINT worker_deductions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: worker_deductions worker_deductions_deduction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.worker_deductions
    ADD CONSTRAINT worker_deductions_deduction_type_id_fkey FOREIGN KEY (deduction_type_id) REFERENCES public.deduction_types(id);


--
-- Name: worker_deductions worker_deductions_payroll_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.worker_deductions
    ADD CONSTRAINT worker_deductions_payroll_entry_id_fkey FOREIGN KEY (payroll_entry_id) REFERENCES public.payroll_entries(id);


--
-- Name: worker_deductions worker_deductions_worker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.worker_deductions
    ADD CONSTRAINT worker_deductions_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE;


--
-- Name: workers workers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict te1dkoMPwc33ic3bx0hifKepNqSEkLyrKfR67Lthx89DVfgu2JfG8mXq0q6Yice

