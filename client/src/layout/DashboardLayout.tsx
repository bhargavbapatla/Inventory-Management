import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory2 as InventoryIcon,
  ReceiptLong as OrdersIcon,
  Assessment as ReportsIcon,
  RestaurantMenu as RecipesIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const DashboardLayout = () => {
  const { logout, user, theme: appTheme } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const profileOpen = Boolean(profileAnchor);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const notificationsOpen = Boolean(notificationsAnchor);
  const orders = useSelector((state: RootState) => state.orders.items);
  const [unreadOrderIds, setUnreadOrderIds] = useState<string[]>([]);
  useEffect(() => {
    setUnreadOrderIds((prev) => {
      const currentIds = orders.map((o) => o.id);
      const existing = new Set(prev);
      const next = [...prev];
      currentIds.forEach((id) => {
        if (!existing.has(id)) {
          next.push(id);
          existing.add(id);
        }
      });
      const currentSet = new Set(currentIds);
      return next.filter((id) => currentSet.has(id));
    });
  }, [orders]);
  const sortedOrders = [...orders].sort((a, b) => Number(b.id) - Number(a.id));
  const unreadOrders = sortedOrders.filter((order) => unreadOrderIds.includes(order.id));
  const visibleNotifications = unreadOrders.slice(0, 5);

  const menuItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      label: 'Inventory',
      to: '/inventory',
      icon: <InventoryIcon fontSize="small" />,
    },
    {
      label: 'Recipes',
      to: '/recipes',
      icon: <RecipesIcon fontSize="small" />,
    },
    {
      label: 'Orders',
      to: '/dashboard/orders',
      icon: <OrdersIcon fontSize="small" />,
    },
    {
      label: 'Reports & Analysis',
      to: '/dashboard/reports',
      icon: <ReportsIcon fontSize="small" />,
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: <SettingsIcon fontSize="small" />,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerWidth = isCollapsed ? 64 : 240;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: appTheme.surface,
        color: appTheme.text,
        fontFamily: appTheme.fontFamily,
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          zIndex: (mui) => mui.zIndex.drawer + 1,
          bgcolor: appTheme.background,
          color: appTheme.text,
          boxShadow: 'none',
          borderBottom: `1px solid ${appTheme.border}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => (isMobile ? setMobileOpen((v) => !v) : setIsCollapsed((v) => !v))}
            sx={{ mr: 2 }}
            aria-label={isMobile ? (mobileOpen ? 'Close menu' : 'Open menu') : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 600, color: appTheme.text }}
          >
            PantryPilot
          </Typography>
          <IconButton color="inherit" onClick={(e) => setNotificationsAnchor(e.currentTarget)} sx={{ mr: 1 }}>
            <Badge
              badgeContent={unreadOrderIds.length}
              color="error"
              overlap="circular"
              invisible={unreadOrderIds.length === 0}
            >
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: appTheme.primary,
                color: appTheme.primaryText,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={notificationsAnchor}
            open={notificationsOpen}
            onClose={() => setNotificationsAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {visibleNotifications.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2">No new notifications</Typography>
              </MenuItem>
            ) : (
              <>
                <MenuItem
                  onClick={() => {
                    setUnreadOrderIds([]);
                  }}
                >
                  <Typography variant="body2" color="primary">
                    Mark all as read
                  </Typography>
                </MenuItem>
                <Divider />
                {visibleNotifications.map((order) => (
                  <MenuItem
                    key={order.id}
                    onClick={() => {
                      setUnreadOrderIds((prev) => prev.filter((id) => id !== order.id));
                      navigate('/dashboard/orders');
                      setNotificationsAnchor(null);
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: 260 }}>
                      <Typography variant="body2" noWrap>
                        {order.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        <span className="mr-1">{order.orderDate}</span>
                        <span
                          className={
                            order.status === 'Pending'
                              ? 'inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800'
                              : order.status === 'Completed'
                              ? 'inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800'
                              : 'inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800'
                          }
                        >
                          {order.status}
                        </span>
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
          <Menu
            anchorEl={profileAnchor}
            open={profileOpen}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email || 'User'}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer (temporary) */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              bgcolor: appTheme.background,
              color: appTheme.text,
              borderRight: `1px solid ${appTheme.border}`,
            },
          }}
        >
          <Toolbar />
          <Box sx={{ px: 1, py: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ px: 2, py: 1, fontWeight: 700, color: appTheme.text }}
            >
              Inventory App
            </Typography>
            <List>
              {menuItems.map((item) => (
                <ListItemButton
                  key={item.to}
                  component={Link}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: appTheme.background,
              color: appTheme.text,
              borderRight: `1px solid ${appTheme.border}`,
            },
          }}
        >
          <Toolbar />
          <Box sx={{ px: 1, py: 1 }}>
            {!isCollapsed && (
              <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 700 }}>Inventory App</Typography>
            )}
            <List>
              {menuItems.map((item) => (
                <Tooltip key={item.to} title={isCollapsed ? item.label : ''} placement="right">
                  <ListItemButton component={Link} to={item.to} sx={{ px: isCollapsed ? 1.5 : 2 }}>
                    <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 40, mr: isCollapsed ? 0 : 1.5 }}>
                      {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && <ListItemText primary={item.label} />}
                  </ListItemButton>
                </Tooltip>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: appTheme.surface,
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
