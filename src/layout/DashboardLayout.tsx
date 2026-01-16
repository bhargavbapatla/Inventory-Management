import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory2 as InventoryIcon,
  ReceiptLong as OrdersIcon,
  Assessment as ReportsIcon,
  RestaurantMenu as RecipesIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

const DashboardLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const profileOpen = Boolean(profileAnchor);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

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
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerWidth = isCollapsed ? 64 : 240;

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
          <IconButton color="inherit" onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
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
            '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ px: 1, py: 1 }}>
            <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 700 }}>Inventory App</Typography>
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

      <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
