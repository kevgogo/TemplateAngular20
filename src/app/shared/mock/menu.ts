export const MENU_DATA = [
  { icon: 'bi-house', label: 'Inicio', link: '/' },

  {
    icon: 'bi-grid',
    label: 'Módulos',
    link: '/modules',
    children: [
      {
        icon: 'bi-basket',
        label: 'Ventas',
        link: '/modules/sales',
        children: [
          { icon: 'bi-bag', label: 'Pedidos', link: '/modules/sales/orders' },
          {
            icon: 'bi-plus-circle',
            label: 'Nuevo pedido',
            link: '/modules/sales/orders/new',
          },
          {
            icon: 'bi-search',
            label: 'Buscar pedidos',
            link: '/modules/sales/orders/search',
          },
          {
            icon: 'bi-diagram-3',
            label: 'Flujos de pedidos',
            link: '/modules/sales/orders/flows',
          },
          {
            icon: 'bi-gear',
            label: 'Aprobaciones de pedidos',
            link: '/modules/sales/orders/flows/approvals',
          },
          {
            icon: 'bi-sliders',
            label: 'Reglas avanzadas',
            link: '/modules/sales/orders/flows/approvals/advanced-rules',
          },
          {
            icon: 'bi-people',
            label: 'Clientes',
            link: '/modules/sales/customers',
          },
          {
            icon: 'bi-receipt',
            label: 'Facturación',
            link: '/modules/sales/invoicing',
          },
        ],
      },

      {
        icon: 'bi-truck',
        label: 'Logística',
        link: '/modules/logistics',
        children: [
          {
            icon: 'bi-box-seam',
            label: 'Inventario',
            link: '/modules/logistics/inventory',
          },
          {
            icon: 'bi-arrow-left-right',
            label: 'Movimientos de inventario',
            link: '/modules/logistics/inventory/movements',
          },
          {
            icon: 'bi-upc-scan',
            label: 'Lotes',
            link: '/modules/logistics/inventory/batches',
          },
          {
            icon: 'bi-qr-code',
            label: 'Series',
            link: '/modules/logistics/inventory/batches/series',
          },
          {
            icon: 'bi-pin-map',
            label: 'Rutas',
            link: '/modules/logistics/routes',
          },
          {
            icon: 'bi-clipboard2-check',
            label: 'Despachos',
            link: '/modules/logistics/shipments',
          },
        ],
      },

      {
        icon: 'bi-graph-up',
        label: 'Analítica',
        link: '/modules/analytics',
        children: [
          {
            icon: 'bi-speedometer',
            label: 'Dashboards',
            link: '/modules/analytics/dashboards',
          },
          { icon: 'bi-kanban', label: 'KPIs', link: '/modules/analytics/kpis' },
          {
            icon: 'bi-calendar-week',
            label: 'KPIs Semanal',
            link: '/modules/analytics/kpis/weekly',
          },
          {
            icon: 'bi-calendar3',
            label: 'KPIs Mensual',
            link: '/modules/analytics/kpis/monthly',
          },
          {
            icon: 'bi-trophy',
            label: 'Top 10 Mensual',
            link: '/modules/analytics/kpis/monthly/top10',
          },
          {
            icon: 'bi-file-earmark-bar-graph',
            label: 'Reportes',
            link: '/modules/analytics/reports',
          },
        ],
      },
    ],
  },

  {
    icon: 'bi-sliders2-vertical',
    label: 'Configuración',
    link: '/settings',
    children: [
      {
        icon: 'bi-people',
        label: 'Usuarios',
        link: '/settings/users',
        children: [
          {
            icon: 'bi-person-gear',
            label: 'Roles',
            link: '/settings/users/roles',
          },
          {
            icon: 'bi-shield-lock',
            label: 'Permisos',
            link: '/settings/users/roles/permissions',
          },
          {
            icon: 'bi-terminal',
            label: 'Condiciones',
            link: '/settings/users/roles/permissions/conditions',
          },
          {
            icon: 'bi-person-check',
            label: 'Perfiles',
            link: '/settings/users/profiles',
          },
        ],
      },
      { icon: 'bi-palette', label: 'Temas', link: '/settings/themes' },
      {
        icon: 'bi-plug',
        label: 'Integraciones',
        link: '/settings/integrations',
        children: [
          {
            icon: 'bi-cloud',
            label: 'Almacenamiento',
            link: '/settings/integrations/storage',
          },
          {
            icon: 'bi-credit-card',
            label: 'Pagos',
            link: '/settings/integrations/payments',
          },
        ],
      },
    ],
  },

  {
    icon: 'bi-info-circle',
    label: 'Ayuda',
    link: '/help',
    children: [
      { icon: 'bi-book', label: 'Documentación', link: '/help/docs' },
      { icon: 'bi-life-preserver', label: 'Soporte', link: '/help/support' },
      { icon: 'bi-bug', label: 'Reportar un problema', link: '/help/report' },
    ],
  },

  {
    icon: 'bi-box-arrow-up-right',
    label: 'Web corporativa',
    link: 'https://empresa.com',
  },
];
