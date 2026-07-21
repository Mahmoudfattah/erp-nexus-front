
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es' | 'ar';

// Dictionary of translations
const translations = {
  en: {
    common: {
      search: 'Search...',
      filter: 'Filter',
      add: 'Add',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      close: 'Close',
      logout: 'Logout',
      settings: 'Settings',
      notifications: 'Notifications',
      markRead: 'Mark all read',
      noNotifications: 'No notifications',
      viewAll: 'View All History',
      clear: 'Clear',
      download: 'Download',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      notes: 'Notes',
      overview: 'Overview',
      history: 'History'
    },
    sidebar: {
      dashboard: 'Dashboard',
      crm: 'CRM',
      sales: 'Sales',
      tasks: 'Tasks',
      inventory: 'Inventory',
      purchases: 'Purchases',
      finance: 'Finance',
      hr: 'Human Resources',
      reports: 'Reports',
      ai_insights: 'AI Insights',
      production: 'Production'
    },
    notifications: {
      task_overdue: "Overdue: Task '{title}' missed its deadline!",
      task_due_today: "Reminder: Task '{title}' is due today.",
      email_sent: "Reminder email sent to assigned staff for task '{title}'."
    },
    dashboard: {
      total_revenue: 'Total Revenue',
      active_customers: 'Active Customers',
      inventory_value: 'Inventory Value',
      order_efficiency: 'Order Efficiency',
      revenue_analytics: 'Revenue Analytics',
      full_report: 'Full Report',
      profit_vs_expenses: 'Profit vs Expenses',
      top_inventory_assets: 'Top Inventory Assets',
      top_inventory_subtitle: 'Highest value items currently in stock',
      stock_distribution: 'Stock Distribution',
      vs_last_month: 'vs last month',
      expenses: 'Expenses',
      revenue: 'Revenue'
    },
    production: {
      title: 'Production Management',
      tabs: {
        all: 'All Orders',
        pending_material: 'Pending Material',
        needs_approval: 'Needs Approval',
        active_floor: 'Active Floor'
      },
      buttons: {
        manual_wo: 'Manual Work Order',
        from_sales_order: 'From Sales Order'
      },
      table: {
        wo_id: 'WO ID',
        customer_so: 'Customer / SO',
        due_date: 'Due Date',
        materials: 'Materials',
        status: 'Status',
        actions: 'Actions'
      },
      status: {
        draft: 'Draft',
        allocating: 'Allocating',
        awaiting_approval: 'Awaiting Approval',
        approved: 'Approved',
        in_production: 'In Production',
        completed: 'Completed',
        pending: 'Pending',
        partially_allocated: 'Partially Allocated',
        full: 'Full'
      },
      modal: {
        manual_title: 'Create Manual Work Order',
        convert_title: 'Select Sales Order to Convert',
        allocate_title: 'Allocate Materials',
        details_title: 'Work Order Details',
        customer_name: 'Customer Name',
        priority: 'Priority',
        priority_normal: 'Normal',
        priority_urgent: 'Urgent',
        add_products: 'Add Products to Build',
        product: 'Product',
        qty: 'Qty',
        bom: 'Bill of Materials (Allocations)',
        allocated: 'Allocated',
        stock: 'In Stock',
        required: 'Required',
        allocate_max: 'Allocate Max'
      },
      kpi: {
        total: 'Total Work Orders',
        pending_material: 'Pending Material',
        awaiting_approval: 'Awaiting Approval',
        in_production: 'In Production'
      }
    },
    settings: {
      title: 'Settings',
      tabs: {
        general: 'General',
        billing: 'Billing & Plans',
        team: 'Team Members',
        notifications: 'Notifications',
        security: 'Security'
      },
      general: {
        title: 'General Settings',
        company_name: 'Company Name',
        email: 'Contact Email',
        address: 'Office Address',
        currency: 'Default Currency',
        timezone: 'Timezone',
        save: 'Save Changes'
      },
      billing: {
        title: 'Subscription Plan',
        subtitle: 'Manage your billing information and plan tier.',
        current_plan: 'Current Plan',
        payment_method: 'Payment Method',
        no_payment: 'No payment method added',
        next_renewal: 'Next Renewal',
        popular: 'MOST POPULAR',
        current: 'Current Plan',
        select: 'Select Plan',
        upgrade_confirm: 'Confirm switch to plan?'
      },
      team: {
        title: 'Team Management',
        add_member: 'Add Member',
        table_name: 'Name',
        table_role: 'Role',
        table_email: 'Email',
        table_status: 'Status',
        table_actions: 'Actions',
        modal_title: 'Add New Team Member'
      },
      notifications: {
        title: 'Notification Preferences',
        email_alerts: 'Email Alerts',
        email_desc: 'Receive updates about invoices, orders, and system alerts.',
        browser_push: 'Browser Notifications',
        browser_desc: 'Get push notifications in your browser.',
        weekly_reports: 'Weekly Reports',
        weekly_desc: 'Receive a weekly summary of business performance.',
        save: 'Save Preferences'
      },
      security: {
        title: 'Security Settings',
        change_password: 'Change Password',
        current_password: 'Current Password',
        new_password: 'New Password',
        confirm_password: 'Confirm Password',
        update_password: 'Update Password',
        two_factor: 'Two-Factor Authentication',
        two_factor_desc: 'Add an extra layer of security to your account.',
        enable_2fa: 'Enable 2FA'
      }
    },
    auth: {
      welcome_back: 'Welcome back',
      create_account: 'Create an account',
      admin_access: 'Admin Console Access',
      enterprise_login: 'Enterprise Login',
      sign_in: 'Sign In',
      access_console: 'Access Console',
      log_in_sso: 'Log in with SSO',
      full_name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      confirm_password: 'Confirm Password',
      remember_me: 'Remember me for 30 days',
      forgot_password: 'Forgot password?',
      company_login: 'Company Login',
      platform_admin: 'Platform Admin',
      sso_button: 'Single Sign-On (SSO)',
      back_email: 'Back to Email & Password',
      dont_have_account: "Don't have an account?",
      already_have_account: "Already have an account?",
      signup_now: 'Sign up now',
      login_link: 'Log in',
      secure_env: 'Secure Environment',
      hero_title: 'Manage your business with intelligence.',
      hero_subtitle: 'Nexus ERP unifies CRM, Inventory, Finance, and HR into a single, AI-powered platform designed for growth.',
      feature_financial: 'Real-time Financial Analytics',
      feature_inventory: 'AI-Powered Inventory Predictions',
      feature_hr: 'Automated HR & Payroll Workflows'
    },
    crm: {
      title: 'Customers',
      search_placeholder: 'Search customers...',
      add_customer: 'Add Customer',
      selected: 'Selected',
      mark_active: 'Mark Active',
      mark_inactive: 'Mark Inactive',
      mass_email: 'Mass Email',
      delete: 'Delete',
      table: {
        customer: 'Customer',
        status: 'Status',
        revenue: 'Revenue',
        contact: 'Contact',
        actions: 'Actions',
        installments: 'Installments'
      },
      no_results: 'No customers found matching your search.',
      financial_history: {
        title: 'Financial History',
        total_installment_value: 'Total Installment Value',
        amount_paid: 'Amount Paid',
        amount_pending: 'Amount Pending',
        installment_schedule: 'Installment Schedule',
        invoice_num: 'Invoice #',
        due_date: 'Due Date',
        amount: 'Amount',
        status: 'Status',
        payment_date: 'Payment Date',
        no_installments: 'No installments found for this customer.',
        close: 'Close'
      },
      modal: {
        edit_title: 'Edit Customer',
        add_title: 'Add New Customer',
        basic_info: 'Basic Info',
        full_name: 'Full Name',
        company: 'Company',
        email: 'Email Address',
        phone: 'Phone Number',
        business_details: 'Business Details',
        industry: 'Industry',
        website: 'Website',
        address: 'Address',
        system_status: 'System Status',
        annual_revenue: 'Annual Revenue ($)',
        status: 'Status',
        status_lead: 'Lead',
        status_active: 'Active',
        status_inactive: 'Inactive',
        notes: 'Notes',
        notes_placeholder: 'Internal notes about this customer...',
        save_changes: 'Save Changes',
        add_btn: 'Add Customer'
      }
    },
    tasks: {
      title: 'Tasks & Activities',
      view_list: 'List',
      view_analysis: 'Analysis',
      search_placeholder: 'Search tasks...',
      status_all: 'All Status',
      status_pending: 'Pending',
      status_in_progress: 'In Progress',
      status_completed: 'Completed',
      new_task: 'New Task',
      priority: {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      },
      mark_done: 'Mark Done',
      done: 'Done',
      related_to: 'Related To',
      assigned_to: 'Assigned To',
      no_results: 'No tasks found matching your filters.',
      kpi: {
        total: 'Total Tasks',
        completion_rate: 'Completion Rate',
        pending: 'Pending',
        high_priority: 'High Priority Active'
      },
      charts: {
        status: 'Task Status',
        priority: 'Priority Breakdown',
        workload: 'Workload by Team Member'
      },
      modal: {
        create_title: 'Create New Task',
        subject: 'Subject',
        description: 'Description',
        due_date: 'Due Date',
        priority: 'Priority',
        category: 'Category',
        assigned_to: 'Assigned To',
        related_to: 'Related To',
        save: 'Save Task'
      }
    },
    inventory: {
      title: 'Inventory Management',
      tabs: { products: 'Products', locations: 'Locations' },
      buttons: { add_item: 'Add Item', forecast: 'Forecast', ai_analysis: 'AI Stock Analysis', add_location: 'Add Location' },
      filters: { 
        search: 'Search products...',
        all_categories: 'All Categories', 
        all_statuses: 'All Statuses',
        in_stock: 'In Stock',
        low_stock: 'Low Stock',
        out_of_stock: 'Out of Stock'
      },
      table: {
        info: 'Product Info', sku: 'SKU', category: 'Category', price: 'Price', stock: 'Stock', status: 'Status', details: 'Details',
        loc_name: 'Location Name', address: 'Address', description: 'Description', items_stored: 'Items Stored'
      },
      alerts: { title: 'Inventory Alerts', out_of_stock: 'Out of Stock', low_stock: 'Low Stock' },
      modal: {
        add_title: 'Add New Inventory Item', name: 'Product Name', brand: 'Brand', color: 'Color', sku_auto: 'SKU (Auto)', price: 'Price ($)', low_stock_alert: 'Low Stock Alert', stock_allocation: 'Stock Allocation', total_stock: 'Total Stock',
        add_location_title: 'Add New Location'
      },
      forecasting: { title: 'Inventory Demand Forecast', analyzing: 'Analyzing sales history...' }
    },
    sales: {
      title: 'Sales Management',
      tabs: { orders: 'Orders', analytics: 'Analytics' },
      buttons: { new_sale: 'New Sale', download_report: 'Download Report' },
      table: { order_id: 'Order ID', customer: 'Customer', salesperson: 'Salesperson', amount: 'Amount', status: 'Status' },
      kpi: { revenue: 'Monthly Revenue', active_quotes: 'Active Quotes', ready_ship: 'Ready to Ship' },
      modal: { create_title: 'Create Sales Order', items: 'Items', add: 'Add', create: 'Create Order' },
      status: { quote: 'Quote', confirmed: 'Confirmed', shipped: 'Shipped', completed: 'Completed', cancelled: 'Cancelled' }
    },
    purchases: {
      title: 'Purchasing',
      tabs: { orders: 'Purchase Orders', vendors: 'Vendors', analytics: 'Analytics' },
      buttons: { new_order: 'New Order', add_vendor: 'Add Vendor' },
      table: { po_number: 'PO Number', vendor: 'Vendor', total: 'Total', contact: 'Contact Info', outstanding: 'Outstanding', paid: 'Total Paid' },
      kpi: { procurement: 'Monthly Procurement', pending: 'Pending Approvals', incoming: 'Incoming Deliveries' },
      modal: { create_po: 'Create Purchase Order', vendor_details: 'Vendor Details', add_vendor: 'Add New Vendor' }
    },
    finance: {
      title: 'Finance',
      tabs: { invoices: 'Invoices', installments: 'Installments', recurring: 'Recurring', expenses: 'Expenses', payables: 'Payables', cost_centers: 'Cost Centers', ledger: 'General Ledger', approvals: 'Approvals' },
      buttons: { reports: 'Reports', add_entry: 'Add Entry', record_payable: 'Record Payable', add_expense: 'Add Expense', add_cost_center: 'Add Cost Center', create_invoice: 'Create Invoice', create_payable: 'Create Payable', create_journal: 'Create Journal Entry' },
      kpi: { pending_invoices: 'Pending Invoices', payables: 'Payables', collections: 'Collections', receivables_trend: 'Receivables', unpaid_trend: 'Unpaid Bills', this_month: 'This Month' },
      search: { invoices: 'Search invoices...', recurring: 'Search recurring...', expenses: 'Search expenses...', payables: 'Search payables...', ledger: 'Search ledger...' },
      filters: { 
        all_customers: 'All Customers', 
        all_vendors: 'All Vendors', 
        all_statuses: 'All Statuses',
        start_date: 'Start Date',
        end_date: 'End Date'
      },
      table: { 
        invoice_num: 'Invoice #', 
        due_date: 'Due Date', 
        amount: 'Amount', 
        status: 'Status', 
        category: 'Category', 
        description: 'Description', 
        debit: 'Debit (+)', 
        credit: 'Credit (-)',
        customer_sales: 'Customer / Salesperson',
        ref_terms: 'Ref / Terms',
        installments: 'Installments',
        actions: 'Actions',
        ref_id: 'Ref ID',
        balance: 'Balance',
        schedule_id: 'Schedule ID',
        frequency: 'Frequency',
        next_gen: 'Next Generation',
        date: 'Date',
        desc_link: 'Description / Link',
        vendor: 'Vendor',
        reference: 'Reference'
      },
      actions: {
        view_details: 'View Full Details',
        view_in_crm: 'View in CRM',
        download_pdf: 'Download PDF',
        mark_paid: 'Mark as Fully Paid',
        post_ledger: 'Post to Ledger',
        duplicate: 'Duplicate',
        void_delete: 'Void / Delete',
        pause_schedule: 'Pause Schedule',
        resume_schedule: 'Resume Schedule',
        edit_terms: 'Edit Terms',
        approve_expense: 'Approve Expense',
        confirm_payment: 'Confirm Payment',
        download_receipt: 'Download Receipt',
        post_gl: 'Post to GL',
        delete_entry: 'Delete Entry',
        approve_payable: 'Approve for Payment',
        pay_now: 'Pay Now',
        view_timeline: 'View Timeline',
        delete_bill: 'Delete Bill',
        record_payment: 'Record Payment'
      },
      modal: {
        journal_title: 'Add Journal Entry',
        invoice_title: 'Create New Invoice',
        expense_title: 'Record New Expense',
        trans_date: 'Transaction Date',
        description: 'Description',
        category: 'Category',
        debit: 'Debit (+)',
        credit: 'Credit (-)',
        customer: 'Customer',
        salesperson: 'Salesperson',
        issue_date: 'Issue Date',
        payment_terms: 'Payment Terms',
        due_date: 'Due Date',
        payment_struct: 'Payment Structure',
        full_cash: 'Full Cash',
        installments: 'Installments',
        down_payment: 'Initial Down Payment ($)',
        period: 'Installment Period (Months)',
        monthly: 'Monthly Commitment',
        line_items: 'Line Items',
        rate: 'Rate',
        total: 'Total',
        save_draft: 'Save as Draft',
        submit_approval: 'Submit for Approval',
        expense_link: 'Expense Linking (Optional)',
        po: 'Purchase Order',
        project: 'Project Name',
        cost_center: 'Cost Center',
        record_btn: 'Record Expense',
        managed_by: 'Managed by',
        balance_due: 'Balance Due',
        items_breakdown: 'Items Breakdown',
        subtotal: 'Subtotal',
        schedule: 'Installment Schedule',
        history: 'Status Change History',
        no_history: 'No status history recorded for this invoice.',
        approve: 'Approve',
        reject: 'Reject',
        link_so: 'Link Sales Order (Optional)',
        select_so: 'Select Sales Order'
      },
      status: {
        draft: 'Draft',
        awaiting: 'Awaiting Approval',
        approved: 'Approved',
        paid: 'Paid',
        rejected: 'Rejected',
        pending: 'Pending',
        active: 'Active',
        paused: 'Paused',
        overdue: 'Overdue'
      }
    },
    hr: {
      tabs: { directory: 'Directory', leave: 'Leave', payroll: 'Payroll', attendance: 'Attendance' },
      buttons: { add_employee: 'Add Employee', new_request: 'New Request', run_payroll: 'Run Payroll', summary: 'Summary' },
      search_employees: 'Search employees...',
      search_requests: 'Search requests...',
      payroll: {
        title: 'Payroll History',
        subtitle: 'View and manage monthly payroll runs.'
      },
      table: { 
        employee: 'Employee', 
        role_dept: 'Role & Dept', 
        details: 'Details', 
        status: 'Status', 
        salary: 'Salary', 
        joined: 'Joined', 
        type: 'Type', 
        dates: 'Dates', 
        reason: 'Reason',
        pay_period: 'Pay Period',
        processed_on: 'Processed On',
        total_employees: 'Employees',
        total_payout: 'Total Payout'
      },
      modal: { 
        add_employee: 'Add New Employee', 
        submit_leave: 'Submit Leave Request',
        full_name: 'Full Name',
        employee_id: 'Employee ID',
        department: 'Department',
        role: 'Role',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        contract: 'Contract Number',
        certificate: 'Certificate / Qualification',
        salary: 'Annual Salary',
        leave_type: 'Leave Type',
        start_date: 'Start Date',
        end_date: 'End Date',
        reason: 'Reason',
        submit: 'Submit Request',
        add: 'Add Employee'
      }
    },
    reports: {
      title: 'Analytics & Reporting',
      subtitle: 'Business intelligence dashboard.',
      types: {
        financial: 'Financial',
        sales: 'Sales'
      },
      ranges: {
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        thisQuarter: 'This Quarter',
        lastQuarter: 'Last Quarter',
        ytd: 'Year to Date',
        all: 'All Time'
      },
      buttons: {
        export_pdf: 'Export PDF'
      },
      kpi: {
        total_revenue: 'Total Revenue',
        total_expenses: 'Total Expenses',
        net_profit: 'Net Profit',
        profit_margin: 'Profit Margin',
        total_sales_revenue: 'Total Sales Revenue',
        total_orders: 'Total Orders',
        avg_order_value: 'Avg. Order Value',
        vs_prev: 'vs prev. period'
      },
      charts: {
        financial_performance: 'Financial Performance',
        expense_breakdown: 'Expense Breakdown',
        top_selling_products: 'Top Selling Products',
        sales_trend: 'Sales Trend',
        daily_breakdown: 'Daily Sales Volume',
        sales_by_category: 'Sales by Category',
        sales_by_salesperson: 'Sales person',
        revenue: 'Revenue',
        expenses: 'Expenses',
        profit_trend: 'Profit Trend',
        sales: 'Sales'
      }
    }
  },
  es: {
    common: {
      search: 'Buscar...',
      filter: 'Filtrar',
      add: 'Agregar',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      view: 'Ver',
      close: 'Cerrar',
      logout: 'Cerrar Sesión',
      settings: 'Configuración',
      notifications: 'Notificaciones',
      markRead: 'Marcar leídas',
      noNotifications: 'Sin notificaciones',
      viewAll: 'Ver todo el historial',
      clear: 'Limpiar',
      download: 'Descargar',
      actions: 'Acciones',
      status: 'Estado',
      date: 'Fecha',
      notes: 'Notas',
      overview: 'Resumen',
      history: 'Historial'
    },
    sidebar: {
      dashboard: 'Tablero',
      crm: 'CRM',
      sales: 'Ventas',
      tasks: 'Tareas',
      inventory: 'Inventario',
      purchases: 'Compras',
      finance: 'Finanzas',
      hr: 'Recursos Humanos',
      reports: 'Reportes',
      ai_insights: 'IA Insights',
      production: 'Producción'
    },
    notifications: {
      task_overdue: "Vencido: ¡La tarea '{title}' ha pasado su plazo!",
      task_due_today: "Recordatorio: La tarea '{title}' vence hoy.",
      email_sent: "Correo de recordatorio enviado al personal asignado para la tarea '{title}'."
    },
    dashboard: {
      total_revenue: 'Ingresos Totales',
      active_customers: 'Clientes Activos',
      inventory_value: 'Valor del Inventario',
      order_efficiency: 'Eficiencia de Pedidos',
      revenue_analytics: 'Analítica de Ingresos',
      full_report: 'Reporte Completo',
      profit_vs_expenses: 'Beneficio vs Gastos',
      top_inventory_assets: 'Principales Activos de Inventario',
      top_inventory_subtitle: 'Artículos de mayor valor actualmente en stock',
      stock_distribution: 'Distribución de Stock',
      vs_last_month: 'vs mes anterior',
      expenses: 'Gastos',
      revenue: 'Ingresos'
    },
    production: {
      title: 'Gestión de Producción',
      tabs: {
        all: 'Todos los Pedidos',
        pending_material: 'Material Pendiente',
        needs_approval: 'Necesita Aprobación',
        active_floor: 'Planta Activa'
      },
      buttons: {
        manual_wo: 'Orden de Trabajo Manual',
        from_sales_order: 'Desde Pedido de Venta'
      },
      table: {
        wo_id: 'ID OT',
        customer_so: 'Cliente / PV',
        due_date: 'Fecha de Entrega',
        materials: 'Materiales',
        status: 'Estado',
        actions: 'Acciones'
      },
      status: {
        draft: 'Borrador',
        allocating: 'Asignando',
        awaiting_approval: 'Esperando Aprobación',
        approved: 'Aprobado',
        in_production: 'En Producción',
        completed: 'Completado',
        pending: 'Pendiente',
        partially_allocated: 'Asignado Parcialmente',
        full: 'Completo'
      },
      modal: {
        manual_title: 'Crear Orden de Trabajo Manual',
        convert_title: 'Seleccionar Pedido para Convertir',
        allocate_title: 'Asignar Materiales',
        details_title: 'Detalles de Orden de Trabajo',
        customer_name: 'Nombre del Cliente',
        priority: 'Prioridad',
        priority_normal: 'Normal',
        priority_urgent: 'Urgente',
        add_products: 'Agregar Productos a Fabricar',
        product: 'Producto',
        qty: 'Cant',
        bom: 'Lista de Materiales (Asignaciones)',
        allocated: 'Asignado',
        stock: 'En Stock',
        required: 'Requerido',
        allocate_max: 'Asignar Máximo'
      },
      kpi: {
        total: 'Total Órdenes de Trabajo',
        pending_material: 'Material Pendiente',
        awaiting_approval: 'Esperando Aprobación',
        in_production: 'En Producción'
      }
    },
    settings: {
      title: 'Configuración',
      tabs: {
        general: 'General',
        billing: 'Facturación y Planes',
        team: 'Miembros del Equipo',
        notifications: 'Notificaciones',
        security: 'Seguridad'
      },
      general: {
        title: 'Configuración General',
        company_name: 'Nombre de la Empresa',
        email: 'Correo de Contacto',
        address: 'Dirección de la Oficina',
        currency: 'Moneda Predeterminada',
        timezone: 'Zona Horaria',
        save: 'Guardar Cambios'
      },
      billing: {
        title: 'Plan de Suscripción',
        subtitle: 'Administre su información de facturación y nivel de plan.',
        current_plan: 'Plan Actual',
        payment_method: 'Método de Pago',
        no_payment: 'No se ha agregado método de pago',
        next_renewal: 'Próxima Renovación',
        popular: 'MÁS POPULAR',
        current: 'Plan Actual',
        select: 'Seleccionar Plan',
        upgrade_confirm: '¿Confirmar cambio de plan?'
      },
      team: {
        title: 'Gestión de Equipo',
        add_member: 'Agregar Miembro',
        table_name: 'Nombre',
        table_role: 'Rol',
        table_email: 'Correo',
        table_status: 'Estado',
        table_actions: 'Acciones',
        modal_title: 'Agregar Nuevo Miembro'
      },
      notifications: {
        title: 'Preferencias de Notificación',
        email_alerts: 'Alertas por Correo',
        email_desc: 'Reciba actualizaciones sobre facturas, pedidos y alertas del sistema.',
        browser_push: 'Notificaciones del Navegador',
        browser_desc: 'Reciba notificaciones push en su navegador.',
        weekly_reports: 'Reportes Semanales',
        weekly_desc: 'Reciba un resumen semanal del rendimiento del negocio.',
        save: 'Guardar Preferencias'
      },
      security: {
        title: 'Configuración de Seguridad',
        change_password: 'Cambiar Contraseña',
        current_password: 'Contraseña Actual',
        new_password: 'Nueva Contraseña',
        confirm_password: 'Confirmar Contraseña',
        update_password: 'Actualizar Contraseña',
        two_factor: 'Autenticación de Dos Factores',
        two_factor_desc: 'Agregue una capa adicional de seguridad a su cuenta.',
        enable_2fa: 'Habilitar 2FA'
      }
    },
    auth: {
      welcome_back: 'Bienvenido de nuevo',
      create_account: 'Crear una cuenta',
      admin_access: 'Acceso Consola Admin',
      enterprise_login: 'Acceso Empresarial',
      sign_in: 'Iniciar Sesión',
      access_console: 'Acceder a Consola',
      log_in_sso: 'Entrar con SSO',
      full_name: 'Nombre Completo',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirm_password: 'Confirmar Contraseña',
      remember_me: 'Recordarme por 30 días',
      forgot_password: '¿Olvidaste tu contraseña?',
      company_login: 'Acceso Compañía',
      platform_admin: 'Admin Plataforma',
      sso_button: 'Inicio de Sesión Único (SSO)',
      back_email: 'Volver a Email y Contraseña',
      dont_have_account: "¿No tienes cuenta?",
      already_have_account: "¿Ya tienes cuenta?",
      signup_now: 'Regístrate ahora',
      login_link: 'Inicia sesión',
      secure_env: 'Entorno Seguro',
      hero_title: 'Gestiona tu negocio con inteligencia.',
      hero_subtitle: 'Nexus ERP unifica CRM, Inventario, Finanzas y RRHH en una única plataforma impulsada por IA diseñada para el crecimiento.',
      feature_financial: 'Análisis Financiero en Tiempo Real',
      feature_inventory: 'Predicciones de Inventario con IA',
      feature_hr: 'Flujos de Trabajo de RRHH Automatizados'
    },
    crm: {
      title: 'Clientes',
      search_placeholder: 'Buscar clientes...',
      add_customer: 'Agregar Cliente',
      selected: 'Seleccionados',
      mark_active: 'Marcar Activo',
      mark_inactive: 'Marcar Inactivo',
      mass_email: 'Email Masivo',
      delete: 'Eliminar',
      table: {
        customer: 'Cliente',
        status: 'Estado',
        revenue: 'Ingresos',
        contact: 'Contacto',
        actions: 'Actions',
        installments: 'Cuotas'
      },
      no_results: 'No se encontraron clientes.',
      financial_history: {
        title: 'Historial Financiero',
        total_installment_value: 'Valor Total Cuotas',
        amount_paid: 'Monto Pagado',
        amount_pending: 'Monto Pendiente',
        installment_schedule: 'Calendario de Cuotas',
        invoice_num: 'Factura #',
        due_date: 'Vencimiento',
        amount: 'Monto',
        status: 'Estado',
        payment_date: 'Fecha Pago',
        no_installments: 'No hay cuotas para este cliente.',
        close: 'Cerrar'
      },
      modal: {
        edit_title: 'Editar Cliente',
        add_title: 'Agregar Nuevo Cliente',
        basic_info: 'Información Básica',
        full_name: 'Nombre Completo',
        company: 'Empresa',
        email: 'Correo Electrónico',
        phone: 'Teléfono',
        business_details: 'Detalles del Negocio',
        industry: 'Industria',
        website: 'Sitio Web',
        address: 'Dirección',
        system_status: 'Estado del Sistema',
        annual_revenue: 'Ingresos Anuales ($)',
        status: 'Estado',
        status_lead: 'Lead',
        status_active: 'Activo',
        status_inactive: 'Inactivo',
        notes: 'Notas',
        notes_placeholder: 'Notas internas...',
        save_changes: 'Guardar Cambios',
        add_btn: 'Agregar Cliente'
      }
    },
    tasks: {
      title: 'Tareas y Actividades',
      view_list: 'Lista',
      view_analysis: 'Análisis',
      search_placeholder: 'Buscar tareas...',
      status_all: 'Todos los estados',
      status_pending: 'Pendiente',
      status_in_progress: 'En Progreso',
      status_completed: 'Completado',
      new_task: 'Nueva Tarea',
      priority: {
        high: 'Alta',
        medium: 'Media',
        low: 'Baja'
      },
      mark_done: 'Marcar Listo',
      done: 'Listo',
      related_to: 'Relacionado con',
      assigned_to: 'Asignado a',
      no_results: 'No se encontraron tareas con sus filtros.',
      kpi: {
        total: 'Total de Tareas',
        completion_rate: 'Tasa de Finalización',
        pending: 'Pendientes',
        high_priority: 'Prioridad Alta Activa'
      },
      charts: {
        status: 'Estado de Tareas',
        priority: 'Desglose de Prioridad',
        workload: 'Carga de Trabajo por Miembro'
      },
      modal: {
        create_title: 'Crear Nueva Tarea',
        subject: 'Asunto',
        description: 'Descripción',
        due_date: 'Fecha de Vencimiento',
        priority: 'Prioridad',
        category: 'Categoría',
        assigned_to: 'Asignado a',
        related_to: 'Relacionado con',
        save: 'Guardar Tarea'
      }
    },
    inventory: {
      title: 'Gestión de Inventario',
      tabs: { products: 'Productos', locations: 'Ubicaciones' },
      buttons: { add_item: 'Agregar Ítem', forecast: 'Pronóstico', ai_analysis: 'Análisis IA', add_location: 'Agregar Ubicación' },
      filters: { 
        search: 'Buscar productos...',
        all_categories: 'Todas las Categorías', 
        all_statuses: 'Todos los Estados',
        in_stock: 'En Stock',
        low_stock: 'Stock Bajo',
        out_of_stock: 'Agotado'
      },
      table: {
        info: 'Info Producto', sku: 'SKU', category: 'Categoría', price: 'Precio', stock: 'Stock', status: 'Estado', details: 'Detalles',
        loc_name: 'Nombre Ubicación', address: 'Dirección', description: 'Descripción', items_stored: 'Ítems Almacenados'
      },
      alerts: { title: 'Alertas de Inventario', out_of_stock: 'Agotado', low_stock: 'Stock Bajo' },
      modal: {
        add_title: 'Agregar Nuevo Ítem', name: 'Nombre Producto', brand: 'Marca', color: 'Color', sku_auto: 'SKU (Auto)', price: 'Precio ($)', low_stock_alert: 'Alerta Stock Bajo', stock_allocation: 'Asignación de Stock', total_stock: 'Stock Total',
        add_location_title: 'Agregar Nueva Ubicación'
      },
      forecasting: { title: 'Pronóstico de Demanda', analyzing: 'Analizando historial de ventas...' }
    },
    sales: {
      title: 'Gestión de Ventas',
      tabs: { orders: 'Pedidos', analytics: 'Analítica' },
      buttons: { new_sale: 'Nueva Venta', download_report: 'Descargar Reporte' },
      table: { order_id: 'ID Pedido', customer: 'Cliente', salesperson: 'Vendedor', amount: 'Monto', status: 'Estado' },
      kpi: { revenue: 'Ingresos Mensuales', active_quotes: 'Cotizaciones Activas', ready_ship: 'Listo para Enviar' },
      modal: { create_title: 'Crear Pedido de Venta', items: 'Ítems', add: 'Agregar', create: 'Crear Pedido' },
      status: { quote: 'Cotización', confirmed: 'Confirmado', shipped: 'Enviado', completed: 'Completado', cancelled: 'Cancelado' }
    },
    purchases: {
      title: 'Compras',
      tabs: { orders: 'Pedidos de Compra', vendors: 'Proveedores', analytics: 'Analítica' },
      buttons: { new_order: 'Nuevo Pedido', add_vendor: 'Agregar Proveedor' },
      table: { po_number: 'Nº PC', vendor: 'Proveedor', total: 'Total', contact: 'Contacto', outstanding: 'Pendiente', paid: 'Total Pagado' },
      kpi: { procurement: 'Compras Mensuales', pending: 'Aprobaciones Pendientes', incoming: 'Entregas Entrantes' },
      modal: { create_po: 'Crear Pedido de Compra', vendor_details: 'Detalles del Proveedor', add_vendor: 'Agregar Nuevo Proveedor' }
    },
    finance: {
      title: 'Finanzas',
      tabs: { invoices: 'Facturas', installments: 'Cuotas', recurring: 'Recurrentes', expenses: 'Gastos', payables: 'Cuentas por Pagar', cost_centers: 'Centros de Costo', ledger: 'Libro Mayor', approvals: 'Aprobaciones' },
      buttons: { reports: 'Reports', add_entry: 'Agregar Asiento', record_payable: 'Registrar Cuenta', add_expense: 'Agregar Gasto', add_cost_center: 'Agregar Centro Costo', create_invoice: 'Crear Factura', create_payable: 'Crear Factura por Pagar', create_journal: 'Nuevo Asiento Diario' },
      kpi: { pending_invoices: 'Facturas Pendientes', payables: 'Cuentas por Pagar', collections: 'Recaudación', receivables_trend: 'Cobros', unpaid_trend: 'Facturas Impagas', this_month: 'Este Mes' },
      search: { invoices: 'Buscar facturas...', recurring: 'Buscar recurrentes...', expenses: 'Buscar gastos...', payables: 'Buscar por pagar...', ledger: 'Buscar libro mayor...' },
      filters: { 
        all_customers: 'Todos los Clientes', 
        all_vendors: 'Todos los Proveedores', 
        all_statuses: 'Todos los Estados',
        start_date: 'Fecha Inicio',
        end_date: 'Fecha Fin'
      },
      table: { 
        invoice_num: 'Factura #', 
        due_date: 'Vencimiento', 
        amount: 'Monto', 
        status: 'Estado', 
        category: 'Categoría', 
        description: 'Descripción', 
        debit: 'Débito (+)', 
        credit: 'Crédito (-)',
        customer_sales: 'Cliente / Vendedor',
        ref_terms: 'Ref / Términos',
        installments: 'Cuotas',
        actions: 'Acciones',
        ref_id: 'ID Ref',
        balance: 'Saldo',
        schedule_id: 'ID Agenda',
        frequency: 'Frecuencia',
        next_gen: 'Siguiente Gen.',
        date: 'Fecha',
        desc_link: 'Descripción / Enlace',
        vendor: 'Proveedor',
        reference: 'Referencia'
      },
      actions: {
        view_details: 'Ver Detalles',
        view_in_crm: 'Ver en CRM',
        download_pdf: 'Descargar PDF',
        mark_paid: 'Marcar como Pagado',
        post_ledger: 'Passar al Libro',
        duplicate: 'Duplicar',
        void_delete: 'Anular / Eliminar',
        pause_schedule: 'Pausar Agenda',
        resume_schedule: 'Reanudar Agenda',
        edit_terms: 'Editar Términos',
        approve_expense: 'Aprobar Gasto',
        confirm_payment: 'Confirmar Pago',
        download_receipt: 'Descargar Recibo',
        post_gl: 'Pasar a GL',
        delete_entry: 'Eliminar Entrada',
        approve_payable: 'Aprobar Pago',
        pay_now: 'Pagar Ahora',
        view_timeline: 'Ver Historial',
        delete_bill: 'Eliminar Factura',
        record_payment: 'Registrar Pago'
      },
      modal: {
        journal_title: 'Nuevo Asiento Diario',
        invoice_title: 'Crear Nueva Factura',
        expense_title: 'Registrar Nuevo Gasto',
        trans_date: 'Fecha Transacción',
        description: 'Descripción',
        category: 'Categoría',
        debit: 'Débito (+)',
        credit: 'Crédito (-)',
        customer: 'Cliente',
        salesperson: 'Vendedor',
        issue_date: 'Fecha Emisión',
        payment_terms: 'Términos de Pago',
        due_date: 'Fecha Vencimiento',
        payment_struct: 'Eestructura de Pago',
        full_cash: 'Contado',
        installments: 'Cuotas',
        down_payment: 'Entrega Inicial ($)',
        period: 'Período (Meses)',
        monthly: 'Compromiso Mensual',
        line_items: 'Artículos',
        rate: 'Tarifa',
        total: 'Total',
        save_draft: 'Guardar Borrador',
        submit_approval: 'Enviar a Aprobación',
        expense_link: 'Vinculación de Gasto (Opcional)',
        po: 'Orden de Compra',
        project: 'Nombre del Proyecto',
        cost_center: 'Centro de Costo',
        record_btn: 'Registrar Gasto',
        managed_by: 'Gestionado por',
        balance_due: 'Saldo Pendiente',
        items_breakdown: 'Desglose de Artículos',
        subtotal: 'Subtotal',
        schedule: 'Calendario de Pagos',
        history: 'Historial de Cambios',
        no_history: 'Sin historial para esta factura.',
        approve: 'Aprobar',
        reject: 'Rechazar',
        link_so: 'Vincular Pedido de Venta (Opcional)',
        select_so: 'Seleccionar Pedido'
      },
      status: {
        draft: 'Borrador',
        awaiting: 'Esperando Aprobación',
        approved: 'Aprobado',
        paid: 'Pagado',
        rejected: 'Rechazado',
        pending: 'Pendiente',
        active: 'Activo',
        paused: 'Pausado',
        overdue: 'Vencido'
      }
    },
    hr: {
      tabs: { directory: 'Directorio', leave: 'Ausencias', payroll: 'Nómina', attendance: 'Asistencia' },
      buttons: { add_employee: 'Agregar Empleado', new_request: 'Nueva Solicitud', run_payroll: 'Ejecutar Nómina', summary: 'Resumen' },
      search_employees: 'Buscar empleados...',
      search_requests: 'Buscar solicitudes...',
      payroll: {
        title: 'Historial de Nómina',
        subtitle: 'Ver y gestionar nóminas mensuales.'
      },
      table: { 
        employee: 'Empleado', 
        role_dept: 'Rol y Depto', 
        details: 'Detalles', 
        status: 'Estado', 
        salary: 'Salario', 
        joined: 'Ingreso', 
        type: 'Tipo', 
        dates: 'Fechas', 
        reason: 'Razón',
        pay_period: 'Período de Pago',
        processed_on: 'Procesado El',
        total_employees: 'Empleados',
        total_payout: 'Pago Total'
      },
      modal: { 
        add_employee: 'Agregar Nuevo Empleado', 
        submit_leave: 'Enviar Solicitud de Ausencia',
        full_name: 'Nombre Completo',
        employee_id: 'ID Empleado',
        department: 'Departamento',
        role: 'Rol',
        email: 'Correo',
        phone: 'Teléfono',
        address: 'Dirección',
        contract: 'Número de Contrato',
        certificate: 'Certificado / Cualificación',
        salary: 'Salario Anual',
        leave_type: 'Tipo de Ausencia',
        start_date: 'Fecha Inicio',
        end_date: 'Fecha Fin',
        reason: 'Razón',
        submit: 'Enviar Solicitud',
        add: 'Agregar Empleado'
      }
    },
    reports: {
      title: 'Analítica y Reportes',
      subtitle: 'Panel de inteligencia de negocios.',
      types: {
        financial: 'Financiero',
        sales: 'Ventas'
      },
      ranges: {
        thisMonth: 'Este Mes',
        lastMonth: 'Mes Pasado',
        thisQuarter: 'Este Trimestre',
        lastQuarter: 'Último Trimestre',
        ytd: 'Año a la Fecha',
        all: 'Todo el Tiempo'
      },
      buttons: {
        export_pdf: 'Exportar PDF'
      },
      kpi: {
        total_revenue: 'Ingresos Totales',
        total_expenses: 'Gastos Totales',
        net_profit: 'Beneficio Neto',
        profit_margin: 'Margen de Beneficio',
        total_sales_revenue: 'Ingresos por Ventas',
        total_orders: 'Total Pedidos',
        avg_order_value: 'Valor Promedio Pedido',
        vs_prev: 'vs período anterior'
      },
      charts: {
        financial_performance: 'Rendimiento Financiero',
        expense_breakdown: 'Desglose de Gastos',
        top_selling_products: 'Productos Más Vendidos',
        sales_trend: 'Tendencia de Ventas',
        daily_breakdown: 'Volumen Diario de Ventas',
        sales_by_category: 'Ventas por Categoría',
        sales_by_salesperson: 'Vendedor',
        revenue: 'Ingresos',
        expenses: 'Gastos',
        profit_trend: 'Tendencia Beneficio',
        sales: 'Ventas'
      }
    }
  },
  ar: {
    common: {
      search: 'بحث...',
      filter: 'تصفية',
      add: 'إضافة',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'عرض',
      close: 'إغلاق',
      logout: 'تسجيل الخروج',
      settings: 'الإعدادات',
      notifications: 'الإشعارات',
      markRead: 'تحديد الكل كمقروء',
      noNotifications: 'لا توجد إشعارات',
      viewAll: 'عرض كل السجل',
      clear: 'مسح',
      download: 'تحميل',
      actions: 'إجراءات',
      status: 'الحالة',
      date: 'التاريخ',
      notes: 'ملاحظات',
      overview: 'نظرة عامة',
      history: 'السجل'
    },
    sidebar: {
      dashboard: 'لوحة التحكم',
      crm: 'إدارة العملاء',
      sales: 'المبيعات',
      tasks: 'المهام',
      inventory: 'المخزون',
      purchases: 'المشتريات',
      finance: 'المالية',
      hr: 'الموارد البشرية',
      reports: 'التقارير',
      ai_insights: 'رؤى الذكاء الاصطناعي',
      production: 'الإنتاج'
    },
    notifications: {
      task_overdue: "متأخر: المهمة '{title}' تجاوزت الموعد النهائي!",
      task_due_today: "تذكير: المهمة '{title}' تستحق اليوم.",
      email_sent: "تم إرسال بريد إلكتروني تذكيري للموظفين المعينين للمهمة '{title}'."
    },
    dashboard: {
      total_revenue: 'إجمالي الإيرادات',
      active_customers: 'العملاء النشطون',
      inventory_value: 'قيمة المخزون',
      order_efficiency: 'كفاءة الطلبات',
      revenue_analytics: 'تحليلات الإيرادات',
      full_report: 'التقرير الكامل',
      profit_vs_expenses: 'الربح مقابل المصروفات',
      top_inventory_assets: 'أعلى أصول المخزون',
      top_inventory_subtitle: 'الأصناف الأعلى قيمة المتوفرة حالياً',
      stock_distribution: 'توزيع المخزون',
      vs_last_month: 'مقارنة بالشهر السابق',
      expenses: 'المصروفات',
      revenue: 'الإيرادات'
    },
    production: {
      title: 'إدارة الإنتاج',
      tabs: {
        all: 'جميع الطلبات',
        pending_material: 'مواد معلقة',
        needs_approval: 'تحتاج موافقة',
        active_floor: 'منطقة العمل النشطة'
      },
      buttons: {
        manual_wo: 'أمر عمل يدوي',
        from_sales_order: 'من طلب مبيعات'
      },
      table: {
        wo_id: 'رقم أمر العمل',
        customer_so: 'العميل / طلب المبيعات',
        due_date: 'تاريخ الاستحقاق',
        materials: 'المواد',
        status: 'الحالة',
        actions: 'إجراءات'
      },
      status: {
        draft: 'مسودة',
        allocating: 'جاري التخصيص',
        awaiting_approval: 'في انتظار الموافقة',
        approved: 'تمت الموافقة',
        in_production: 'في الإنتاج',
        completed: 'مكتمل',
        pending: 'قيد الانتظار',
        partially_allocated: 'مخصص جزئياً',
        full: 'كامل'
      },
      modal: {
        manual_title: 'إنشاء أمر عمل يدوي',
        convert_title: 'اختر طلب مبيعات للتحويل',
        allocate_title: 'تخصيص المواد',
        details_title: 'تفاصيل أمر العمل',
        customer_name: 'اسم العميل',
        priority: 'الأولوية',
        priority_normal: 'عادي',
        priority_urgent: 'عاجل',
        add_products: 'إضافة منتجات للتصنيع',
        product: 'المنتج',
        qty: 'الكمية',
        bom: 'قائمة المواد (التخصيصات)',
        allocated: 'تم تخصيصه',
        stock: 'في المخزون',
        required: 'مطلوب',
        allocate_max: 'تخصيص الحد الأقصى'
      },
      kpi: {
        total: 'إجمالي أوامر العمل',
        pending_material: 'مواد معلقة',
        awaiting_approval: 'في انتظار الموافقة',
        in_production: 'في الإنتاج'
      }
    },
    settings: {
      title: 'الإعدادات',
      tabs: {
        general: 'عام',
        billing: 'الفواتير والخطط',
        team: 'أعضاء الفريق',
        notifications: 'الإشعارات',
        security: 'الأمان'
      },
      general: {
        title: 'الإعدادات العامة',
        company_name: 'اسم الشركة',
        email: 'البريد الإلكتروني للتواصل',
        address: 'عنوان المكتب',
        currency: 'العملة الافتراضية',
        timezone: 'المنطقة الزمنية',
        save: 'حفظ التغييرات'
      },
      billing: {
        title: 'خطة الاشتراك',
        subtitle: 'إدارة معلومات الفواتير ومستوى الخطة.',
        current_plan: 'الخطة الحالية',
        payment_method: 'طريقة الدفع',
        no_payment: 'لم يتم إضافة طريقة دفع',
        next_renewal: 'التجديد القادم',
        popular: 'الأكثر شيوعاً',
        current: 'الخطة الحالية',
        select: 'اختيار الخطة',
        upgrade_confirm: 'تأكيد تغيير الخطة؟'
      },
      team: {
        title: 'إدارة الفريق',
        add_member: 'إضافة عضو',
        table_name: 'الاسم',
        table_role: 'الدور',
        table_email: 'البريد الإلكتروني',
        table_status: 'الحالة',
        table_actions: 'الإجراءات',
        modal_title: 'إضافة عضو فريق جديد'
      },
      notifications: {
        title: 'تفضيلات الإشعارات',
        email_alerts: 'تنبيهات البريد',
        email_desc: 'تلقي تحديثات حول الفواتير والطلبات وتنبيهات النظام.',
        browser_push: 'إشعارات المتصفح',
        browser_desc: 'الحصول على إشعارات دفع في متصفحك.',
        weekly_reports: 'التقارير الأسبوعية',
        weekly_desc: 'تلقي ملخص أسبوعي لأداء العمل.',
        save: 'حفظ التفضيلات'
      },
      security: {
        title: 'إعدادات الأمان',
        change_password: 'تغيير كلمة المرور',
        current_password: 'كلمة المرور الحالية',
        new_password: 'كلمة المرور الجديدة',
        confirm_password: 'تأكيد كلمة المرور',
        update_password: 'تحديث كلمة المرور',
        two_factor: 'المصادقة الثنائية',
        two_factor_desc: 'أضف طبقة أمان إضافية لحسابك.',
        enable_2fa: 'تفعيل 2FA'
      }
    },
    auth: {
      welcome_back: 'مرحبًا بعودتك',
      create_account: 'إنشاء حساب',
      admin_access: 'دخول لوحة تحكم المسؤول',
      enterprise_login: 'دخول المؤسسات',
      sign_in: 'تسجيل الدخول',
      access_console: 'Access Console',
      log_in_sso: 'الدخول عبر تسجيل الدخول الموحد (SSO)',
      full_name: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirm_password: 'تأكيد كلمة المرور',
      remember_me: 'تذكرني لمدة 30 يومًا',
      forgot_password: 'نسيت كلمة المرور؟',
      company_login: 'دخول الشركة',
      platform_admin: 'مسؤول المنصة',
      sso_button: 'تسجيل الدخول الموحد (SSO)',
      back_email: 'العودة للبريد وكلمة المرور',
      dont_have_account: "ليس لديك حساب؟",
      already_have_account: "لديك حساب بالفعل؟",
      signup_now: 'سجل الآن',
      login_link: 'سجل الدخول',
      secure_env: 'بيئة آمنة',
      hero_title: 'أدر عملك بذكاء.',
      hero_subtitle: 'Nexus ERP يجمع بين إدارة العملاء، المخزون، المالية، والموارد البشرية في منصة واحدة مدعومة بالذكاء الاصطناعي ومصممة للنمو.',
      feature_financial: 'تحليلات مالية فورية',
      feature_inventory: 'توقعات المخزون بالذكاء الاصطناعي',
      feature_hr: 'سير عمل الموارد البشرية والرواتب الآلي'
    },
    crm: {
      title: 'العملاء',
      search_placeholder: 'بحث عن العملاء...',
      add_customer: 'إضافة عميل',
      selected: 'محدد',
      mark_active: 'تحديد كنشط',
      mark_inactive: 'تحديد كغير نشط',
      mass_email: 'بريد جماعي',
      delete: 'حذف',
      table: {
        customer: 'العميل',
        status: 'الحالة',
        revenue: 'الإيرادات',
        contact: 'الاتصال',
        actions: 'الإجراءات',
        installments: 'الأقساط'
      },
      no_results: 'لم يتم العور على عملاء.',
      financial_history: {
        title: 'السجل المالي',
        total_installment_value: 'إجمالي قيمة الأقساط',
        amount_paid: 'المبلغ المدفوع',
        amount_pending: 'المبلغ المتبقي',
        installment_schedule: 'جدول الأقساط',
        invoice_num: 'رقم الفاتورة',
        due_date: 'تاريخ الاستحقاق',
        amount: 'المبلغ',
        status: 'الحالة',
        payment_date: 'تاريخ السداد',
        no_installments: 'لا توجد أقساط لهذا العميل.',
        close: 'إغلاق'
      },
      modal: {
        edit_title: 'تعديل العميل',
        add_title: 'إضافة عميل جديد',
        basic_info: 'المعلومات الأساسية',
        full_name: 'الاسم الكامل',
        company: 'الشركة',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        business_details: 'تفاصيل العمل',
        industry: 'الصناعة',
        website: 'الموقع الإلكتروني',
        address: 'العنوان',
        system_status: 'حالة النظام',
        annual_revenue: 'الأساسية الإيرادات ($)',
        status: 'الحالة',
        status_lead: 'عميل محتمل',
        status_active: 'نشط',
        status_inactive: 'غير نشط',
        notes: 'ملاحظات',
        notes_placeholder: 'ملاحظات داخلية حول هذا العميل...',
        save_changes: 'حفظ التغييرات',
        add_btn: 'إضافة العميل'
      }
    },
    tasks: {
      title: 'المهام والأنشطة',
      view_list: 'القائمة',
      view_analysis: 'التحليل',
      search_placeholder: 'البحث في المهام...',
      status_all: 'كل الحالات',
      status_pending: 'قيد الانتظار',
      status_in_progress: 'جاري التنفيذ',
      status_completed: 'مكتمل',
      new_task: 'مهمة جديدة',
      priority: {
        high: 'عالية',
        medium: 'متوسطة',
        low: 'منخفضة'
      },
      mark_done: 'تحديد كمكتمل',
      done: 'تم',
      related_to: 'متعلق بـ',
      assigned_to: 'معين لـ',
      no_results: 'لم يتم العثور على مهام تطابق عوامل التصفية.',
      kpi: {
        total: 'إجمالي المهام',
        completion_rate: 'نسبة الإنجاز',
        pending: 'قيد الانتظار',
        high_priority: 'أولوية عالية نشطة'
      },
      charts: {
        status: 'حالة المهام',
        priority: 'توزيع الأولوية',
        workload: 'عبء العمل حسب العضو'
      },
      modal: {
        create_title: 'إنشاء مهمة جديدة',
        subject: 'الموضوع',
        description: 'الوصف',
        due_date: 'تاريخ الاستحقاق',
        priority: 'الأولوية',
        category: 'الفئة',
        assigned_to: 'معين لـ',
        related_to: 'متعلق بـ',
        save: 'حفظ المهمة'
      }
    },
    inventory: {
      title: 'إدارة المخزون',
      tabs: { products: 'المنتجات', locations: 'المواقع' },
      buttons: { add_item: 'إضافة عنصر', forecast: 'تنبؤ', ai_analysis: 'تحليل الذكاء الاصطناعي', add_location: 'إضافة موقع' },
      filters: { 
        search: 'البحث عن المنتجات...',
        all_categories: 'جميع الفئات', 
        all_statuses: 'جميع الحالات',
        in_stock: 'متوفر',
        low_stock: 'مخزون منخفض',
        out_of_stock: 'غير متوفر'
      },
      table: {
        info: 'معلومات المنتج', sku: 'رمز المنتج', category: 'الفئة', price: 'السعر', stock: 'المخزون', status: 'الحالة', details: 'التفاصيل',
        loc_name: 'اسم الموقع', address: 'العنوان', description: 'الوصف', items_stored: 'العناصر المخزنة'
      },
      alerts: { title: 'تنبيهات المخزون', out_of_stock: 'نفد المخزون', low_stock: 'مخزون منخفض' },
      modal: {
        add_title: 'إضافة عنصر مخزون جديد', name: 'اسم المنتج', brand: 'العلامة التجارية', color: 'اللون', sku_auto: 'رمز المنتج (تلقائي)', price: 'السعر ($)', low_stock_alert: 'تنبيه المخزون المنخفض', stock_allocation: 'تخصيص المخزون', total_stock: 'إجمالي المخزون',
        add_location_title: 'إضافة موقع جديد'
      },
      forecasting: { title: 'توقعات الطلب على المخزون', analyzing: 'جاري تحليل سجل المبيعات...' }
    },
    sales: {
      title: 'إدارة المبيعات',
      tabs: { orders: 'الطلبات', analytics: 'التحليلات' },
      buttons: { new_sale: 'بيع جديد', download_report: 'تحميل التقرير' },
      table: { order_id: 'رقم الطلب', customer: 'العميل', salesperson: 'موظف المبيعات', amount: 'المبلغ', status: 'الحالة' },
      kpi: { revenue: 'الإيرادات الشهرية', active_quotes: 'عروض أسعار نشطة', ready_ship: 'جاهز للشحن' },
      modal: { create_title: 'إنشاء طلب بيع', items: 'العناصر', add: 'إضافة', create: 'إنشاء الطلب' },
      status: { quote: 'عرض سعر', confirmed: 'مؤكد', shipped: 'تم الشحن', completed: 'مكتمل', cancelled: 'ملغى' }
    },
    purchases: {
      title: 'المشتريات',
      tabs: { orders: 'أوامر الشراء', vendors: 'الموردين', analytics: 'التحليلات' },
      buttons: { new_order: 'طلب جديد', add_vendor: 'إضافة مورد' },
      table: { po_number: 'رقم أمر الشراء', vendor: 'المورد', total: 'الإجمالي', contact: 'معلومات الاتصال', outstanding: 'مستحق', paid: 'المدفوع إجمالاً' },
      kpi: { procurement: 'المشتريات الشهرية', pending: 'موافقات معلقة', incoming: 'شحنات واردة' },
      modal: { create_po: 'إنشاء أمر شراء', vendor_details: 'تفاصيل المورد', add_vendor: 'إضافة مورد جديد' }
    },
    finance: {
      title: 'المالية',
      tabs: { invoices: 'الفواتير', installments: 'الأقساط', recurring: 'المتكررة', expenses: 'المصروفات', payables: 'الذمم الدائنة', cost_centers: 'مراكز التكلفة', ledger: 'دفتر الأستاذ العام', approvals: 'الموافقات' },
      buttons: { reports: 'التقارير', add_entry: 'إضافة قيد', record_payable: 'تسجيل ذمة', add_expense: 'إضافة مصروف', add_cost_center: 'إضافة مركز تكلفة', create_invoice: 'إنشاء فاتورة', create_payable: 'إنشاء ذمة دائنة', create_journal: 'إضافة قيد يومية' },
      kpi: { pending_invoices: 'الفواتير المعلقة', payables: 'الذمم الدائنة', collections: 'التحصيلات', receivables_trend: 'المقبوضات', unpaid_trend: 'فواتير غير مدفوعة', this_month: 'هذا الشهر' },
      search: { invoices: 'البحث في الفواتير...', recurring: 'البحث في المتكررة...', expenses: 'البحث في المصروفات...', payables: 'البحث في الذمم...', ledger: 'البحث في السجل...' },
      filters: { 
        all_customers: 'جميع العملاء', 
        all_vendors: 'جميع الموردين', 
        all_statuses: 'جميع الحالات',
        start_date: 'تاريخ البدء',
        end_date: 'تاريخ الانتهاء'
      },
      table: { 
        invoice_num: 'رقم الفاتورة', 
        due_date: 'تاريخ الاستحقاق', 
        amount: 'المبلغ', 
        status: 'الحالة', 
        category: 'الفئة', 
        description: 'الوصف', 
        debit: 'مدين (+)', 
        credit: 'دائن (-)',
        customer_sales: 'العميل / موظف المبيعات',
        ref_terms: 'المرجع / الشروط',
        installments: 'الأقساط',
        actions: 'إجراءات',
        ref_id: 'معرف المرجع',
        balance: 'الرصيد',
        schedule_id: 'معرف الجدول',
        frequency: 'التكرار',
        next_gen: 'الإصدار القادم',
        date: 'التاريخ',
        desc_link: 'الوصف / الرابط',
        vendor: 'المورد',
        reference: 'المرجع'
      },
      actions: {
        view_details: 'عرض التفاصيل الكاملة',
        view_in_crm: 'عرض في CRM',
        download_pdf: 'تحميل PDF',
        mark_paid: 'تحديد كمدفوع بالكامل',
        post_ledger: 'ترحيل إلى السجل',
        duplicate: 'تكرار',
        void_delete: 'إلغاء / حذف',
        pause_schedule: 'إيقاف الجدول مؤقتاً',
        resume_schedule: 'استئناف الجدول',
        edit_terms: 'تعديل الشروط',
        approve_expense: 'الموافقة على المصروف',
        confirm_payment: 'تأكيد السداد',
        download_receipt: 'تحميل الإيصال',
        post_gl: 'ترحيل إلى GL',
        delete_entry: 'حذف القيد',
        approve_payable: 'الموافقة على الدفع',
        pay_now: 'ادفع الآن',
        view_timeline: 'عرض المخطط الزمني',
        delete_bill: 'حذف الفاتورة',
        record_payment: 'تسجيل الدفع'
      },
      modal: {
        journal_title: 'إضافة قيد يومية',
        invoice_title: 'إنشاء فاتورة جديدة',
        expense_title: 'تسجيل مصروف جديد',
        trans_date: 'تاريخ المعاملة',
        description: 'الوصف',
        category: 'الفئة',
        debit: 'مدين (+)',
        credit: 'دائن (-)',
        customer: 'العميل',
        salesperson: 'موظف المبيعات',
        issue_date: 'تاريخ الإصدار',
        payment_terms: 'شروط الدفع',
        due_date: 'تاريخ الاستحقاق',
        payment_struct: 'هيكل الدفع',
        full_cash: 'نقدي بالكامل',
        installments: 'أقساط',
        down_payment: 'الدفعة الأولى ($)',
        period: 'مدة الأقساط (أشهر)',
        monthly: 'الالتزام الشهري',
        line_items: 'البنود',
        rate: 'المعدل',
        total: 'Total',
        save_draft: 'حفظ كمسودة',
        submit_approval: 'إرسال للموافقة',
        expense_link: 'ربط المصروف (اختياري)',
        po: 'أمر الشراء',
        project: 'اسم المشروع',
        cost_center: 'مركز التكلفة',
        record_btn: 'تسجيل المصروف',
        managed_by: 'بإدارة',
        balance_due: 'الرصيد المستحق',
        items_breakdown: 'تفاصيل البنود',
        subtotal: 'الإجمالي الفرعي',
        schedule: 'جدول الأقساط',
        history: 'سجل تغيير الحالة',
        no_history: 'لا يوجد سجل حالة لهذه الفاتورة.',
        approve: 'موافقة',
        reject: 'رفض',
        link_so: 'ربط طلب بيع (اختياري)',
        select_so: 'اختر طلب بيع'
      },
      status: {
        draft: 'مسودة',
        awaiting: 'في انتظار الموافقة',
        approved: 'تمت الموافقة',
        paid: 'مدفوع',
        rejected: 'مرفوض',
        pending: 'قيد الانتظار',
        active: 'نشط',
        paused: 'متوقف مؤقتاً',
        overdue: 'متأخر'
      }
    },
    hr: {
      tabs: { directory: 'الدليل', leave: 'الإجازات', payroll: 'الرواتب', attendance: 'الحضور' },
      buttons: { add_employee: 'إضافة موظف', new_request: 'طلب جديد', run_payroll: 'صرف الرواتب', summary: 'ملخص' },
      search_employees: 'البحث عن الموظفين...',
      search_requests: 'البحث عن الطلبات...',
      payroll: {
        title: 'سجل الرواتب',
        subtitle: 'عرض وإدارة الرواتب الشهرية.'
      },
      table: { 
        employee: 'الموظف', 
        role_dept: 'الدور والقسم', 
        details: 'التفاصيل', 
        status: 'الحالة', 
        salary: 'الراتب', 
        joined: 'تاريخ الانضمام', 
        type: 'النوع', 
        dates: 'التواريخ', 
        reason: 'السبب',
        pay_period: 'فترة الدفع',
        processed_on: 'تمت المعالجة في',
        total_employees: 'الموظفين',
        total_payout: 'إجمالي المدفوعات'
      },
      modal: { 
        add_employee: 'إضافة موظف جديد', 
        submit_leave: 'تقديم طلب إجازة',
        full_name: 'الاسم الكامل',
        employee_id: 'معرف الموظف',
        department: 'القسم',
        role: 'الدور',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        address: 'العنوان',
        contract: 'رقم العقد',
        certificate: 'الشهادة / المؤهل',
        salary: 'الراتب السنوية',
        leave_type: 'نوع الإجازة',
        start_date: 'تاريخ البدء',
        end_date: 'تاريخ الانتهاء',
        reason: 'السبب',
        submit: 'تقديم الطلب',
        add: 'إضافة الموظف'
      }
    },
    reports: {
      title: 'التحليلات والتقارير',
      subtitle: 'لوحة معلومات ذكاء الأعمال.',
      types: {
        financial: 'مالي',
        sales: 'مبيعات'
      },
      ranges: {
        thisMonth: 'هذا الشهر',
        lastMonth: 'الشهر الماضي',
        thisQuarter: 'هذا الربع',
        lastQuarter: 'الربع الأخير',
        ytd: 'منذ بداية العام',
        all: 'كل الوقت'
      },
      buttons: {
        export_pdf: 'تصدير PDF'
      },
      kpi: {
        total_revenue: 'إجمالي الإيرادات',
        total_expenses: 'إجمالي المصروفات',
        net_profit: 'صافي الربح',
        profit_margin: 'هامش الربح',
        total_sales_revenue: 'إجمالي إيرادات المبيعات',
        total_orders: 'إجمالي الطلبات',
        avg_order_value: 'متوسط قيمة الطلب',
        vs_prev: 'مقابل الفترة السابقة'
      },
      charts: {
        financial_performance: 'الأداء المالي',
        expense_breakdown: 'توزيع المصروفات',
        top_selling_products: 'المنتجات الأكثر مبيعاً',
        sales_trend: 'اتجاه المبيعات',
        daily_breakdown: 'البيع اليومي',
        sales_by_category: 'المبيعات حسب الفئة',
        sales_by_salesperson: 'موظف المبيعات',
        revenue: 'الإيرادات',
        expenses: 'المصروفات',
        profit_trend: 'اتجاه الربح',
        sales: 'مبيعات'
      }
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a NotificationProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('nexus_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'es' || savedLang === 'ar')) {
      setLanguage(savedLang);
    }
  }, []);

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('nexus_lang', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Fallback to key if translation missing
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
